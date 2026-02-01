<?php
/**
 * Payroll Computation Engine
 * Handles all salary calculations for Philippine hospital payroll
 * Includes: base salary, overtime, night differential, holiday pay, hazard pay, and statutory deductions
 * Employee data is obtained via HRCoreClientInterface (no direct HR DB access).
 */

require_once __DIR__ . '/../contracts/Interfaces/HRCoreClientInterface.php';

class PayrollComputationEngine {
    private $conn;
    private $policies = [];
    private $contribution_rates = [];
    private $tax_brackets = [];
    /** @var HRCoreClientInterface|null */
    private $hrCoreClient = null;

    /**
     * @param mysqli $dbConnection Payroll DB connection (payroll_* tables only)
     * @param HRCoreClientInterface|null $hrCoreClient Optional. When set, employee data is fetched via interface (no direct HR DB access).
     */
    public function __construct($dbConnection, $hrCoreClient = null) {
        $this->conn = $dbConnection;
        $this->hrCoreClient = $hrCoreClient;
        $this->loadPolicies();
        $this->loadContributionRates();
        $this->loadTaxBrackets();
    }
    
    /**
     * Load payroll policies from database
     */
    private function loadPolicies() {
        $sql = "SELECT policy_key, policy_value, data_type FROM payroll_policies WHERE status = 'active'";
        $result = $this->conn->query($sql);
        
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $key = $row['policy_key'];
                $value = $row['policy_value'];
                
                // Convert data types
                if ($row['data_type'] === 'boolean') {
                    $this->policies[$key] = $value === 'true';
                } elseif ($row['data_type'] === 'number' || $row['data_type'] === 'percentage') {
                    $this->policies[$key] = (float)$value;
                } else {
                    $this->policies[$key] = $value;
                }
            }
        }
    }
    
    /**
     * Load Philippine contribution rates
     */
    private function loadContributionRates() {
        $sql = "SELECT contribution_type, employee_rate, employer_rate, salary_ceiling, salary_floor 
                FROM contribution_rates WHERE status = 'active' AND effective_date <= NOW()
                ORDER BY effective_date DESC LIMIT 4";
        
        $result = $this->conn->query($sql);
        
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $this->contribution_rates[$row['contribution_type']] = $row;
            }
        }
    }
    
    /**
     * Load BIR tax brackets for current year
     */
    private function loadTaxBrackets() {
        $currentYear = date('Y');
        $sql = "SELECT * FROM bir_tax_brackets WHERE effective_year = ? AND status = 'active' 
                ORDER BY bracket_min ASC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('i', $currentYear);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            $this->tax_brackets = [];
            while ($row = $result->fetch_assoc()) {
                $this->tax_brackets[] = $row;
            }
        }
        $stmt->close();
    }
    
    /**
     * Compute gross salary for an employee for a specific period
     * @param string $employeeId - Employee ID
     * @param string $periodStart - Pay period start date (YYYY-MM-DD format)
     * @param string $periodEnd - Pay period end date (YYYY-MM-DD format)
     * @return array - Detailed salary computation
     */
    public function computeGrossSalary(string $employeeId, string $periodStart, string $periodEnd): array {
        // Get employee data
        $employee = $this->getEmployeeData($employeeId);
        if (!$employee) {
            throw new Exception('Employee not found');
        }
        
        $baseSalary = $employee['base_salary'];
        $hourlyRate = $baseSalary / 22 / 8; // Assuming 22 working days, 8 hours/day
        $dailyRate = $baseSalary / 22;
        
        // Initialize computation array
        $computation = [
            'employee_id' => $employeeId,
            'base_salary' => $baseSalary,
            'hourly_rate' => $hourlyRate,
            'daily_rate' => $dailyRate,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
        ];
        
        // Calculate working days and hours
        $workingDaysData = $this->calculateWorkingDays($employeeId, $periodStart, $periodEnd);
        $computation['total_days'] = $workingDaysData['total_days'];
        $computation['present_days'] = $workingDaysData['present_days'];
        $computation['absent_days'] = $workingDaysData['absent_days'];
        $computation['leave_days'] = $workingDaysData['leave_days'];
        
        // Calculate attendance-based hours
        $computation['working_hours'] = $workingDaysData['working_hours'];
        
        // Calculate overtime pay
        $overtimeData = $this->calculateOvertime($employeeId, $periodStart, $periodEnd, $hourlyRate);
        $computation['overtime_hours'] = $overtimeData['hours'];
        $computation['overtime_amount'] = $overtimeData['amount'];
        
        // Calculate night differential
        $nightDiffData = $this->calculateNightDifferential($employeeId, $periodStart, $periodEnd, $hourlyRate);
        $computation['night_differential_hours'] = $nightDiffData['hours'];
        $computation['night_differential_amount'] = $nightDiffData['amount'];
        
        // Calculate holiday pay
        $holidayPayData = $this->calculateHolidayPay($employeeId, $periodStart, $periodEnd, $dailyRate);
        $computation['holiday_pay_regular'] = $holidayPayData['regular'];
        $computation['holiday_pay_special'] = $holidayPayData['special'];
        
        // Calculate hazard pay (for medical staff)
        $hazardPay = $this->calculateHazardPay($employeeId, $baseSalary, $workingDaysData['present_days']);
        $computation['hazard_pay'] = $hazardPay;
        
        // Get employee allowances
        $allowancesData = $this->calculateAllowances($employeeId);
        $computation['allowances'] = $allowancesData['total'];
        $computation['allowances_detail'] = $allowancesData['detail'];
        
        // Calculate gross pay
        $computation['gross_pay'] = $baseSalary 
            + $computation['overtime_amount'] 
            + $computation['night_differential_amount']
            + $computation['holiday_pay_regular']
            + $computation['holiday_pay_special']
            + $computation['hazard_pay']
            + $computation['allowances'];
        
        return $computation;
    }
    
    /**
     * Calculate statutory deductions
     * @param float $grossSalary - Gross salary
     * @param string $employeeId - Employee ID
     * @return array - Deduction breakdown
     */
    public function calculateStatutoryDeductions($grossSalary, $employeeId) {
        $deductions = [
            'sss' => 0,
            'philhealth' => 0,
            'pagibig' => 0,
            'bir_tax' => 0,
            'total' => 0
        ];
        
        // SSS Contribution
        if (isset($this->contribution_rates['SSS'])) {
            $sssData = $this->contribution_rates['SSS'];
            $sssableWage = min($grossSalary, $sssData['salary_ceiling']);
            $sssableWage = max($sssableWage, $sssData['salary_floor']);
            $deductions['sss'] = round($sssableWage * $sssData['employee_rate'] / 100, 2);
        }
        
        // PhilHealth Contribution
        if (isset($this->contribution_rates['PHILHEALTH'])) {
            $philData = $this->contribution_rates['PHILHEALTH'];
            $philableWage = min($grossSalary, $philData['salary_ceiling']);
            $deductions['philhealth'] = round($philableWage * $philData['employee_rate'] / 100, 2);
        }
        
        // Pag-IBIG Contribution
        if (isset($this->contribution_rates['PAGIBIG'])) {
            $pagibigData = $this->contribution_rates['PAGIBIG'];
            $pagibigableWage = min($grossSalary, $pagibigData['salary_ceiling']);
            $deductions['pagibig'] = round($pagibigableWage * $pagibigData['employee_rate'] / 100, 2);
        }
        
        // BIR Withholding Tax
        if ($this->policies['enable_tax'] ?? true) {
            $deductions['bir_tax'] = $this->calculateBIRWithholdingTax($grossSalary, $deductions['sss']);
        }
        
        $deductions['total'] = $deductions['sss'] + $deductions['philhealth'] + $deductions['pagibig'] + $deductions['bir_tax'];
        
        return $deductions;
    }
    
    /**
     * Calculate BIR withholding tax using tax brackets
     * @param float $grossSalary - Gross monthly salary
     * @param float $sssContribution - SSS contribution (deductible)
     * @return float - BIR tax amount
     */
    public function calculateBIRWithholdingTax($grossSalary, $sssContribution) {
        $taxableIncome = $grossSalary - $sssContribution;
        
        // Apply exemption if applicable
        $exemption = 125000; // Single individual exemption
        if ($taxableIncome <= $exemption) {
            return 0;
        }
        
        $taxableAmount = $taxableIncome - $exemption;
        $annualTaxableIncome = $taxableAmount * 12;
        
        // Find applicable tax bracket
        $annualTax = 0;
        foreach ($this->tax_brackets as $bracket) {
            $bracketMin = $bracket['bracket_min'];
            $bracketMax = $bracket['bracket_max'];
            $baseTax = $bracket['base_tax'];
            $excessRate = $bracket['excess_rate'];
            
            if ($annualTaxableIncome >= $bracketMin) {
                if ($bracketMax !== null && $annualTaxableIncome > $bracketMax) {
                    $annualTax = $baseTax + (($bracketMax - $bracketMin) * $excessRate);
                } else {
                    $excessAmount = max(0, $annualTaxableIncome - $bracketMin);
                    $annualTax = $baseTax + ($excessAmount * $excessRate);
                    break;
                }
            }
        }
        
        $monthlyTax = round($annualTax / 12, 2);
        return max(0, $monthlyTax);
    }
    
    /**
     * Calculate working days and hours from attendance
     */
    private function calculateWorkingDays(string $employeeId, string $periodStart, string $periodEnd): array {
        $sql = "SELECT 
                    COUNT(*) as total_records,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                    SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days,
                    SUM(CASE WHEN status = 'present' THEN total_hours ELSE 0 END) as working_hours
                FROM attendance_records
                WHERE employee_id = ? AND attendance_date BETWEEN ? AND ? AND status IN ('present', 'absent', 'leave')";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('sss', $employeeId, $periodStart, $periodEnd);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        $result = $row ?? [
            'total_days' => 0,
            'present_days' => 0,
            'absent_days' => 0,
            'leave_days' => 0,
            'working_hours' => 0
        ];
        
        return $result;
    }
    
    /**
     * Calculate overtime pay
     */
    private function calculateOvertime($employeeId, $periodStart, $periodEnd, $hourlyRate) {
        $sql = "SELECT 
                    SUM(overtime_hours) as total_ot_hours,
                    SUM(CASE WHEN is_holiday = FALSE AND is_special_holiday = FALSE THEN overtime_hours ELSE 0 END) as regular_ot_hours,
                    SUM(CASE WHEN is_holiday = TRUE AND is_special_holiday = FALSE THEN overtime_hours ELSE 0 END) as holiday_ot_hours,
                    SUM(CASE WHEN is_special_holiday = TRUE THEN overtime_hours ELSE 0 END) as special_holiday_ot_hours
                FROM attendance_records
                WHERE employee_id = ? AND attendance_date BETWEEN ? AND ? AND is_overtime = TRUE";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('sss', $employeeId, $periodStart, $periodEnd);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        $regularOTHours = $row['regular_ot_hours'] ?? 0;
        $holidayOTHours = $row['holiday_ot_hours'] ?? 0;
        $specialHolidayOTHours = $row['special_holiday_ot_hours'] ?? 0;
        
        $overtimeRate = $this->policies['overtime_rate_regular'] ?? 1.25;
        $holidayOTRate = $this->policies['overtime_rate_holiday'] ?? 1.69;
        $specialHolidayOTRate = $this->policies['overtime_rate_special_holiday'] ?? 1.95;
        
        $totalOTAmount = 
            ($regularOTHours * $hourlyRate * $overtimeRate) +
            ($holidayOTHours * $hourlyRate * $holidayOTRate) +
            ($specialHolidayOTHours * $hourlyRate * $specialHolidayOTRate);
        
        return [
            'hours' => $regularOTHours + $holidayOTHours + $specialHolidayOTHours,
            'amount' => round($totalOTAmount, 2)
        ];
    }
    
    /**
     * Calculate night differential pay
     */
    private function calculateNightDifferential($employeeId, $periodStart, $periodEnd, $hourlyRate) {
        $sql = "SELECT SUM(total_hours) as night_hours
                FROM attendance_records
                WHERE employee_id = ? AND attendance_date BETWEEN ? AND ? AND is_night_shift = TRUE";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('sss', $employeeId, $periodStart, $periodEnd);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        $nightHours = $row['night_hours'] ?? 0;
        $nightDiffPercent = $this->policies['night_differential_percent'] ?? 10;
        $nightDiffAmount = round($nightHours * $hourlyRate * ($nightDiffPercent / 100), 2);
        
        return [
            'hours' => $nightHours,
            'amount' => $nightDiffAmount
        ];
    }
    
    /**
     * Calculate holiday pay
     */
    private function calculateHolidayPay($employeeId, $periodStart, $periodEnd, $dailyRate) {
        $sql = "SELECT 
                    SUM(CASE WHEN hc.holiday_type = 'regular' THEN 1 ELSE 0 END) as regular_holidays,
                    SUM(CASE WHEN hc.holiday_type = 'special' THEN 1 ELSE 0 END) as special_holidays
                FROM attendance_records ar
                LEFT JOIN holiday_calendar hc ON ar.attendance_date = hc.holiday_date
                WHERE ar.employee_id = ? AND ar.attendance_date BETWEEN ? AND ? 
                AND ar.is_holiday = TRUE AND ar.status = 'present'";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('sss', $employeeId, $periodStart, $periodEnd);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        $regularMultiplier = $this->policies['holiday_pay_regular'] ?? 1;
        $specialMultiplier = $this->policies['holiday_pay_special'] ?? 1.3;
        
        $regularHolidayPay = round(($row['regular_holidays'] ?? 0) * $dailyRate * $regularMultiplier, 2);
        $specialHolidayPay = round(($row['special_holidays'] ?? 0) * $dailyRate * $specialMultiplier, 2);
        
        return [
            'regular' => $regularHolidayPay,
            'special' => $specialHolidayPay
        ];
    }
    
    /**
     * Calculate hazard pay for medical staff
     */
    private function calculateHazardPay($employeeId, $baseSalary, $workingDays) {
        // Check if employee is entitled to hazard pay (medical staff)
        $sql = "SELECT position FROM employees WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $employeeId);
        $stmt->execute();
        $result = $stmt->get_result();
        $employee = $result->fetch_assoc();
        $stmt->close();
        
        // Medical positions entitled to hazard pay
        $medicalPositions = ['Nurse', 'Doctor', 'Physician', 'Therapist', 'Technician', 'Lab Technician'];
        $isEligible = false;
        
        if ($employee) {
            foreach ($medicalPositions as $position) {
                if (strpos(strtolower($employee['position']), strtolower($position)) !== false) {
                    $isEligible = true;
                    break;
                }
            }
        }
        
        if ($isEligible) {
            $hazardPercent = $this->policies['hazard_pay_percent'] ?? 10;
            $hazardPayPerDay = ($baseSalary / 22) * ($hazardPercent / 100);
            return round($hazardPayPerDay * $workingDays, 2);
        }
        
        return 0;
    }
    
    /**
     * Calculate employee allowances
     */
    private function calculateAllowances($employeeId) {
        $sql = "SELECT ea.id, ea.allowance_name, ea.fixed_amount, ea.percentage_amount, ea.remarks
                FROM employee_allowances ea
                JOIN employees e ON ea.employee_id = e.id
                WHERE ea.employee_id = ? AND ea.status = 'approved'";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $employeeId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $totalAllowances = 0;
        $detail = [];
        
        while ($row = $result->fetch_assoc()) {
            $allowanceAmount = $row['fixed_amount'] ?? 0;
            $detail[] = [
                'name' => $row['allowance_name'],
                'amount' => $allowanceAmount
            ];
            $totalAllowances += $allowanceAmount;
        }
        
        $stmt->close();
        
        return [
            'total' => $totalAllowances,
            'detail' => $detail
        ];
    }
    
    /**
     * Get employee data via HRCoreClientInterface (preferred) or legacy direct query.
     * When hrCoreClient is set, Payroll does NOT access employees table directly.
     */
    private function getEmployeeData($employeeId) {
        if ($this->hrCoreClient !== null) {
            $dto = $this->hrCoreClient->getEmployeeById($employeeId);
            if ($dto === null) {
                return null;
            }
            return [
                'id' => $dto->id,
                'first_name' => $dto->firstName,
                'last_name' => $dto->lastName,
                'base_salary' => $dto->baseSalary,
                'position' => $dto->positionName ?? $dto->positionId,
                'employment_type' => $dto->employmentType,
                'department_id' => $dto->departmentId,
            ];
        }
        // Legacy: direct DB (deprecated; use HRCoreClientInterface for new code)
        $sql = "SELECT id, first_name, last_name, base_salary, position, employment_type, department_id
                FROM employees WHERE id = ? AND status = 'active'";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $employeeId);
        $stmt->execute();
        $result = $stmt->get_result();
        $employee = $result->fetch_assoc();
        $stmt->close();
        return $employee;
    }
    
    /**
     * Get all policies as array
     */
    public function getPolicies() {
        return $this->policies;
    }
}

?>
