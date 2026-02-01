<?php
/**
 * Payroll Audit Logger
 * Tracks all payroll modifications for compliance and audit trails
 */

class PayrollAuditLogger {
    private $conn;
    private $userId;
    
    public function __construct($dbConnection, $userId = null) {
        $this->conn = $dbConnection;
        $this->userId = $userId;
    }
    
    /**
     * Log payroll action
     * @param string $actionType - Type of action (create_payroll, compute_salary, approve_payroll, etc.)
     * @param string|null $payrollRunId - Payroll run ID
     * @param string|null $payslipId - Payslip ID
     * @param string|null $employeeId - Employee ID
     * @param array|null $oldValues - Previous values (for updates)
     * @param array|null $newValues - New values
     * @param string|null $reason - Reason for the action
     * @return bool - Success status
     */
    public function logAction($actionType, $payrollRunId = null, $payslipId = null, $employeeId = null, 
                              $oldValues = null, $newValues = null, $reason = null) {
        
        $logId = 'PLOG' . date('YmdHis') . rand(1000, 9999);
        $oldValuesJson = $oldValues ? json_encode($oldValues) : null;
        $newValuesJson = $newValues ? json_encode($newValues) : null;
        $actionDateTime = date('Y-m-d H:i:s');
        
        $sql = "INSERT INTO payroll_audit_log 
                (id, action_type, payroll_run_id, payslip_id, employee_id, performed_by, old_values, new_values, reason, action_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return false;
        }
        
        $stmt->bind_param('ssssssssss', 
            $logId, 
            $actionType, 
            $payrollRunId, 
            $payslipId, 
            $employeeId, 
            $this->userId, 
            $oldValuesJson, 
            $newValuesJson, 
            $reason, 
            $actionDateTime
        );
        
        $result = $stmt->execute();
        $stmt->close();
        
        return $result;
    }
    
    /**
     * Log salary computation
     */
    public function logSalaryComputation($payrollRunId, $employeeId, $computationDetails, $reason = null) {
        $reason = $reason ?? 'Automatic salary computation';
        
        return $this->logAction(
            'compute_salary',
            $payrollRunId,
            null,
            $employeeId,
            null,
            $computationDetails,
            $reason
        );
    }
    
    /**
     * Log payroll approval
     */
    public function logPayrollApproval($payrollRunId, $approvalStatus, $reason = null) {
        $reason = $reason ?? 'Payroll approval/rejection';
        
        return $this->logAction(
            'approve_payroll',
            $payrollRunId,
            null,
            null,
            ['status' => 'draft'],
            ['status' => $approvalStatus],
            $reason
        );
    }
    
    /**
     * Log payslip generation
     */
    public function logPayslipGeneration($payslipId, $payrollRunId, $employeeId, $payslipData) {
        return $this->logAction(
            'generate_payslip',
            $payrollRunId,
            $payslipId,
            $employeeId,
            null,
            $payslipData,
            'Payslip generation'
        );
    }
    
    /**
     * Log payroll adjustment
     */
    public function logPayrollAdjustment($payslipId, $employeeId, $adjustmentType, $oldValue, $newValue, $reason = null) {
        return $this->logAction(
            'adjust_payroll',
            null,
            $payslipId,
            $employeeId,
            [$adjustmentType => $oldValue],
            [$adjustmentType => $newValue],
            $reason ?? 'Payroll adjustment'
        );
    }
    
    /**
     * Get audit logs for payroll
     */
    public function getAuditLogs($payrollRunId = null, $employeeId = null, $limit = 100, $offset = 0) {
        $sql = "SELECT 
                    pal.id,
                    pal.action_type,
                    pal.payroll_run_id,
                    pal.payslip_id,
                    pal.employee_id,
                    u.name as performed_by_name,
                    pal.old_values,
                    pal.new_values,
                    pal.reason,
                    pal.action_date
                FROM payroll_audit_log pal
                LEFT JOIN users u ON pal.performed_by = u.id
                WHERE 1=1";
        
        $params = [];
        $types = '';
        
        if ($payrollRunId) {
            $sql .= " AND pal.payroll_run_id = ?";
            $params[] = $payrollRunId;
            $types .= 's';
        }
        
        if ($employeeId) {
            $sql .= " AND pal.employee_id = ?";
            $params[] = $employeeId;
            $types .= 's';
        }
        
        $sql .= " ORDER BY pal.action_date DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
        
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return [];
        }
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $logs = [];
        while ($row = $result->fetch_assoc()) {
            $row['old_values'] = $row['old_values'] ? json_decode($row['old_values'], true) : null;
            $row['new_values'] = $row['new_values'] ? json_decode($row['new_values'], true) : null;
            $logs[] = $row;
        }
        
        $stmt->close();
        return $logs;
    }
    
    /**
     * Get audit log count
     */
    public function getAuditLogCount($payrollRunId = null, $employeeId = null) {
        $sql = "SELECT COUNT(*) as count FROM payroll_audit_log WHERE 1=1";
        
        $params = [];
        $types = '';
        
        if ($payrollRunId) {
            $sql .= " AND payroll_run_id = ?";
            $params[] = $payrollRunId;
            $types .= 's';
        }
        
        if ($employeeId) {
            $sql .= " AND employee_id = ?";
            $params[] = $employeeId;
            $types .= 's';
        }
        
        $stmt = $this->conn->prepare($sql);
        if ($params) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        return $row['count'] ?? 0;
    }
    
    /**
     * Generate compliance report for audit
     */
    public function generateComplianceReport($startDate, $endDate) {
        $sql = "SELECT 
                    action_type,
                    COUNT(*) as action_count,
                    COUNT(DISTINCT employee_id) as unique_employees,
                    COUNT(DISTINCT payroll_run_id) as unique_payroll_runs
                FROM payroll_audit_log
                WHERE action_date BETWEEN ? AND ?
                GROUP BY action_type
                ORDER BY action_date DESC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('ss', $startDate, $endDate);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $report = [];
        while ($row = $result->fetch_assoc()) {
            $report[] = $row;
        }
        
        $stmt->close();
        return $report;
    }
}

?>
