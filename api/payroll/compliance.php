<?php
/**
 * BIR & Compliance Reports Endpoint
 * Generates Philippine government compliance reports and BIR forms
 * GET /api/payroll/compliance/bir-forms - List BIR forms
 * POST /api/payroll/compliance/bir-forms - Generate BIR forms
 * GET /api/payroll/compliance/payroll-reports - Get payroll reports
 * GET /api/payroll/compliance/audit-trail - Get audit log
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
@$conn = require __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../contracts/Interfaces/HRCoreClientInterface.php';
require_once __DIR__ . '/../HRCORE/HRCoreLocalClient.php';
require_once __DIR__ . '/PayrollComputationEngine.php';
require_once __DIR__ . '/PayrollAuditLogger.php';

if (!$conn) {
    http_response_code(500);
    die(ResponseHandler::error('Database connection failed'));
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$parts = explode('/', $path);

// Get action and ID
$action = isset($parts[count($parts) - 2]) ? $parts[count($parts) - 2] : null;
$subAction = isset($parts[count($parts) - 1]) ? $parts[count($parts) - 1] : null;

switch ($method) {
    case 'GET':
        if ($action === 'bir-forms') {
            handleGetBIRForms($conn);
        } elseif ($action === 'payroll-reports') {
            handleGetPayrollReports($conn);
        } elseif ($action === 'audit-trail') {
            handleGetAuditTrail($conn);
        } elseif ($action === 'monthly-summary') {
            handleGetMonthlySummary($conn);
        } else {
            http_response_code(404);
            die(ResponseHandler::error('Endpoint not found'));
        }
        break;
    
    case 'POST':
        $user = AuthMiddleware::verifyToken();
        if ($action === 'bir-forms' && $subAction === 'generate') {
            handleGenerateBIRForms($conn, $user);
        } elseif ($action === 'generate-report') {
            handleGenerateReport($conn, $user);
        } else {
            http_response_code(404);
            die(ResponseHandler::error('Endpoint not found'));
        }
        break;
    
    default:
        http_response_code(405);
        die(ResponseHandler::error('Method not allowed'));
}

/**
 * Get BIR forms
 */
function handleGetBIRForms($conn) {
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $pageSize = isset($_GET['pageSize']) ? min((int)$_GET['pageSize'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    $offset = ($page - 1) * $pageSize;
    
    // Build filters
    $whereClause = "WHERE 1=1";
    $params = [];
    $types = '';
    
    if (!empty($_GET['form_type'])) {
        $whereClause .= " AND form_type = ?";
        $params[] = $_GET['form_type'];
        $types .= 's';
    }
    
    if (!empty($_GET['year'])) {
        $whereClause .= " AND reporting_year = ?";
        $params[] = (int)$_GET['year'];
        $types .= 'i';
    }
    
    if (!empty($_GET['employee_id'])) {
        $whereClause .= " AND employee_id = ?";
        $params[] = $_GET['employee_id'];
        $types .= 's';
    }
    
    if (!empty($_GET['status'])) {
        $whereClause .= " AND form_status = ?";
        $params[] = $_GET['status'];
        $types .= 's';
    }
    
    // Count total
    $countSQL = "SELECT COUNT(*) as total FROM bir_forms $whereClause";
    $countStmt = $conn->prepare($countSQL);
    if (!empty($params)) {
        $countStmt->bind_param($types, ...$params);
    }
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $countRow = $countResult->fetch_assoc();
    $countStmt->close();
    
    // Get paginated data
    $sql = "SELECT 
                bf.*,
                e.first_name,
                e.last_name,
                e.email,
                d.name as department_name
            FROM bir_forms bf
            LEFT JOIN employees e ON bf.employee_id = e.id
            LEFT JOIN departments d ON e.department_id = d.id
            $whereClause
            ORDER BY bf.generated_date DESC
            LIMIT ? OFFSET ?";
    
    $params[] = $pageSize;
    $params[] = $offset;
    $types .= 'ii';
    
    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $forms = [];
    while ($row = $result->fetch_assoc()) {
        $forms[] = $row;
    }
    
    $stmt->close();
    
    echo ResponseHandler::paginated($forms, $countRow['total'], $page, $pageSize, 'BIR forms retrieved successfully');
}

/**
 * Get payroll reports
 */
function handleGetPayrollReports($conn) {
    $reportType = $_GET['type'] ?? 'monthly';
    $startDate = $_GET['start_date'] ?? date('Y-m-01');
    $endDate = $_GET['end_date'] ?? date('Y-m-t');
    
    if ($reportType === 'monthly') {
        // Get monthly summary
        list($year, $month) = explode('-', substr($startDate, 0, 7));
        
        $sql = "SELECT * FROM monthly_payroll_summary 
                WHERE payroll_year = ? AND payroll_month = ?
                ORDER BY department_id";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('ii', $year, $month);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $summary = [];
        while ($row = $result->fetch_assoc()) {
            $summary[] = $row;
        }
        
        $stmt->close();
        
        echo ResponseHandler::success([
            'report_type' => 'monthly',
            'period' => "$year-$month",
            'summary' => $summary
        ], 'Monthly payroll report retrieved successfully');
        
    } elseif ($reportType === 'departmental') {
        // Get departmental breakdown
        $sql = "SELECT 
                    e.department_id,
                    d.name as department_name,
                    COUNT(DISTINCT e.id) as employee_count,
                    SUM(pcd.gross_pay) as total_gross,
                    SUM(pcd.total_deductions) as total_deductions,
                    SUM(pcd.net_pay) as total_net,
                    SUM(pcd.overtime_amount) as total_overtime,
                    SUM(pcd.night_differential_amount) as total_night_diff
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN payroll_computation_details pcd ON e.id = pcd.employee_id 
                    AND pcd.pay_period_start >= ? AND pcd.pay_period_end <= ?
                WHERE e.status = 'active'
                GROUP BY e.department_id, d.name
                ORDER BY d.name";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('ss', $startDate, $endDate);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $report = [];
        while ($row = $result->fetch_assoc()) {
            $report[] = $row;
        }
        
        $stmt->close();
        
        echo ResponseHandler::success([
            'report_type' => 'departmental',
            'period_start' => $startDate,
            'period_end' => $endDate,
            'departments' => $report
        ], 'Departmental payroll report retrieved successfully');
        
    } elseif ($reportType === 'statutory') {
        // Get statutory deductions report
        $sql = "SELECT 
                    DATE_FORMAT(pcd.pay_period_start, '%Y-%m') as period,
                    SUM(pcd.sss_contribution) as total_sss,
                    SUM(pcd.philhealth_contribution) as total_philhealth,
                    SUM(pcd.pagibig_contribution) as total_pagibig,
                    SUM(pcd.bir_tax) as total_bir_tax,
                    COUNT(DISTINCT pcd.employee_id) as employee_count
                FROM payroll_computation_details pcd
                WHERE pcd.pay_period_start >= ? AND pcd.pay_period_end <= ?
                GROUP BY DATE_FORMAT(pcd.pay_period_start, '%Y-%m')
                ORDER BY period DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('ss', $startDate, $endDate);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $report = [];
        while ($row = $result->fetch_assoc()) {
            $report[] = $row;
        }
        
        $stmt->close();
        
        echo ResponseHandler::success([
            'report_type' => 'statutory',
            'period_start' => $startDate,
            'period_end' => $endDate,
            'statutory_summary' => $report
        ], 'Statutory deductions report retrieved successfully');
    } else {
        http_response_code(400);
        die(ResponseHandler::error('Invalid report type'));
    }
}

/**
 * Get audit trail
 */
function handleGetAuditTrail($conn) {
    $logger = new PayrollAuditLogger($conn);
    
    $payrollRunId = $_GET['payroll_run_id'] ?? null;
    $employeeId = $_GET['employee_id'] ?? null;
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $pageSize = isset($_GET['pageSize']) ? min((int)$_GET['pageSize'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $total = $logger->getAuditLogCount($payrollRunId, $employeeId);
    $offset = ($page - 1) * $pageSize;
    
    $logs = $logger->getAuditLogs($payrollRunId, $employeeId, $pageSize, $offset);
    
    echo ResponseHandler::paginated($logs, $total, $page, $pageSize, 'Audit logs retrieved successfully');
}

/**
 * Get monthly summary
 */
function handleGetMonthlySummary($conn) {
    $year = isset($_GET['year']) ? (int)$_GET['year'] : date('Y');
    $month = isset($_GET['month']) ? (int)$_GET['month'] : date('n');
    
    $sql = "SELECT * FROM monthly_payroll_summary 
            WHERE payroll_year = ? AND payroll_month = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ii', $year, $month);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $summary = $result->fetch_assoc();
        echo ResponseHandler::success($summary, 'Monthly summary retrieved successfully');
    } else {
        echo ResponseHandler::success(null, 'No summary found for the selected month');
    }
    
    $stmt->close();
}

/**
 * Generate BIR forms for employees
 */
function handleGenerateBIRForms($conn, $user) {
    // Check authorization - Finance and Payroll officers
    $allowedRoles = [ROLE_ADMIN, ROLE_PAYROLL, ROLE_FINANCE];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to generate BIR forms'));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $errors = [];
    
    if (empty($input['year'])) {
        $errors['year'] = 'Year is required';
    }
    
    if (empty($input['form_type'])) {
        $errors['form_type'] = 'Form type is required (1601-C for employee)';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        die(ResponseHandler::error('Validation failed', 400, $errors));
    }
    
    $year = (int)$input['year'];
    $formType = $input['form_type']; // 1601-C, 1600, etc.
    $employeeId = $input['employee_id'] ?? null;
    
    try {
        $hrCoreClient = new HRCoreLocalClient($conn);
        $engine = new PayrollComputationEngine($conn, $hrCoreClient);
        $logger = new PayrollAuditLogger($conn, $user['id'] ?? 'SYSTEM');
        
        if ($employeeId) {
            // Generate for single employee
            $formId = 'BIR' . $formType . date('YmdHis') . rand(1000, 9999);
            $generatedDate = date('Y-m-d H:i:s');
            
            // Calculate annual gross income and tax
            $sql = "SELECT 
                        SUM(pcd.gross_pay * 12) as annual_gross,
                        SUM(pcd.bir_tax * 12) as annual_tax_withheld,
                        e.first_name,
                        e.last_name,
                        e.email
                    FROM payroll_computation_details pcd
                    LEFT JOIN employees e ON pcd.employee_id = e.id
                    WHERE pcd.employee_id = ? 
                    AND YEAR(pcd.pay_period_start) = ?
                    AND pcd.status IN ('calculated', 'approved', 'paid')
                    GROUP BY pcd.employee_id";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param('si', $employeeId, $year);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                $stmt->close();
                http_response_code(404);
                die(ResponseHandler::error('No payroll data found for the specified employee and year'));
            }
            
            $data = $result->fetch_assoc();
            $stmt->close();
            
            $annualGross = (float)$data['annual_gross'] ?? 0;
            $annualTaxWithheld = (float)$data['annual_tax_withheld'] ?? 0;
            
            // Calculate tax due using annual brackets
            $annualTaxableIncome = $annualGross;
            $exemption = 125000 * 12; // Annual exemption
            
            if ($annualTaxableIncome > $exemption) {
                $taxableAmount = $annualTaxableIncome - $exemption;
                // Find applicable bracket and compute
                // For simplicity, using 15% average for professional income
                $annualTaxDue = $taxableAmount * 0.15;
            } else {
                $annualTaxDue = 0;
            }
            
            $taxDueOrRefund = $annualTaxDue - $annualTaxWithheld;
            
            // Insert BIR form
            $insertSQL = "INSERT INTO bir_forms 
                         (id, form_type, reporting_year, employee_id, gross_income, total_tax_due, total_tax_withheld, tax_due_or_refund, form_status, generated_date)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)";
            
            $insertStmt = $conn->prepare($insertSQL);
            $status = 'draft';
            $insertStmt->bind_param('ssisddds', 
                $formId, 
                $formType, 
                $year, 
                $employeeId, 
                $annualGross, 
                $annualTaxDue, 
                $annualTaxWithheld, 
                $taxDueOrRefund, 
                $generatedDate
            );
            
            if ($insertStmt->execute()) {
                $logger->logAction('generate_bir_form', null, null, $employeeId, null, 
                    ['form_id' => $formId, 'form_type' => $formType, 'year' => $year], 
                    'BIR form generated');
                
                $insertStmt->close();
                
                echo ResponseHandler::success([
                    'form_id' => $formId,
                    'employee_name' => $data['first_name'] . ' ' . $data['last_name'],
                    'form_type' => $formType,
                    'year' => $year,
                    'annual_gross_income' => $annualGross,
                    'total_tax_due' => $annualTaxDue,
                    'total_tax_withheld' => $annualTaxWithheld,
                    'tax_due_or_refund' => $taxDueOrRefund,
                    'status' => 'draft'
                ], 'BIR form generated successfully', 201);
            } else {
                $insertStmt->close();
                http_response_code(500);
                die(ResponseHandler::error('Failed to generate BIR form'));
            }
            
        } else {
            // Generate for all employees - batch processing
            $formsGenerated = 0;
            $errors = [];
            
            // Get all employees
            $empSQL = "SELECT id, first_name, last_name FROM employees WHERE status = 'active'";
            $empResult = $conn->query($empSQL);
            
            if ($empResult) {
                while ($emp = $empResult->fetch_assoc()) {
                    try {
                        $employeeId = $emp['id'];
                        $formId = 'BIR' . $formType . date('YmdHis') . rand(1000, 9999);
                        $generatedDate = date('Y-m-d H:i:s');
                        
                        // Similar calculation as above (abbreviated for batch)
                        $sql = "SELECT SUM(bir_tax) as total_tax FROM payroll_computation_details
                                WHERE employee_id = ? AND YEAR(pay_period_start) = ?";
                        $stmt = $conn->prepare($sql);
                        $stmt->bind_param('si', $employeeId, $year);
                        $stmt->execute();
                        $result = $stmt->get_result();
                        $row = $result->fetch_assoc();
                        $stmt->close();
                        
                        $totalTax = ($row['total_tax'] ?? 0) * 12;
                        $status = 'draft';
                        
                        $insertSQL = "INSERT INTO bir_forms (id, form_type, reporting_year, employee_id, total_tax_withheld, form_status, generated_date)
                                     VALUES (?, ?, ?, ?, ?, ?, ?)";
                        $insertStmt = $conn->prepare($insertSQL);
                        $insertStmt->bind_param('ssisds', $formId, $formType, $year, $employeeId, $totalTax, $status, $generatedDate);
                        
                        if ($insertStmt->execute()) {
                            $formsGenerated++;
                        }
                        $insertStmt->close();
                        
                    } catch (Exception $e) {
                        $errors[] = "Error for employee {$emp['id']}: " . $e->getMessage();
                    }
                }
            }
            
            $logger->logAction('batch_generate_bir_forms', null, null, null, null, 
                ['form_type' => $formType, 'year' => $year, 'count' => $formsGenerated], 
                'Batch BIR forms generated');
            
            echo ResponseHandler::success([
                'form_type' => $formType,
                'year' => $year,
                'forms_generated' => $formsGenerated,
                'errors' => $errors
            ], 'Batch BIR form generation completed', 201);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        die(ResponseHandler::error('Failed to generate BIR forms: ' . $e->getMessage()));
    }
}

/**
 * Generate report for export
 */
function handleGenerateReport($conn, $user) {
    $allowedRoles = [ROLE_ADMIN, ROLE_PAYROLL, ROLE_FINANCE, ROLE_HR_MANAGER];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to generate reports'));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $reportType = $input['report_type'] ?? 'payroll_summary';
    $startDate = $input['start_date'] ?? date('Y-m-01');
    $endDate = $input['end_date'] ?? date('Y-m-t');
    
    // Generate various reports based on type
    if ($reportType === 'payroll_summary') {
        $sql = "SELECT 
                    pr.period,
                    COUNT(DISTINCT pcd.employee_id) as employees,
                    SUM(pcd.gross_pay) as total_gross,
                    SUM(pcd.overtime_amount) as total_overtime,
                    SUM(pcd.night_differential_amount) as total_night_diff,
                    SUM(pcd.sss_contribution) as total_sss,
                    SUM(pcd.philhealth_contribution) as total_philhealth,
                    SUM(pcd.pagibig_contribution) as total_pagibig,
                    SUM(pcd.bir_tax) as total_bir,
                    SUM(pcd.total_deductions) as total_deductions,
                    SUM(pcd.net_pay) as total_net
                FROM payroll_runs pr
                LEFT JOIN payroll_computation_details pcd ON pr.id = pcd.payroll_run_id
                WHERE pr.period BETWEEN ? AND ?
                GROUP BY pr.period
                ORDER BY pr.period DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('ss', $startDate, $endDate);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        $stmt->close();
        
        echo ResponseHandler::success([
            'report_type' => 'payroll_summary',
            'period_start' => $startDate,
            'period_end' => $endDate,
            'data' => $data
        ], 'Payroll summary report generated successfully');
    }
}

?>
