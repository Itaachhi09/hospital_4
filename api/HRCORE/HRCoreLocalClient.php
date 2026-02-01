<?php
/**
 * HR Core Local Client (In-Process Implementation)
 * Implements HRCoreClientInterface by reading from HR Core's own database.
 * Use this when Payroll/Compensation/HMO run in the same app; use HRCoreApiClient for cross-process.
 * Only this class (and HR Core endpoints) may query employees/departments; other modules must use this interface.
 */

require_once __DIR__ . '/../contracts/DTOs/EmployeeDTO.php';
require_once __DIR__ . '/../contracts/Interfaces/HRCoreClientInterface.php';

class HRCoreLocalClient implements HRCoreClientInterface
{
    private $conn;

    /**
     * @param mysqli $conn Database connection (HR Core schema)
     */
    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    /**
     * @param string $employeeId
     * @return EmployeeDTO|null
     */
    public function getEmployeeById($employeeId)
    {
        $sql = "SELECT e.id, e.first_name, e.last_name, e.email, e.phone, e.department_id, e.position,
                e.base_salary, e.status, e.hire_date, e.employment_type,
                d.name AS department_name
                FROM employees e
                LEFT JOIN departments d ON d.id = e.department_id
                WHERE e.id = ?";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return null;
        }
        $stmt->bind_param('s', $employeeId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result ? $result->fetch_assoc() : null;
        $stmt->close();

        if (!$row) {
            return null;
        }

        $data = [
            'id' => $row['id'],
            'employee_code' => $row['id'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'department_id' => $row['department_id'],
            'department_name' => $row['department_name'] ?? null,
            'position_id' => $row['position'] ?? null,
            'position_name' => $row['position'] ?? null,
            'base_salary' => $row['base_salary'],
            'status' => $row['status'],
            'hire_date' => $row['hire_date'],
            'employment_type' => $row['employment_type'],
        ];
        return new EmployeeDTO($data);
    }

    /**
     * @param array $employeeIds
     * @return array<string, EmployeeDTO>
     */
    public function getEmployeesByIds(array $employeeIds)
    {
        $result = [];
        foreach (array_unique($employeeIds) as $id) {
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
}
