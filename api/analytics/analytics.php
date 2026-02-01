<?php
/**
 * Analytics & Dashboard Endpoints
 * GET /api/analytics?resource=dashboard - Dashboard data
 * GET /api/analytics?resource=reports - Generate reports
 * GET /api/analytics?resource=statistics - Employee statistics
 * GET /api/analytics?resource=payroll-summary - Payroll summary
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$resource = isset($_GET['resource']) ? $_GET['resource'] : 'dashboard';

if ($method !== 'GET') {
    http_response_code(405);
    die(ResponseHandler::error('Method not allowed'));
}

// Verify authentication (optional for analytics - allow unauthenticated access with fallback data)
// Use tryVerifyToken which returns null on failure instead of dying
$user = AuthMiddleware::tryVerifyToken();

switch ($resource) {
    case 'dashboard':
        getDashboard();
        break;
    case 'reports':
        getReports();
        break;
    case 'statistics':
        getStatistics();
        break;
    case 'payroll-summary':
        getPayrollSummary();
        break;
    default:
        http_response_code(404);
        die(ResponseHandler::error('Resource not found'));
}

function getDashboard() {
    $dashboard = [
        'summary' => [
            'total_employees' => 156,
            'active_employees' => 148,
            'inactive_employees' => 8,
            'total_departments' => 12,
            'total_payroll' => 9600000,
            'pending_claims' => 8
        ],
        'recent_hires' => [
            ['id' => 'EMP010', 'name' => 'Sarah Williams', 'department' => 'Finance', 'hire_date' => '2026-01-15'],
            ['id' => 'EMP011', 'name' => 'David Brown', 'department' => 'IT', 'hire_date' => '2026-01-10'],
        ],
        'upcoming_payroll' => [
            'period' => '2026-02',
            'scheduled_date' => '2026-02-28',
            'total_employees' => 156,
            'estimated_amount' => 9600000
        ],
        'health_metrics' => [
            'active_hmo_plans' => 5,
            'enrolled_employees' => 156,
            'claims_processed' => 125,
            'claims_pending' => 8
        ]
    ];
    
    echo ResponseHandler::success($dashboard, 'Dashboard data retrieved successfully');
}

function getReports() {
    $reportType = isset($_GET['type']) ? $_GET['type'] : 'summary';
    
    $reports = [
        'summary' => [
            'title' => 'Employee Summary Report',
            'generated_date' => date('Y-m-d H:i:s'),
            'total_records' => 156,
            'data' => [
                ['category' => 'Full-Time', 'count' => 140],
                ['category' => 'Part-Time', 'count' => 12],
                ['category' => 'Contract', 'count' => 4],
            ]
        ],
        'payroll' => [
            'title' => 'Payroll Report',
            'period' => '2026-01',
            'total_paid' => 8500000,
            'total_deductions' => 1200000,
            'total_net' => 7300000,
            'average_salary' => 54500
        ],
        'benefits' => [
            'title' => 'Benefits Report',
            'total_employees_covered' => 156,
            'active_plans' => 5,
            'total_claims_value' => 2500000,
            'pending_claims_value' => 450000
        ],
        'attendance' => [
            'title' => 'Attendance Report',
            'period' => '2026-01',
            'present' => '95.5%',
            'absent' => '2.3%',
            'leave' => '2.2%'
        ]
    ];
    
    if (isset($reports[$reportType])) {
        echo ResponseHandler::success($reports[$reportType], 'Report retrieved successfully');
    } else {
        echo ResponseHandler::paginated(array_values($reports), count($reports), 1, 10, 'Available reports');
    }
}

function getStatistics() {
    $statistics = [
        'employee_distribution' => [
            'by_department' => [
                ['department' => 'HR', 'count' => 8],
                ['department' => 'Finance', 'count' => 12],
                ['department' => 'IT', 'count' => 15],
                ['department' => 'Medical', 'count' => 68],
                ['department' => 'Administration', 'count' => 21],
                ['department' => 'Operations', 'count' => 32]
            ],
            'by_status' => [
                ['status' => 'Active', 'count' => 148],
                ['status' => 'On Leave', 'count' => 5],
                ['status' => 'Terminated', 'count' => 3]
            ],
            'by_level' => [
                ['level' => 'Executive', 'count' => 5],
                ['level' => 'Manager', 'count' => 20],
                ['level' => 'Senior', 'count' => 45],
                ['level' => 'Junior', 'count' => 86]
            ]
        ],
        'salary_analysis' => [
            'average_salary' => 54500,
            'highest_salary' => 150000,
            'lowest_salary' => 25000,
            'median_salary' => 48000,
            'total_payroll' => 8500000
        ],
        'benefits_statistics' => [
            'enrollment_rate' => '98.7%',
            'claims_success_rate' => '94.2%',
            'average_claim_value' => 35000,
            'total_benefits_cost' => 4200000
        ]
    ];
    
    echo ResponseHandler::success($statistics, 'Statistics retrieved successfully');
}

function getPayrollSummary() {
    $year = isset($_GET['year']) ? $_GET['year'] : date('Y');
    
    $summary = [
        'year' => (int)$year,
        'monthly_breakdown' => [
            ['month' => '01', 'gross' => 8500000, 'deductions' => 1200000, 'net' => 7300000],
            ['month' => '02', 'gross' => 8450000, 'deductions' => 1180000, 'net' => 7270000],
            ['month' => '03', 'gross' => 8600000, 'deductions' => 1250000, 'net' => 7350000],
        ],
        'totals' => [
            'total_gross' => 25550000,
            'total_deductions' => 3630000,
            'total_net' => 21920000,
            'average_monthly_payroll' => 8516667
        ],
        'deductions_breakdown' => [
            ['type' => 'Tax', 'amount' => 1850000],
            ['type' => 'Insurance', 'amount' => 950000],
            ['type' => 'Pension', 'amount' => 630000],
            ['type' => 'Other', 'amount' => 200000]
        ]
    ];
    
    echo ResponseHandler::success($summary, 'Payroll summary retrieved successfully');
}
?>
