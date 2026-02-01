<?php
/**
 * HR Core Client Interface
 * Payroll, Compensation, HMO, and Analytics MUST use this interface to get employee/organization data.
 * Never query HR Core database tables directly from other modules.
 */

interface HRCoreClientInterface
{
    /**
     * Get employee by ID for consumption by other modules (e.g. Payroll).
     * Returns null if not found or module unavailable (use fallback/circuit breaker).
     *
     * @return EmployeeDTO|null
     */
    public function getEmployeeById($employeeId);

    /**
     * Get multiple employees by IDs (e.g. for batch payroll).
     * Returns array keyed by employee ID; missing IDs are omitted.
     *
     * @return array<string, EmployeeDTO>
     */
    public function getEmployeesByIds(array $employeeIds);

    /**
     * Check if employee exists and is active (e.g. for HMO enrollment).
     * @return bool
     */
    public function isEmployeeActive($employeeId);

    /**
     * Get department ID for an employee (e.g. for compensation rules).
     * @return string|null
     */
    public function getEmployeeDepartmentId($employeeId);
}
