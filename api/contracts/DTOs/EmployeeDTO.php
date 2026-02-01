<?php
/**
 * Employee Data Transfer Object
 * Used for cross-module communication. HR Core returns this; Payroll/Compensation/HMO consume it.
 * Never pass raw DB rows across module boundaries.
 */

final class EmployeeDTO
{
    public string $id;
    public string $employeeCode;
    public string $firstName;
    public string $lastName;
    public string $email;
    public ?string $phone;
    public ?string $departmentId;
    public ?string $departmentName;
    public ?string $positionId;
    public ?string $positionName;
    public ?float $baseSalary;
    public string $status;
    public ?string $hireDate;
    public ?string $employmentType;

    public function __construct(array $data)
    {
        $this->id = (string)($data['id'] ?? '');
        $this->employeeCode = (string)($data['employee_code'] ?? $data['employeeCode'] ?? '');
        $this->firstName = (string)($data['first_name'] ?? $data['firstName'] ?? '');
        $this->lastName = (string)($data['last_name'] ?? $data['lastName'] ?? '');
        $this->email = (string)($data['email'] ?? '');
        $this->phone = isset($data['phone']) ? (string)$data['phone'] : null;
        $this->departmentId = isset($data['department_id']) ? (string)$data['department_id'] : (isset($data['departmentId']) ? (string)$data['departmentId'] : null);
        $this->departmentName = isset($data['department_name']) ? (string)$data['department_name'] : (isset($data['departmentName']) ? (string)$data['departmentName'] : null);
        $this->positionId = isset($data['position_id']) ? (string)$data['position_id'] : (isset($data['positionId']) ? (string)$data['positionId'] : null);
        $this->positionName = isset($data['position_name']) ? (string)$data['position_name'] : (isset($data['positionName']) ? (string)$data['positionName'] : null);
        $this->baseSalary = isset($data['base_salary']) ? (float)$data['base_salary'] : (isset($data['baseSalary']) ? (float)$data['baseSalary'] : null);
        $this->status = (string)($data['status'] ?? 'active');
        $this->hireDate = isset($data['hire_date']) ? (string)$data['hire_date'] : (isset($data['hireDate']) ? (string)$data['hireDate'] : null);
        $this->employmentType = isset($data['employment_type']) ? (string)$data['employment_type'] : (isset($data['employmentType']) ? (string)$data['employmentType'] : null);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'employee_code' => $this->employeeCode,
            'first_name' => $this->firstName,
            'last_name' => $this->lastName,
            'email' => $this->email,
            'phone' => $this->phone,
            'department_id' => $this->departmentId,
            'department_name' => $this->departmentName,
            'position_id' => $this->positionId,
            'position_name' => $this->positionName,
            'base_salary' => $this->baseSalary,
            'status' => $this->status,
            'hire_date' => $this->hireDate,
            'employment_type' => $this->employmentType,
        ];
    }

    /** For Payroll: minimal data needed for computation */
    public static function forPayroll(array $data): self
    {
        return new self(array_merge($data, [
            'employee_code' => $data['employee_code'] ?? $data['employeeCode'] ?? '',
            'first_name' => $data['first_name'] ?? $data['firstName'] ?? '',
            'last_name' => $data['last_name'] ?? $data['lastName'] ?? '',
        ]));
    }
}
