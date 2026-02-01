<?php
/**
 * Circuit Breaker
 * When failures exceed threshold for a key, stop calling (open) until cooldown.
 * Prevents cascade failures when a dependent module (e.g. HR Core) is down.
 */

class CircuitBreaker
{
    private $failureCount = [];
    private $lastFailureTime = [];
    private $failureThreshold;
    private $cooldownSeconds;
    private $storagePath;

    /**
     * @param int    $failureThreshold  Number of failures before opening (e.g. 5)
     * @param int    $cooldownSeconds   Seconds before trying again (e.g. 60)
     * @param string $storagePath       Optional file path for persistence (e.g. sys_get_temp_dir() . '/hr4_circuit')
     */
    public function __construct($failureThreshold = 5, $cooldownSeconds = 60, $storagePath = null)
    {
        $this->failureThreshold = max(1, (int) $failureThreshold);
        $this->cooldownSeconds = max(1, (int) $cooldownSeconds);
        $this->storagePath = $storagePath ?: (sys_get_temp_dir() . '/hr4_circuit_breaker.json');
        $this->loadState();
    }

    /**
     * Whether a request is allowed (circuit closed or after cooldown).
     *
     * @param string $key e.g. "hrcore.getEmployee"
     * @return bool
     */
    public function allowRequest($key)
    {
        $this->loadState();
        if (!isset($this->failureCount[$key]) || $this->failureCount[$key] < $this->failureThreshold) {
            return true;
        }
        $last = $this->lastFailureTime[$key] ?? 0;
        if (time() - $last >= $this->cooldownSeconds) {
            $this->failureCount[$key] = 0;
            $this->saveState();
            return true;
        }
        return false;
    }

    /**
     * Record a failure for the key.
     *
     * @param string $key
     */
    public function recordFailure($key)
    {
        if (!isset($this->failureCount[$key])) {
            $this->failureCount[$key] = 0;
        }
        $this->failureCount[$key]++;
        $this->lastFailureTime[$key] = time();
        $this->saveState();
    }

    /**
     * Record success; reset failure count for the key.
     *
     * @param string $key
     */
    public function recordSuccess($key)
    {
        $this->failureCount[$key] = 0;
        if (isset($this->lastFailureTime[$key])) {
            unset($this->lastFailureTime[$key]);
        }
        $this->saveState();
    }

    /**
     * Check if circuit is open for key (caller may return 503 or fallback).
     *
     * @param string $key
     * @return bool
     */
    public function isOpen($key)
    {
        return !$this->allowRequest($key) && isset($this->failureCount[$key]) && $this->failureCount[$key] >= $this->failureThreshold;
    }

    private function loadState()
    {
        if (!file_exists($this->storagePath)) {
            return;
        }
        $data = @json_decode(file_get_contents($this->storagePath), true);
        if (is_array($data)) {
            $this->failureCount = $data['failureCount'] ?? [];
            $this->lastFailureTime = $data['lastFailureTime'] ?? [];
        }
    }

    private function saveState()
    {
        @file_put_contents(
            $this->storagePath,
            json_encode([
                'failureCount' => $this->failureCount,
                'lastFailureTime' => $this->lastFailureTime,
            ]),
            LOCK_EX
        );
    }
}
