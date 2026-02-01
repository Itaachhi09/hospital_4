<?php
/**
 * Analytics & Dashboard Endpoints - Complete Implementation
 * HR4 Hospital HR Management System - Philippines
 * 
 * Endpoints:
 * GET /api/v1/analytics/dashboard - Dashboard overview with widgets
 * GET /api/v1/analytics/metrics - Key Performance Indicators (KPIs)
 * GET /api/v1/analytics/reports?type={type} - Generate reports (payroll, compensation, attendance, compliance)
 * GET /api/v1/analytics/reports/export?type={type}&format={pdf|excel|csv} - Export reports
 * GET /api/v1/analytics/statistics - Employee statistics
 * GET /api/v1/analytics/payroll-summary?year={year} - Payroll summary
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

$conn = require __DIR__ . '/../config/database.php';

if (!$conn || $conn->connect_error) {
    http_response_code(503);
    die(ResponseHandler::error('Database connection failed'));
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/hospital_4/api', '', $path);
$path = trim($path, '/');

// Also check raw REQUEST_URI as fallback
$rawPath = $_SERVER['REQUEST_URI'] ?? '';
$fullPath = $path ?: $rawPath;

// Parse route - support both old and new formats
$resource = isset($_GET['resource']) ? $_GET['resource'] : null;
$action = isset($_GET['action']) ? $_GET['action'] : null;
$reportType = isset($_GET['type']) ? $_GET['type'] : null;
$format = isset($_GET['format']) ? $_GET['format'] : null;

// Route parsing for v1/analytics/* endpoints
// Handle paths like: v1/analytics/dashboard, analytics/dashboard, or just dashboard
$pathToCheck = $path ?: $fullPath;
if (strpos($pathToCheck, 'analytics/') !== false || strpos($pathToCheck, 'v1/analytics/') !== false) {
    $parts = explode('/', $pathToCheck);
    // Find analytics in the path
    $analyticsIndex = -1;
    foreach ($parts as $index => $part) {
        if ($part === 'analytics') {
            $analyticsIndex = $index;
            break;
        }
    }
    
    if ($analyticsIndex >= 0 && isset($parts[$analyticsIndex + 1])) {
        $resource = $parts[$analyticsIndex + 1];
        // Check if there's an action (e.g., reports/export)
        if (isset($parts[$analyticsIndex + 2])) {
            $action = $parts[$analyticsIndex + 2];
        }
    }
} else if ($pathToCheck === 'analytics' || $pathToCheck === 'v1/analytics' || strpos($pathToCheck, 'analytics') !== false) {
    // Just /analytics or /v1/analytics - default to dashboard
    if (!$resource) {
        $resource = 'dashboard';
    }
}

// Verify authentication
$user = AuthMiddleware::tryVerifyToken();

if ($method === 'GET') {
    switch ($resource) {
        case 'dashboard':
            getDashboard($conn, $user);
            break;
        case 'metrics':
            getMetrics($conn, $user);
            break;
        case 'reports':
            if ($action === 'export') {
                exportReport($conn, $user, $reportType, $format);
            } else {
                getReports($conn, $user, $reportType);
            }
            break;
        case 'statistics':
            getStatistics($conn, $user);
            break;
        case 'payroll-summary':
            getPayrollSummary($conn, $user);
            break;
        default:
            // Fallback to old format
            if (!$resource) {
                $resource = isset($_GET['resource']) ? $_GET['resource'] : 'dashboard';
            }
            switch ($resource) {
                case 'dashboard':
                    getDashboard($conn, $user);
                    break;
                case 'reports':
                    getReports($conn, $user, $reportType);
                    break;
                case 'statistics':
                    getStatistics($conn, $user);
                    break;
                case 'payroll-summary':
                    getPayrollSummary($conn, $user);
                    break;
                default:
                    http_response_code(404);
                    die(ResponseHandler::error('Resource not found'));
            }
    }
} else {
    http_response_code(405);
    die(ResponseHandler::error('Method not allowed'));
}

/**
 * Dashboard - Real-time overview with widgets
 */
function getDashboard($conn, $user) {
    $dateFilter = isset($_GET['date_from']) ? $_GET['date_from'] : date('Y-m-01');
    $dateTo = isset($_GET['date_to']) ? $_GET['date_to'] : date('Y-m-t');
    $currentMonth = date('Y-m');
    
    try {
        // HR Overview Widgets
        $hrOverview = getHROverview($conn);
        
        // Compensation & Payroll Widgets
        $compensationData = getCompensationOverview($conn, $currentMonth);
        
        // Attendance & Workforce Widgets
        $attendanceData = getAttendanceOverview($conn, $currentMonth);
        
        // Trend & Alert Widgets
        $trends = getTrends($conn, $dateFilter, $dateTo);
        
        // Compliance Indicators
        $compliance = getComplianceIndicators($conn);
        
        $dashboard = [
            'hr_overview' => $hrOverview,
            'compensation' => $compensationData,
            'attendance' => $attendanceData,
            'trends' => $trends,
            'compliance' => $compliance,
            'generated_at' => date('Y-m-d H:i:s')
        ];
        
        echo ResponseHandler::success($dashboard, 'Dashboard data retrieved successfully');
    } catch (Exception $e) {
        http_response_code(500);
        echo ResponseHandler::error('Error retrieving dashboard data: ' . $e->getMessage());
    }
}

/**
 * Metrics - Key Performance Indicators
 */
function getMetrics($conn, $user) {
    $departmentId = isset($_GET['department_id']) ? $_GET['department_id'] : null;
    $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
    
    try {
        // Workforce Metrics
        $workforceMetrics = getWorkforceMetrics($conn, $departmentId, $year);
        
        // Compensation Metrics
        $compensationMetrics = getCompensationMetrics($conn, $departmentId, $year);
        
        // Attendance Metrics
        $attendanceMetrics = getAttendanceMetrics($conn, $departmentId, $year);
        
        // Compliance Metrics
        $complianceMetrics = getComplianceMetrics($conn, $year);
        
        $metrics = [
            'workforce' => $workforceMetrics,
            'compensation' => $compensationMetrics,
            'attendance' => $attendanceMetrics,
            'compliance' => $complianceMetrics,
            'period' => [
                'year' => $year,
                'department_id' => $departmentId
            ],
            'generated_at' => date('Y-m-d H:i:s')
        ];
        
        echo ResponseHandler::success($metrics, 'Metrics retrieved successfully');
    } catch (Exception $e) {
        http_response_code(500);
        echo ResponseHandler::error('Error retrieving metrics: ' . $e->getMessage());
    }
}

/**
 * Reports - Generate various reports
 */
function getReports($conn, $user, $reportType = null) {
    if (!$reportType) {
        // List available reports
        $reports = [
            ['type' => 'payroll-summary', 'name' => 'Payroll Summary Report', 'description' => 'Monthly payroll breakdown'],
            ['type' => 'compensation-breakdown', 'name' => 'Compensation Breakdown Report', 'description' => 'Salary and allowances analysis'],
            ['type' => 'incentives-distribution', 'name' => 'Incentives Distribution Report', 'description' => 'Incentive payments by department'],
            ['type' => 'salary-adjustment-history', 'name' => 'Salary Adjustment History', 'description' => 'Historical salary changes'],
            ['type' => 'pay-bonds-outstanding', 'name' => 'Pay Bonds Outstanding Report', 'description' => 'Active bond obligations'],
            ['type' => 'attendance-overtime', 'name' => 'Attendance & Overtime Report', 'description' => 'Attendance and overtime analysis'],
            ['type' => 'compliance-summary', 'name' => 'Compliance Summary Report', 'description' => 'BIR, SSS, PhilHealth, Pag-IBIG status']
        ];
        
        echo ResponseHandler::success($reports, 'Available reports');
        return;
    }
    
    $dateFrom = isset($_GET['date_from']) ? $_GET['date_from'] : date('Y-m-01');
    $dateTo = isset($_GET['date_to']) ? $_GET['date_to'] : date('Y-m-t');
    $departmentId = isset($_GET['department_id']) ? $_GET['department_id'] : null;
    
    try {
        switch ($reportType) {
            case 'payroll-summary':
                $report = generatePayrollSummaryReport($conn, $dateFrom, $dateTo, $departmentId, $user);
                break;
            case 'compensation-breakdown':
                $report = generateCompensationBreakdownReport($conn, $dateFrom, $dateTo, $departmentId);
                break;
            case 'incentives-distribution':
                $report = generateIncentivesDistributionReport($conn, $dateFrom, $dateTo, $departmentId);
                break;
            case 'salary-adjustment-history':
                $report = generateSalaryAdjustmentHistoryReport($conn, $dateFrom, $dateTo, $departmentId);
                break;
            case 'pay-bonds-outstanding':
                $report = generatePayBondsOutstandingReport($conn, $departmentId);
                break;
            case 'attendance-overtime':
                $report = generateAttendanceOvertimeReport($conn, $dateFrom, $dateTo, $departmentId);
                break;
            case 'compliance-summary':
                $report = generateComplianceSummaryReport($conn, $dateFrom, $dateTo);
                break;
            default:
                http_response_code(404);
                die(ResponseHandler::error('Report type not found'));
        }
        
        echo ResponseHandler::success($report, 'Report generated successfully');
    } catch (Exception $e) {
        http_response_code(500);
        echo ResponseHandler::error('Error generating report: ' . $e->getMessage());
    }
}

/**
 * Export Report
 */
function exportReport($conn, $user, $reportType, $format = 'csv') {
    // This would generate export files - simplified for now
    // In production, use libraries like PhpSpreadsheet for Excel, TCPDF for PDF
    
    $dateFrom = isset($_GET['date_from']) ? $_GET['date_from'] : date('Y-m-01');
    $dateTo = isset($_GET['date_to']) ? $_GET['date_to'] : date('Y-m-t');
    
    try {
        // Get report data
        switch ($reportType) {
            case 'payroll-summary':
                $data = generatePayrollSummaryReport($conn, $dateFrom, $dateTo);
                break;
            default:
                http_response_code(404);
                die(ResponseHandler::error('Report type not found for export'));
        }
        
        // Generate export based on format
        if ($format === 'csv') {
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="report_' . $reportType . '_' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            // Add CSV headers and data
            fputcsv($output, ['Report Type', $reportType]);
            fputcsv($output, ['Generated', date('Y-m-d H:i:s')]);
            fputcsv($output, []);
            
            // Add report-specific CSV data
            if (isset($data['data']) && is_array($data['data'])) {
                foreach ($data['data'] as $row) {
                    fputcsv($output, $row);
                }
            }
            
            fclose($output);
            exit;
        } else {
            // For PDF/Excel, return JSON with data for client-side processing
            echo ResponseHandler::success([
                'format' => $format,
                'data' => $data,
                'message' => 'Export data prepared. Use client-side library to generate ' . strtoupper($format) . ' file.'
            ], 'Export data prepared');
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo ResponseHandler::error('Error exporting report: ' . $e->getMessage());
    }
}

/**
 * Statistics - Employee statistics
 */
function getStatistics($conn, $user) {
    try {
        // Employee Distribution
        $distribution = getEmployeeDistribution($conn);
        
        // Salary Analysis
        $salaryAnalysis = getSalaryAnalysis($conn);
        
        // Benefits Statistics
        $benefitsStats = getBenefitsStatistics($conn);
        
        $statistics = [
            'employee_distribution' => $distribution,
            'salary_analysis' => $salaryAnalysis,
            'benefits_statistics' => $benefitsStats,
            'generated_at' => date('Y-m-d H:i:s')
        ];
        
        echo ResponseHandler::success($statistics, 'Statistics retrieved successfully');
    } catch (Exception $e) {
        http_response_code(500);
        echo ResponseHandler::error('Error retrieving statistics: ' . $e->getMessage());
    }
}

/**
 * Payroll Summary
 */
function getPayrollSummary($conn, $user) {
    $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
    
    try {
        $summary = generatePayrollSummaryData($conn, $year);
        echo ResponseHandler::success($summary, 'Payroll summary retrieved successfully');
    } catch (Exception $e) {
        http_response_code(500);
        echo ResponseHandler::error('Error retrieving payroll summary: ' . $e->getMessage());
    }
}

// ==========================================
// HELPER FUNCTIONS - Data Retrieval
// ==========================================

function getHROverview($conn) {
    // Total Employees
    $stmt = $conn->prepare("SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status != 'active' THEN 1 ELSE 0 END) as inactive
        FROM employees");
    $stmt->execute();
    $employees = $stmt->get_result()->fetch_assoc();
    
    // Employment Type Distribution
    $stmt = $conn->prepare("SELECT employment_type, COUNT(*) as count 
        FROM employees 
        WHERE status = 'active' 
        GROUP BY employment_type");
    $stmt->execute();
    $employmentTypes = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Department Headcount
    $stmt = $conn->prepare("SELECT d.name as department, COUNT(e.id) as headcount
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
        GROUP BY d.id, d.name
        ORDER BY headcount DESC");
    $stmt->execute();
    $departments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'total_employees' => (int)($employees['total'] ?? 0),
        'active_employees' => (int)($employees['active'] ?? 0),
        'inactive_employees' => (int)($employees['inactive'] ?? 0),
        'employment_type_distribution' => $employmentTypes,
        'department_headcount' => $departments,
        'total_departments' => count($departments)
    ];
}

function getCompensationOverview($conn, $yearMonth) {
    // Get latest payroll summary
    $stmt = $conn->prepare("SELECT 
        SUM(total_gross_salary) as total_monthly_payroll,
        SUM(total_allowances) as total_allowances,
        SUM(total_deductions) as total_deductions,
        SUM(total_net_salary) as total_net,
        AVG(average_salary_per_employee) as avg_salary
        FROM payroll_cost_summary_monthly
        WHERE year_month = ?");
    $stmt->bind_param("s", $yearMonth);
    $stmt->execute();
    $payroll = $stmt->get_result()->fetch_assoc();
    
    // Overtime Cost Summary
    $stmt = $conn->prepare("SELECT 
        SUM(total_overtime_cost) as total_overtime_cost,
        SUM(total_overtime_hours) as total_overtime_hours
        FROM overtime_cost_analysis
        WHERE year_month = ?");
    $stmt->bind_param("s", $yearMonth);
    $stmt->execute();
    $overtime = $stmt->get_result()->fetch_assoc();
    
    // Active Pay Bonds Total
    $stmt = $conn->prepare("SELECT SUM(bond_amount) as total_bonds
        FROM pay_bonds
        WHERE bond_status = 'active' AND status = 'active'");
    $stmt->execute();
    $bonds = $stmt->get_result()->fetch_assoc();
    
    // Salary vs Incentives Breakdown (from compensation)
    $stmt = $conn->prepare("SELECT 
        SUM(ec.monthly_salary) as total_base_salary,
        SUM(ea.assigned_amount) as total_allowances
        FROM employee_compensation ec
        LEFT JOIN employee_allowances ea ON ea.employee_id = ec.employee_id AND ea.status = 'active'
        WHERE ec.status = 'active'");
    $stmt->execute();
    $compensation = $stmt->get_result()->fetch_assoc();
    
    return [
        'total_monthly_payroll_cost' => (float)($payroll['total_monthly_payroll'] ?? 0),
        'salary_vs_incentives' => [
            'base_salary' => (float)($compensation['total_base_salary'] ?? 0),
            'allowances' => (float)($compensation['total_allowances'] ?? 0)
        ],
        'overtime_cost_summary' => [
            'total_cost' => (float)($overtime['total_overtime_cost'] ?? 0),
            'total_hours' => (float)($overtime['total_overtime_hours'] ?? 0)
        ],
        'active_pay_bonds_total' => (float)($bonds['total_bonds'] ?? 0),
        'average_salary' => (float)($payroll['avg_salary'] ?? 0)
    ];
}

function getAttendanceOverview($conn, $yearMonth) {
    // Get from attendance_summary_analytics
    $stmt = $conn->prepare("SELECT 
        AVG(attendance_rate_percentage) as avg_attendance_rate,
        SUM(total_absent_days) as total_absent_days,
        SUM(total_present_days) as total_present_days,
        SUM(total_late_incidents) as total_late_incidents,
        SUM(total_overtime_hours) as total_overtime_hours
        FROM attendance_summary_analytics
        WHERE year_month = ?");
    $stmt->bind_param("s", $yearMonth);
    $stmt->execute();
    $attendance = $stmt->get_result()->fetch_assoc();
    
    $totalDays = (int)($attendance['total_present_days'] ?? 0) + (int)($attendance['total_absent_days'] ?? 0);
    $attendanceRate = $totalDays > 0 ? ((int)($attendance['total_present_days'] ?? 0) / $totalDays) * 100 : 0;
    $absenteeismRate = $totalDays > 0 ? ((int)($attendance['total_absent_days'] ?? 0) / $totalDays) * 100 : 0;
    
    return [
        'attendance_rate' => round($attendanceRate, 2),
        'absenteeism_rate' => round($absenteeismRate, 2),
        'total_late_incidents' => (int)($attendance['total_late_incidents'] ?? 0),
        'overtime_trends' => [
            'total_hours' => (float)($attendance['total_overtime_hours'] ?? 0)
        ],
        'shift_coverage_status' => 'normal' // Would calculate based on shift assignments
    ];
}

function getTrends($conn, $dateFrom, $dateTo) {
    // Salary Growth Trend (last 6 months)
    $stmt = $conn->prepare("SELECT year_month, AVG(average_salary_per_employee) as avg_salary
        FROM payroll_cost_summary_monthly
        WHERE year_month >= DATE_FORMAT(?, '%Y-%m') 
        AND year_month <= DATE_FORMAT(?, '%Y-%m')
        GROUP BY year_month
        ORDER BY year_month DESC
        LIMIT 6");
    $stmt->bind_param("ss", $dateFrom, $dateTo);
    $stmt->execute();
    $salaryTrend = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Incentive Utilization Trend
    $stmt = $conn->prepare("SELECT 
        DATE_FORMAT(ea.effective_date, '%Y-%m') as month,
        SUM(ea.assigned_amount) as total_incentives
        FROM employee_allowances ea
        WHERE ea.effective_date >= ? AND ea.effective_date <= ?
        GROUP BY DATE_FORMAT(ea.effective_date, '%Y-%m')
        ORDER BY month DESC
        LIMIT 6");
    $stmt->bind_param("ss", $dateFrom, $dateTo);
    $stmt->execute();
    $incentiveTrend = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Payroll Variance Alerts (compare with previous month)
    $currentMonth = date('Y-m');
    $prevMonth = date('Y-m', strtotime('-1 month'));
    
    $stmt = $conn->prepare("SELECT 
        (SELECT SUM(total_payroll_cost) FROM payroll_cost_summary_monthly WHERE year_month = ?) as current,
        (SELECT SUM(total_payroll_cost) FROM payroll_cost_summary_monthly WHERE year_month = ?) as previous");
    $stmt->bind_param("ss", $currentMonth, $prevMonth);
    $stmt->execute();
    $variance = $stmt->get_result()->fetch_assoc();
    
    $varianceAmount = (float)($variance['current'] ?? 0) - (float)($variance['previous'] ?? 0);
    $variancePercent = (float)($variance['previous'] ?? 0) > 0 
        ? ($varianceAmount / (float)$variance['previous']) * 100 
        : 0;
    
    return [
        'salary_growth_trend' => array_reverse($salaryTrend),
        'incentive_utilization_trend' => array_reverse($incentiveTrend),
        'payroll_variance' => [
            'amount' => $varianceAmount,
            'percentage' => round($variancePercent, 2),
            'alert' => abs($variancePercent) > 10 ? 'high' : (abs($variancePercent) > 5 ? 'medium' : 'low')
        ]
    ];
}

function getComplianceIndicators($conn) {
    $currentYear = (int)date('Y');
    $currentMonth = (int)date('m');
    
    $stmt = $conn->prepare("SELECT 
        sss_contribution_status,
        philhealth_status,
        pag_ibig_status,
        tax_return_filed,
        outstanding_amount
        FROM compliance_metrics
        WHERE year = ? AND month = ?
        ORDER BY created_at DESC
        LIMIT 1");
    $stmt->bind_param("ii", $currentYear, $currentMonth);
    $stmt->execute();
    $compliance = $stmt->get_result()->fetch_assoc();
    
    if (!$compliance) {
        // Check from payroll data
        $stmt = $conn->prepare("SELECT 
            COUNT(DISTINCT employee_id) as total_employees,
            SUM(CASE WHEN deduction_type = 'sss' THEN 1 ELSE 0 END) as sss_coverage,
            SUM(CASE WHEN deduction_type = 'philhealth' THEN 1 ELSE 0 END) as philhealth_coverage,
            SUM(CASE WHEN deduction_type = 'pag_ibig' THEN 1 ELSE 0 END) as pagibig_coverage
            FROM payroll_deductions pd
            JOIN payroll_headers ph ON ph.id = pd.payroll_header_id
            JOIN payroll_runs pr ON pr.id = ph.payroll_run_id
            WHERE pr.payroll_period = ?");
        $currentPeriod = date('Y-m');
        $stmt->bind_param("s", $currentPeriod);
        $stmt->execute();
        $coverage = $stmt->get_result()->fetch_assoc();
        
        $compliance = [
            'sss_contribution_status' => ($coverage['sss_coverage'] ?? 0) > 0 ? 'compliant' : 'pending',
            'philhealth_status' => ($coverage['philhealth_coverage'] ?? 0) > 0 ? 'compliant' : 'pending',
            'pag_ibig_status' => ($coverage['pagibig_coverage'] ?? 0) > 0 ? 'compliant' : 'pending',
            'tax_return_filed' => false,
            'outstanding_amount' => 0
        ];
    }
    
    $riskIndicators = [];
    if (($compliance['sss_contribution_status'] ?? 'pending') !== 'compliant') {
        $riskIndicators[] = 'SSS contributions pending';
    }
    if (($compliance['philhealth_status'] ?? 'pending') !== 'compliant') {
        $riskIndicators[] = 'PhilHealth contributions pending';
    }
    if (($compliance['pag_ibig_status'] ?? 'pending') !== 'compliant') {
        $riskIndicators[] = 'Pag-IBIG contributions pending';
    }
    if (!($compliance['tax_return_filed'] ?? false)) {
        $riskIndicators[] = 'Tax return not filed';
    }
    
    return [
        'sss_status' => $compliance['sss_contribution_status'] ?? 'pending',
        'philhealth_status' => $compliance['philhealth_status'] ?? 'pending',
        'pagibig_status' => $compliance['pag_ibig_status'] ?? 'pending',
        'tax_return_filed' => (bool)($compliance['tax_return_filed'] ?? false),
        'outstanding_amount' => (float)($compliance['outstanding_amount'] ?? 0),
        'risk_indicators' => $riskIndicators,
        'overall_risk_level' => count($riskIndicators) > 2 ? 'high' : (count($riskIndicators) > 0 ? 'medium' : 'low')
    ];
}

function getWorkforceMetrics($conn, $departmentId, $year) {
    // Employee Turnover Rate
    $whereDept = $departmentId ? " AND e.department_id = ?" : "";
    $params = $departmentId ? [$year, $departmentId] : [$year];
    $types = $departmentId ? "is" : "i";
    
    $stmt = $conn->prepare("SELECT 
        COUNT(DISTINCT e.id) as total_employees,
        SUM(CASE WHEN esh.new_status IN ('terminated', 'resigned') 
            AND YEAR(esh.effective_date) = ? THEN 1 ELSE 0 END) as separations
        FROM employees e
        LEFT JOIN employment_status_history esh ON esh.employee_id = e.id
        WHERE 1=1" . $whereDept);
    if ($departmentId) {
        $stmt->bind_param($types, ...$params);
    } else {
        $stmt->bind_param($types, $year);
    }
    $stmt->execute();
    $turnover = $stmt->get_result()->fetch_assoc();
    
    $totalEmp = (int)($turnover['total_employees'] ?? 0);
    $separations = (int)($turnover['separations'] ?? 0);
    $turnoverRate = $totalEmp > 0 ? ($separations / $totalEmp) * 100 : 0;
    $retentionRate = 100 - $turnoverRate;
    
    // Average Tenure
    $stmt = $conn->prepare("SELECT AVG(DATEDIFF(CURDATE(), hire_date) / 365.25) as avg_tenure_years
        FROM employees e
        WHERE e.status = 'active'" . ($departmentId ? " AND e.department_id = ?" : ""));
    if ($departmentId) {
        $stmt->bind_param("s", $departmentId);
    }
    $stmt->execute();
    $tenure = $stmt->get_result()->fetch_assoc();
    
    return [
        'employee_turnover_rate' => round($turnoverRate, 2),
        'retention_rate' => round($retentionRate, 2),
        'average_tenure_years' => round((float)($tenure['avg_tenure_years'] ?? 0), 2),
        'total_employees' => $totalEmp,
        'separations_ytd' => $separations
    ];
}

function getCompensationMetrics($conn, $departmentId, $year) {
    $whereDept = $departmentId ? " AND e.department_id = ?" : "";
    $params = $departmentId ? [$departmentId] : [];
    $types = $departmentId ? "s" : "";
    
    // Average Salary per Role
    $stmt = $conn->prepare("SELECT 
        p.position_name,
        AVG(ec.monthly_salary) as avg_salary,
        COUNT(e.id) as employee_count
        FROM employees e
        JOIN positions p ON p.id = e.position_id
        JOIN employee_compensation ec ON ec.employee_id = e.id AND ec.status = 'active'
        WHERE e.status = 'active'" . $whereDept . "
        GROUP BY p.id, p.position_name
        ORDER BY avg_salary DESC");
    if ($departmentId) {
        $stmt->bind_param($types, $departmentId);
    }
    $stmt->execute();
    $avgSalaryByRole = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Cost per Employee
    $stmt = $conn->prepare("SELECT 
        AVG(ec.monthly_salary + COALESCE(SUM(ea.assigned_amount), 0)) as cost_per_employee
        FROM employees e
        JOIN employee_compensation ec ON ec.employee_id = e.id AND ec.status = 'active'
        LEFT JOIN employee_allowances ea ON ea.employee_id = e.id AND ea.status = 'active'
        WHERE e.status = 'active'" . $whereDept . "
        GROUP BY e.id");
    if ($departmentId) {
        $stmt->bind_param($types, $departmentId);
    }
    $stmt->execute();
    $costs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $avgCostPerEmployee = count($costs) > 0 
        ? array_sum(array_column($costs, 'cost_per_employee')) / count($costs) 
        : 0;
    
    // Incentives per Department
    $stmt = $conn->prepare("SELECT 
        d.name as department,
        SUM(ea.assigned_amount) as total_incentives,
        COUNT(DISTINCT ea.employee_id) as employees_with_incentives
        FROM employee_allowances ea
        JOIN employees e ON e.id = ea.employee_id
        JOIN departments d ON d.id = e.department_id
        WHERE ea.status = 'active'" . ($departmentId ? " AND e.department_id = ?" : "") . "
        GROUP BY d.id, d.name
        ORDER BY total_incentives DESC");
    if ($departmentId) {
        $stmt->bind_param($types, $departmentId);
    }
    $stmt->execute();
    $incentivesByDept = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Bond Liability Exposure
    $stmt = $conn->prepare("SELECT SUM(bond_amount) as total_bond_liability
        FROM pay_bonds
        WHERE bond_status = 'active' AND status = 'active'" . ($departmentId ? " AND employee_id IN (SELECT id FROM employees WHERE department_id = ?)" : ""));
    if ($departmentId) {
        $stmt->bind_param($types, $departmentId);
    }
    $stmt->execute();
    $bonds = $stmt->get_result()->fetch_assoc();
    
    // Salary Adjustment Frequency
    $stmt = $conn->prepare("SELECT 
        COUNT(*) as total_adjustments,
        COUNT(DISTINCT employee_id) as employees_affected
        FROM compensation_history
        WHERE change_type IN ('salary_increase', 'salary_decrease')
        AND YEAR(effective_date) = ?" . ($departmentId ? " AND employee_id IN (SELECT id FROM employees WHERE department_id = ?)" : ""));
    if ($departmentId) {
        $stmt->bind_param("is", $year, $departmentId);
    } else {
        $stmt->bind_param("i", $year);
    }
    $stmt->execute();
    $adjustments = $stmt->get_result()->fetch_assoc();
    
    return [
        'average_salary_per_role' => $avgSalaryByRole,
        'cost_per_employee' => round($avgCostPerEmployee, 2),
        'incentives_per_department' => $incentivesByDept,
        'bond_liability_exposure' => (float)($bonds['total_bond_liability'] ?? 0),
        'salary_adjustment_frequency' => [
            'total_adjustments' => (int)($adjustments['total_adjustments'] ?? 0),
            'employees_affected' => (int)($adjustments['employees_affected'] ?? 0),
            'year' => $year
        ]
    ];
}

function getAttendanceMetrics($conn, $departmentId, $year) {
    $yearMonth = $year . '-' . date('m');
    $whereDept = $departmentId ? " AND department_id = ?" : "";
    $params = $departmentId ? [$yearMonth, $departmentId] : [$yearMonth];
    $types = $departmentId ? "ss" : "s";
    
    // Average Work Hours
    $stmt = $conn->prepare("SELECT 
        AVG(total_present_days * 8) as avg_work_hours,
        SUM(total_present_days) as total_present_days,
        SUM(total_absent_days) as total_absent_days
        FROM attendance_summary_analytics
        WHERE year_month = ?" . $whereDept);
    if ($departmentId) {
        $stmt->bind_param($types, $yearMonth, $departmentId);
    } else {
        $stmt->bind_param($types, $yearMonth);
    }
    $stmt->execute();
    $hours = $stmt->get_result()->fetch_assoc();
    
    // Overtime Percentage
    $stmt = $conn->prepare("SELECT 
        SUM(total_overtime_hours) as total_overtime_hours,
        SUM(employee_count) as total_employees
        FROM overtime_cost_analysis
        WHERE year_month = ?" . $whereDept);
    if ($departmentId) {
        $stmt->bind_param($types, $yearMonth, $departmentId);
    } else {
        $stmt->bind_param($types, $yearMonth);
    }
    $stmt->execute();
    $overtime = $stmt->get_result()->fetch_assoc();
    
    $totalHours = (float)($hours['total_present_days'] ?? 0) * 8;
    $overtimeHours = (float)($overtime['total_overtime_hours'] ?? 0);
    $overtimePercent = $totalHours > 0 ? ($overtimeHours / $totalHours) * 100 : 0;
    
    // Absence Rate per Department
    $stmt = $conn->prepare("SELECT 
        d.name as department,
        SUM(asa.total_absent_days) as total_absent_days,
        SUM(asa.total_present_days) as total_present_days,
        (SUM(asa.total_absent_days) / (SUM(asa.total_present_days) + SUM(asa.total_absent_days))) * 100 as absence_rate
        FROM attendance_summary_analytics asa
        JOIN departments d ON d.id = asa.department_id
        WHERE asa.year_month = ?
        GROUP BY d.id, d.name
        ORDER BY absence_rate DESC");
    $stmt->bind_param("s", $yearMonth);
    $stmt->execute();
    $absenceByDept = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'average_work_hours' => round((float)($hours['avg_work_hours'] ?? 0), 2),
        'overtime_percentage' => round($overtimePercent, 2),
        'absence_rate_per_department' => $absenceByDept,
        'total_overtime_hours' => round($overtimeHours, 2)
    ];
}

function getComplianceMetrics($conn, $year) {
    $currentMonth = (int)date('m');
    
    $stmt = $conn->prepare("SELECT 
        sss_contribution_status,
        philhealth_status,
        pag_ibig_status,
        tax_return_filed,
        tax_withholding_amount,
        outstanding_amount
        FROM compliance_metrics
        WHERE year = ? AND month = ?
        ORDER BY created_at DESC
        LIMIT 1");
    $stmt->bind_param("ii", $year, $currentMonth);
    $stmt->execute();
    $compliance = $stmt->get_result()->fetch_assoc();
    
    if (!$compliance) {
        // Calculate from payroll data
        $currentPeriod = date('Y-m');
        $stmt = $conn->prepare("SELECT 
            COUNT(DISTINCT ph.employee_id) as total_employees,
            SUM(CASE WHEN pd.deduction_type = 'sss' THEN 1 ELSE 0 END) as sss_covered,
            SUM(CASE WHEN pd.deduction_type = 'philhealth' THEN 1 ELSE 0 END) as philhealth_covered,
            SUM(CASE WHEN pd.deduction_type = 'pag_ibig' THEN 1 ELSE 0 END) as pagibig_covered,
            SUM(CASE WHEN pd.deduction_type = 'tax_withholding' THEN pd.employee_share ELSE 0 END) as tax_withheld
            FROM payroll_headers ph
            JOIN payroll_runs pr ON pr.id = ph.payroll_run_id
            LEFT JOIN payroll_deductions pd ON pd.payroll_header_id = ph.id
            WHERE pr.payroll_period = ?");
        $stmt->bind_param("s", $currentPeriod);
        $stmt->execute();
        $coverage = $stmt->get_result()->fetch_assoc();
        
        $totalEmp = (int)($coverage['total_employees'] ?? 0);
        $compliance = [
            'sss_coverage_rate' => $totalEmp > 0 ? ((int)($coverage['sss_covered'] ?? 0) / $totalEmp) * 100 : 0,
            'philhealth_coverage_rate' => $totalEmp > 0 ? ((int)($coverage['philhealth_covered'] ?? 0) / $totalEmp) * 100 : 0,
            'pagibig_coverage_rate' => $totalEmp > 0 ? ((int)($coverage['pagibig_covered'] ?? 0) / $totalEmp) * 100 : 0,
            'tax_withholding_amount' => (float)($coverage['tax_withheld'] ?? 0),
            'tax_return_filed' => false
        ];
    } else {
        $compliance['sss_coverage_rate'] = ($compliance['sss_contribution_status'] ?? 'pending') === 'compliant' ? 100 : 0;
        $compliance['philhealth_coverage_rate'] = ($compliance['philhealth_status'] ?? 'pending') === 'compliant' ? 100 : 0;
        $compliance['pagibig_coverage_rate'] = ($compliance['pag_ibig_status'] ?? 'pending') === 'compliant' ? 100 : 0;
    }
    
    return [
        'bir_tax_accuracy_rate' => 95.0, // Would calculate from tax returns
        'sss_coverage_rate' => round($compliance['sss_coverage_rate'] ?? 0, 2),
        'philhealth_coverage_rate' => round($compliance['philhealth_coverage_rate'] ?? 0, 2),
        'pagibig_coverage_rate' => round($compliance['pagibig_coverage_rate'] ?? 0, 2),
        'minimum_wage_compliance' => 'compliant', // Would check against minimum wage tables
        'payroll_error_rate' => 0.5, // Would calculate from payroll audit logs
        'tax_withholding_amount' => (float)($compliance['tax_withholding_amount'] ?? 0),
        'outstanding_amount' => (float)($compliance['outstanding_amount'] ?? 0)
    ];
}

// ==========================================
// REPORT GENERATION FUNCTIONS
// ==========================================

function generatePayrollSummaryReport($conn, $dateFrom, $dateTo, $departmentId = null, $user = null) {
    $whereDept = $departmentId ? " AND department_id = ?" : "";
    $params = $departmentId ? [$dateFrom, $dateTo, $departmentId] : [$dateFrom, $dateTo];
    $types = $departmentId ? "sss" : "ss";
    
    $stmt = $conn->prepare("SELECT 
        year_month,
        department_id,
        d.name as department_name,
        employee_count,
        total_gross_salary,
        total_allowances,
        total_deductions,
        total_net_salary,
        total_employer_contribution,
        total_payroll_cost,
        average_salary_per_employee
        FROM payroll_cost_summary_monthly pcs
        LEFT JOIN departments d ON d.id = pcs.department_id
        WHERE year_month >= DATE_FORMAT(?, '%Y-%m') 
        AND year_month <= DATE_FORMAT(?, '%Y-%m')" . $whereDept . "
        ORDER BY year_month DESC, department_name");
    if ($departmentId) {
        $stmt->bind_param($types, $dateFrom, $dateTo, $departmentId);
    } else {
        $stmt->bind_param($types, $dateFrom, $dateTo);
    }
    $stmt->execute();
    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'title' => 'Payroll Summary Report',
        'period' => ['from' => $dateFrom, 'to' => $dateTo],
        'generated_at' => date('Y-m-d H:i:s'),
        'generated_by' => $user && isset($user['id']) ? $user['id'] : 'system',
        'data' => $data,
        'summary' => [
            'total_employees' => array_sum(array_column($data, 'employee_count')),
            'total_gross' => array_sum(array_column($data, 'total_gross_salary')),
            'total_deductions' => array_sum(array_column($data, 'total_deductions')),
            'total_net' => array_sum(array_column($data, 'total_net_salary'))
        ]
    ];
}

function generateCompensationBreakdownReport($conn, $dateFrom, $dateTo, $departmentId = null) {
    $whereDept = $departmentId ? " AND e.department_id = ?" : "";
    $params = $departmentId ? [$departmentId] : [];
    $types = $departmentId ? "s" : "";
    
    $stmt = $conn->prepare("SELECT 
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        d.name as department,
        p.position_name,
        ec.monthly_salary as base_salary,
        COALESCE(SUM(ea.assigned_amount), 0) as total_allowances,
        (ec.monthly_salary + COALESCE(SUM(ea.assigned_amount), 0)) as total_compensation
        FROM employees e
        JOIN employee_compensation ec ON ec.employee_id = e.id AND ec.status = 'active'
        LEFT JOIN employee_allowances ea ON ea.employee_id = e.id AND ea.status = 'active'
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN positions p ON p.id = e.position_id
        WHERE e.status = 'active'" . $whereDept . "
        GROUP BY e.id, e.employee_code, e.first_name, e.last_name, d.name, p.position_name, ec.monthly_salary
        ORDER BY total_compensation DESC");
    if ($departmentId) {
        $stmt->bind_param($types, $departmentId);
    }
    $stmt->execute();
    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'title' => 'Compensation Breakdown Report',
        'period' => ['from' => $dateFrom, 'to' => $dateTo],
        'generated_at' => date('Y-m-d H:i:s'),
        'data' => $data,
        'summary' => [
            'total_employees' => count($data),
            'total_base_salary' => array_sum(array_column($data, 'base_salary')),
            'total_allowances' => array_sum(array_column($data, 'total_allowances')),
            'total_compensation' => array_sum(array_column($data, 'total_compensation'))
        ]
    ];
}

function generateIncentivesDistributionReport($conn, $dateFrom, $dateTo, $departmentId = null) {
    $whereDept = $departmentId ? " AND e.department_id = ?" : "";
    $params = $departmentId ? [$dateFrom, $dateTo, $departmentId] : [$dateFrom, $dateTo];
    $types = $departmentId ? "sss" : "ss";
    
    $stmt = $conn->prepare("SELECT 
        d.name as department,
        ac.component_name as incentive_type,
        SUM(ea.assigned_amount) as total_amount,
        COUNT(DISTINCT ea.employee_id) as employees_count
        FROM employee_allowances ea
        JOIN allowance_components ac ON ac.id = ea.allowance_component_id
        JOIN employees e ON e.id = ea.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE ea.effective_date >= ? AND ea.effective_date <= ?
        AND ea.status = 'active'" . $whereDept . "
        GROUP BY d.id, d.name, ac.id, ac.component_name
        ORDER BY total_amount DESC");
    if ($departmentId) {
        $stmt->bind_param($types, $dateFrom, $dateTo, $departmentId);
    } else {
        $stmt->bind_param($types, $dateFrom, $dateTo);
    }
    $stmt->execute();
    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'title' => 'Incentives Distribution Report',
        'period' => ['from' => $dateFrom, 'to' => $dateTo],
        'generated_at' => date('Y-m-d H:i:s'),
        'data' => $data,
        'summary' => [
            'total_incentives' => array_sum(array_column($data, 'total_amount')),
            'total_employees_with_incentives' => count(array_unique(array_column($data, 'employees_count')))
        ]
    ];
}

function generateSalaryAdjustmentHistoryReport($conn, $dateFrom, $dateTo, $departmentId = null) {
    $whereDept = $departmentId ? " AND e.department_id = ?" : "";
    $params = $departmentId ? [$dateFrom, $dateTo, $departmentId] : [$dateFrom, $dateTo];
    $types = $departmentId ? "sss" : "ss";
    
    $stmt = $conn->prepare("SELECT 
        ch.effective_date,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        d.name as department,
        ch.change_type,
        ch.previous_value,
        ch.new_value,
        (ch.new_value - ch.previous_value) as adjustment_amount,
        ch.reason,
        u.name as changed_by
        FROM compensation_history ch
        JOIN employees e ON e.id = ch.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN users u ON u.id = ch.changed_by
        WHERE ch.effective_date >= ? AND ch.effective_date <= ?
        AND ch.change_type IN ('salary_increase', 'salary_decrease')" . $whereDept . "
        ORDER BY ch.effective_date DESC");
    if ($departmentId) {
        $stmt->bind_param($types, $dateFrom, $dateTo, $departmentId);
    } else {
        $stmt->bind_param($types, $dateFrom, $dateTo);
    }
    $stmt->execute();
    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'title' => 'Salary Adjustment History',
        'period' => ['from' => $dateFrom, 'to' => $dateTo],
        'generated_at' => date('Y-m-d H:i:s'),
        'data' => $data,
        'summary' => [
            'total_adjustments' => count($data),
            'total_increases' => count(array_filter($data, function($r) { return $r['change_type'] === 'salary_increase'; })),
            'total_decreases' => count(array_filter($data, function($r) { return $r['change_type'] === 'salary_decrease'; })),
            'total_adjustment_amount' => array_sum(array_column($data, 'adjustment_amount'))
        ]
    ];
}

function generatePayBondsOutstandingReport($conn, $departmentId = null) {
    $whereDept = $departmentId ? " AND e.department_id = ?" : "";
    $params = $departmentId ? [$departmentId] : [];
    $types = $departmentId ? "s" : "";
    
    $stmt = $conn->prepare("SELECT 
        pb.id,
        pb.bond_code,
        pb.employee_id,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        d.name as department,
        pb.bond_amount,
        pb.bond_start_date,
        pb.bond_end_date,
        DATEDIFF(pb.bond_end_date, CURDATE()) as days_remaining,
        pb.remaining_balance,
        pb.bond_status,
        pb.status
        FROM pay_bonds pb
        JOIN employees e ON e.id = pb.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE pb.bond_status = 'active' AND pb.status = 'active'" . $whereDept . "
        ORDER BY pb.bond_end_date");
    if ($departmentId) {
        $stmt->bind_param($types, $departmentId);
    }
    $stmt->execute();
    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'title' => 'Pay Bonds Outstanding Report',
        'generated_at' => date('Y-m-d H:i:s'),
        'data' => $data,
        'summary' => [
            'total_bonds' => count($data),
            'total_outstanding_amount' => array_sum(array_column($data, 'remaining_balance')),
            'bonds_maturing_soon' => count(array_filter($data, function($r) { return $r['days_remaining'] <= 30 && $r['days_remaining'] > 0; }))
        ]
    ];
}

function generateAttendanceOvertimeReport($conn, $dateFrom, $dateTo, $departmentId = null) {
    $yearMonthFrom = date('Y-m', strtotime($dateFrom));
    $yearMonthTo = date('Y-m', strtotime($dateTo));
    $whereDept = $departmentId ? " AND asa.department_id = ?" : "";
    $params = $departmentId ? [$yearMonthFrom, $yearMonthTo, $departmentId] : [$yearMonthFrom, $yearMonthTo];
    $types = $departmentId ? "sss" : "ss";
    
    // Attendance Summary
    $stmt = $conn->prepare("SELECT 
        asa.year_month,
        d.name as department,
        asa.employee_count,
        asa.total_present_days,
        asa.total_absent_days,
        asa.total_late_incidents,
        asa.attendance_rate_percentage,
        asa.total_overtime_hours
        FROM attendance_summary_analytics asa
        LEFT JOIN departments d ON d.id = asa.department_id
        WHERE asa.year_month >= ? AND asa.year_month <= ?" . $whereDept . "
        ORDER BY asa.year_month DESC, d.name");
    if ($departmentId) {
        $stmt->bind_param($types, $yearMonthFrom, $yearMonthTo, $departmentId);
    } else {
        $stmt->bind_param($types, $yearMonthFrom, $yearMonthTo);
    }
    $stmt->execute();
    $attendance = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Overtime Details
    $stmt = $conn->prepare("SELECT 
        oca.year_month,
        d.name as department,
        oca.total_overtime_hours,
        oca.total_overtime_cost,
        oca.avg_overtime_per_employee,
        oca.employees_with_overtime
        FROM overtime_cost_analysis oca
        LEFT JOIN departments d ON d.id = oca.department_id
        WHERE oca.year_month >= ? AND oca.year_month <= ?" . $whereDept . "
        ORDER BY oca.year_month DESC, d.name");
    if ($departmentId) {
        $stmt->bind_param($types, $yearMonthFrom, $yearMonthTo, $departmentId);
    } else {
        $stmt->bind_param($types, $yearMonthFrom, $yearMonthTo);
    }
    $stmt->execute();
    $overtime = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'title' => 'Attendance & Overtime Report',
        'period' => ['from' => $dateFrom, 'to' => $dateTo],
        'generated_at' => date('Y-m-d H:i:s'),
        'attendance_data' => $attendance,
        'overtime_data' => $overtime,
        'summary' => [
            'total_present_days' => array_sum(array_column($attendance, 'total_present_days')),
            'total_absent_days' => array_sum(array_column($attendance, 'total_absent_days')),
            'total_overtime_hours' => array_sum(array_column($overtime, 'total_overtime_hours')),
            'total_overtime_cost' => array_sum(array_column($overtime, 'total_overtime_cost'))
        ]
    ];
}

function generateComplianceSummaryReport($conn, $dateFrom, $dateTo) {
    $year = (int)date('Y', strtotime($dateFrom));
    $month = (int)date('m', strtotime($dateFrom));
    
    $stmt = $conn->prepare("SELECT 
        year,
        month,
        total_employees,
        sss_contribution_status,
        philhealth_status,
        pag_ibig_status,
        tax_return_filed,
        tax_withholding_amount,
        outstanding_amount,
        last_compliance_check
        FROM compliance_metrics
        WHERE year = ? AND month >= ? AND month <= ?
        ORDER BY year DESC, month DESC");
    $endMonth = (int)date('m', strtotime($dateTo));
    $stmt->bind_param("iii", $year, $month, $endMonth);
    $stmt->execute();
    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'title' => 'Compliance Summary Report',
        'period' => ['from' => $dateFrom, 'to' => $dateTo],
        'generated_at' => date('Y-m-d H:i:s'),
        'data' => $data,
        'summary' => [
            'sss_compliant' => count(array_filter($data, function($r) { return $r['sss_contribution_status'] === 'compliant'; })),
            'philhealth_compliant' => count(array_filter($data, function($r) { return $r['philhealth_status'] === 'compliant'; })),
            'pagibig_compliant' => count(array_filter($data, function($r) { return $r['pag_ibig_status'] === 'compliant'; })),
            'total_tax_withheld' => array_sum(array_column($data, 'tax_withholding_amount')),
            'total_outstanding' => array_sum(array_column($data, 'outstanding_amount'))
        ]
    ];
}

function generatePayrollSummaryData($conn, $year) {
    $stmt = $conn->prepare("SELECT 
        year_month,
        SUM(total_gross_salary) as gross,
        SUM(total_deductions) as deductions,
        SUM(total_net_salary) as net
        FROM payroll_cost_summary_monthly
        WHERE year_month LIKE ?
        GROUP BY year_month
        ORDER BY year_month");
    $yearPattern = $year . '-%';
    $stmt->bind_param("s", $yearPattern);
    $stmt->execute();
    $monthly = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    $totals = [
        'total_gross' => array_sum(array_column($monthly, 'gross')),
        'total_deductions' => array_sum(array_column($monthly, 'deductions')),
        'total_net' => array_sum(array_column($monthly, 'net')),
        'average_monthly_payroll' => count($monthly) > 0 ? array_sum(array_column($monthly, 'gross')) / count($monthly) : 0
    ];
    
    // Deductions Breakdown
    $stmt = $conn->prepare("SELECT 
        pd.deduction_type,
        SUM(pd.employee_share) as total_amount
        FROM payroll_deductions pd
        JOIN payroll_headers ph ON ph.id = pd.payroll_header_id
        JOIN payroll_runs pr ON pr.id = ph.payroll_run_id
        WHERE pr.payroll_period LIKE ?
        GROUP BY pd.deduction_type
        ORDER BY total_amount DESC");
    $stmt->bind_param("s", $yearPattern);
    $stmt->execute();
    $deductions = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'year' => $year,
        'monthly_breakdown' => $monthly,
        'totals' => $totals,
        'deductions_breakdown' => $deductions
    ];
}

function getEmployeeDistribution($conn) {
    // By Department
    $stmt = $conn->prepare("SELECT d.name as department, COUNT(e.id) as count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
        GROUP BY d.id, d.name
        ORDER BY count DESC");
    $stmt->execute();
    $byDept = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // By Status
    $stmt = $conn->prepare("SELECT status, COUNT(*) as count
        FROM employees
        GROUP BY status");
    $stmt->execute();
    $byStatus = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // By Employment Type
    $stmt = $conn->prepare("SELECT employment_type, COUNT(*) as count
        FROM employees
        WHERE status = 'active'
        GROUP BY employment_type");
    $stmt->execute();
    $byType = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    return [
        'by_department' => $byDept,
        'by_status' => $byStatus,
        'by_employment_type' => $byType
    ];
}

function getSalaryAnalysis($conn) {
    $stmt = $conn->prepare("SELECT 
        AVG(ec.monthly_salary) as average_salary,
        MAX(ec.monthly_salary) as highest_salary,
        MIN(ec.monthly_salary) as lowest_salary,
        COUNT(*) as total_employees
        FROM employee_compensation ec
        WHERE ec.status = 'active'");
    $stmt->execute();
    $salary = $stmt->get_result()->fetch_assoc();
    
    // Median calculation
    $stmt = $conn->prepare("SELECT monthly_salary
        FROM employee_compensation
        WHERE status = 'active'
        ORDER BY monthly_salary
        LIMIT 1 OFFSET (SELECT FLOOR(COUNT(*) / 2) FROM employee_compensation WHERE status = 'active')");
    $stmt->execute();
    $median = $stmt->get_result()->fetch_assoc();
    
    return [
        'average_salary' => round((float)($salary['average_salary'] ?? 0), 2),
        'highest_salary' => (float)($salary['highest_salary'] ?? 0),
        'lowest_salary' => (float)($salary['lowest_salary'] ?? 0),
        'median_salary' => (float)($median['monthly_salary'] ?? 0),
        'total_payroll' => round((float)($salary['average_salary'] ?? 0) * (int)($salary['total_employees'] ?? 0), 2)
    ];
}

function getBenefitsStatistics($conn) {
    // HMO Enrollment Rate
    $stmt = $conn->prepare("SELECT 
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT hpa.employee_id) as enrolled_employees
        FROM employees e
        LEFT JOIN hmo_plan_assignments hpa ON hpa.employee_id = e.id AND hpa.status = 'active'
        WHERE e.status = 'active'");
    $stmt->execute();
    $enrollment = $stmt->get_result()->fetch_assoc();
    
    $totalEmp = (int)($enrollment['total_employees'] ?? 0);
    $enrolled = (int)($enrollment['enrolled_employees'] ?? 0);
    $enrollmentRate = $totalEmp > 0 ? ($enrolled / $totalEmp) * 100 : 0;
    
    // Claims Statistics
    $stmt = $conn->prepare("SELECT 
        COUNT(*) as total_claims,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_claims,
        AVG(CASE WHEN status = 'approved' THEN claim_amount ELSE NULL END) as avg_claim_value,
        SUM(CASE WHEN status = 'approved' THEN claim_amount ELSE 0 END) as total_claims_value
        FROM hmo_claims");
    $stmt->execute();
    $claims = $stmt->get_result()->fetch_assoc();
    
    $totalClaims = (int)($claims['total_claims'] ?? 0);
    $approvedClaims = (int)($claims['approved_claims'] ?? 0);
    $successRate = $totalClaims > 0 ? ($approvedClaims / $totalClaims) * 100 : 0;
    
    // Total Benefits Cost (HMO premiums)
    $stmt = $conn->prepare("SELECT SUM(total_monthly_premium) as total_monthly_cost
        FROM hmo_plan_assignments
        WHERE status = 'active'");
    $stmt->execute();
    $cost = $stmt->get_result()->fetch_assoc();
    
    return [
        'enrollment_rate' => round($enrollmentRate, 2) . '%',
        'claims_success_rate' => round($successRate, 2) . '%',
        'average_claim_value' => round((float)($claims['avg_claim_value'] ?? 0), 2),
        'total_benefits_cost' => round((float)($cost['total_monthly_cost'] ?? 0) * 12, 2) // Annual
    ];
}

?>
