<?php
/**
 * HR Core API Client
 * Implements HRCoreClientInterface by calling HR Core API (internal HTTP or in-process).
 * Used by Payroll, Compensation, HMO, Analytics. Never by direct DB access.
 */

require_once __DIR__ . '/../DTOs/EmployeeDTO.php';
require_once __DIR__ . '/../Interfaces/HRCoreClientInterface.php';

class HRCoreApiClient implements HRCoreClientInterface
{
    private $baseUrl;
    private $getTokenCallback;
    private $circuitBreaker;
    private $retryHelper;

    /**
     * @param string   $baseUrl           e.g. http://localhost/api
     * @param callable $getTokenCallback   function(): string  (JWT for internal calls)
     * @param object   $circuitBreaker    optional CircuitBreaker instance
     * @param object   $retryHelper        optional RetryHelper instance
     */
    public function __construct($baseUrl, callable $getTokenCallback = null, $circuitBreaker = null, $retryHelper = null)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->getTokenCallback = $getTokenCallback;
        $this->circuitBreaker = $circuitBreaker;
        $this->retryHelper = $retryHelper;
    }

    /**
     * @param string $employeeId
     * @return EmployeeDTO|null
     */
    public function getEmployeeById($employeeId)
    {
        $key = 'hrcore.getEmployee.' . $employeeId;
        if ($this->circuitBreaker && !$this->circuitBreaker->allowRequest($key)) {
            return null;
        }

        $fetch = function () use ($employeeId) {
            return $this->fetchEmployee($employeeId);
        };

        $result = $this->retryHelper ? $this->retryHelper->execute($fetch, $key) : $fetch();

        if ($result === null && $this->circuitBreaker) {
            $this->circuitBreaker->recordFailure($key);
        } elseif ($result !== null && $this->circuitBreaker) {
            $this->circuitBreaker->recordSuccess($key);
        }

        return $result;
    }

    /**
     * @param array $employeeIds
     * @return array<string, EmployeeDTO>
     */
    public function getEmployeesByIds(array $employeeIds)
    {
        $result = [];
        foreach ($employeeIds as $id) {
            $dto = $this->getEmployeeById($id);
            if ($dto !== null) {
                $result[$id] = $dto;
            }
        }
        return $result;
    }

    /**
     * @param string $employeeId
     * @return bool
     */
    public function isEmployeeActive($employeeId)
    {
        $dto = $this->getEmployeeById($employeeId);
        return $dto !== null && $dto->status === 'active';
    }

    /**
     * @param string $employeeId
     * @return string|null
     */
    public function getEmployeeDepartmentId($employeeId)
    {
        $dto = $this->getEmployeeById($employeeId);
        return $dto ? $dto->departmentId : null;
    }

    /**
     * Internal: HTTP GET to HR Core API
     * @param string $employeeId
     * @return EmployeeDTO|null
     */
    private function fetchEmployee($employeeId)
    {
        $url = $this->baseUrl . '/v1/hrcore/employees/' . urlencode($employeeId);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_HTTPHEADER => $this->buildHeaders(),
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || $response === false) {
            return null;
        }

        $data = json_decode($response, true);
        if (!$data || empty($data['data'])) {
            return null;
        }

        return new EmployeeDTO($data['data']);
    }

    private function buildHeaders()
    {
        $headers = ['Content-Type: application/json'];
        if ($this->getTokenCallback) {
            $token = call_user_func($this->getTokenCallback);
            if ($token) {
                $headers[] = 'Authorization: Bearer ' . $token;
            }
        }
        return $headers;
    }
}
