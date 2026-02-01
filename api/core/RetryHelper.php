<?php
/**
 * Retry Helper
 * Execute a callable with retries and exponential backoff for transient failures.
 */

class RetryHelper
{
    private $maxAttempts;
    private $baseDelayMs;
    private $maxDelayMs;
    private $retryableHttpCodes;

    /**
     * @param int   $maxAttempts       Max number of attempts (e.g. 3)
     * @param int   $baseDelayMs       Initial delay in ms (e.g. 100)
     * @param int   $maxDelayMs        Cap delay in ms (e.g. 2000)
     * @param int[] $retryableHttpCodes HTTP codes to retry (e.g. [502, 503, 504])
     */
    public function __construct($maxAttempts = 3, $baseDelayMs = 100, $maxDelayMs = 2000, array $retryableHttpCodes = [502, 503, 504])
    {
        $this->maxAttempts = max(1, (int) $maxAttempts);
        $this->baseDelayMs = max(0, (int) $baseDelayMs);
        $this->maxDelayMs = max($this->baseDelayMs, (int) $maxDelayMs);
        $this->retryableHttpCodes = $retryableHttpCodes;
    }

    /**
     * Execute callable; on null/false or exception, retry with backoff.
     * Callable can return value or throw; throw is treated as retryable.
     *
     * @param callable $callable function(): mixed  (e.g. returns EmployeeDTO or null)
     * @param string   $key      Optional key for logging
     * @return mixed   Return value of callable on success; last return or null after all retries
     */
    public function execute(callable $callable, $key = '')
    {
        $attempt = 0;
        $lastResult = null;
        $lastException = null;

        while ($attempt < $this->maxAttempts) {
            $attempt++;
            try {
                $result = $callable();
                if ($result !== null && $result !== false) {
                    return $result;
                }
                $lastResult = $result;
            } catch (Exception $e) {
                $lastException = $e;
                if ($attempt >= $this->maxAttempts) {
                    if (function_exists('error_log')) {
                        error_log(sprintf('RetryHelper [%s] attempt %d failed: %s', $key, $attempt, $e->getMessage()));
                    }
                    throw $e;
                }
            }

            if ($attempt < $this->maxAttempts) {
                $delay = min(
                    $this->maxDelayMs,
                    $this->baseDelayMs * pow(2, $attempt - 1)
                );
                usleep($delay * 1000);
            }
        }

        return $lastResult;
    }
}
