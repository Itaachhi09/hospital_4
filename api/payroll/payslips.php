<?php
/**
 * Payslips Management Endpoints
 * GET /api/payroll/payslips - List payslips with filters
 * GET /api/payroll/payslips?id={id} - Get single payslip
 * GET /api/payroll/payslips?id={id}&action=pdf - Generate PDF
 * POST /api/payroll/payslips - Generate payslips
 * POST /api/payroll/payslips?action=batch-pdf - Batch PDF download
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$payslipId = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    switch ($method) {
        case 'GET':
            if ($payslipId) {
                if ($action === 'pdf') {
                    handleGeneratePdf($payslipId);
                } else {
                    handleGetSingle($payslipId);
                }
            } else {
                handleGetList();
            }
            break;
        
        case 'POST':
            if ($action === 'batch-pdf') {
                handleBatchPdf();
            } else {
                handleGeneratePayslips();
            }
            break;
        
        default:
            http_response_code(405);
            die(json_encode(['success' => false, 'message' => 'Method not allowed']));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

/**
 * Handle GET list of payslips with filtering
 */
function handleGetList() {
    try {
        // Fallback sample payslips data
        $fallbackPayslips = [
            [
                'id' => 'PSL001',
                'payroll_id' => 'PR001',
                'employee_id' => '9001',
                'first_name' => 'Maria',
                'last_name' => 'Cruz',
                'employee_number' => 'EMP001',
                'department' => 'Medical',
                'branch_name' => 'Main Hospital',
                'period' => '2025-10-01',
                'gross_salary' => '85000.00',
                'allowances' => '5000.00',
                'deductions' => '12000.00',
                'net_salary' => '78000.00',
                'status' => 'paid',
                'created_at' => '2025-10-25',
                'payroll_period' => 'October 2025',
                'period_end_date' => '2025-10-31'
            ],
            [
                'id' => 'PSL002',
                'payroll_id' => 'PR001',
                'employee_id' => '9002',
                'first_name' => 'Juan',
                'last_name' => 'Santos',
                'employee_number' => 'EMP002',
                'department' => 'Nursing',
                'branch_name' => 'Main Hospital',
                'period' => '2025-10-01',
                'gross_salary' => '55000.00',
                'allowances' => '3000.00',
                'deductions' => '8000.00',
                'net_salary' => '50000.00',
                'status' => 'paid',
                'created_at' => '2025-10-25',
                'payroll_period' => 'October 2025',
                'period_end_date' => '2025-10-31'
            ],
            [
                'id' => 'PSL003',
                'payroll_id' => 'PR001',
                'employee_id' => '9003',
                'first_name' => 'Ana',
                'last_name' => 'Rodriguez',
                'employee_number' => 'EMP003',
                'department' => 'Pharmacy',
                'branch_name' => 'Main Hospital',
                'period' => '2025-10-01',
                'gross_salary' => '45000.00',
                'allowances' => '2000.00',
                'deductions' => '6000.00',
                'net_salary' => '41000.00',
                'status' => 'pending',
                'created_at' => '2025-10-25',
                'payroll_period' => 'October 2025',
                'period_end_date' => '2025-10-31'
            ],
            [
                'id' => 'PSL004',
                'payroll_id' => 'PR001',
                'employee_id' => '9001',
                'first_name' => 'Maria',
                'last_name' => 'Cruz',
                'employee_number' => 'EMP001',
                'department' => 'Medical',
                'branch_name' => 'Main Hospital',
                'period' => '2025-09-01',
                'gross_salary' => '85000.00',
                'allowances' => '5000.00',
                'deductions' => '12000.00',
                'net_salary' => '78000.00',
                'status' => 'paid',
                'created_at' => '2025-09-25',
                'payroll_period' => 'September 2025',
                'period_end_date' => '2025-09-30'
            ]
        ];
        
        // Get filter parameters
        $search = $_GET['search'] ?? '';
        $branch_id = $_GET['branch_id'] ?? '';
        $payroll_run_id = $_GET['payroll_run_id'] ?? '';
        $status = $_GET['status'] ?? '';
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? 50);
        
        // Filter payslips
        $filtered = $fallbackPayslips;
        
        if ($search) {
            $filtered = array_filter($filtered, function($ps) use ($search) {
                return stripos($ps['employee_number'], $search) !== false ||
                       stripos($ps['first_name'] . ' ' . $ps['last_name'], $search) !== false;
            });
        }
        
        if ($branch_id) {
            $filtered = array_filter($filtered, function($ps) use ($branch_id) {
                return $ps['branch_name'] == $branch_id;
            });
        }
        
        if ($payroll_run_id) {
            $filtered = array_filter($filtered, function($ps) use ($payroll_run_id) {
                return $ps['payroll_id'] == $payroll_run_id;
            });
        }
        
        if ($status) {
            $filtered = array_filter($filtered, function($ps) use ($status) {
                return $ps['status'] == $status;
            });
        }
        
        $totalCount = count($filtered);
        $offset = ($page - 1) * $limit;
        $payslips = array_slice(array_values($filtered), $offset, $limit);
        
        $pagination = [
            'page' => $page,
            'limit' => $limit,
            'total' => $totalCount,
            'pages' => ceil($totalCount / $limit)
        ];
        
        echo json_encode([
            'success' => true,
            'data' => [
                'payslips' => $payslips,
                'pagination' => $pagination
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error loading payslips: ' . $e->getMessage()
        ]);
    }
}

/**
 * Handle GET single payslip
 */
function handleGetSingle($payslipId) {
    try {
        // Fallback sample payslips data
        $fallbackPayslips = [
            [
                'id' => 'PSL001',
                'payroll_id' => 'PR001',
                'employee_id' => '9001',
                'first_name' => 'Maria',
                'last_name' => 'Cruz',
                'employee_number' => 'EMP001',
                'department' => 'Medical',
                'branch_name' => 'Main Hospital',
                'period' => '2025-10-01',
                'gross_salary' => '85000.00',
                'allowances' => '5000.00',
                'deductions' => '12000.00',
                'net_salary' => '78000.00',
                'status' => 'paid',
                'created_at' => '2025-10-25',
                'payroll_period' => 'October 2025',
                'period_start_date' => '2025-10-01',
                'period_end_date' => '2025-10-31'
            ],
            [
                'id' => 'PSL002',
                'payroll_id' => 'PR001',
                'employee_id' => '9002',
                'first_name' => 'Juan',
                'last_name' => 'Santos',
                'employee_number' => 'EMP002',
                'department' => 'Nursing',
                'branch_name' => 'Main Hospital',
                'period' => '2025-10-01',
                'gross_salary' => '55000.00',
                'allowances' => '3000.00',
                'deductions' => '8000.00',
                'net_salary' => '50000.00',
                'status' => 'paid',
                'created_at' => '2025-10-25',
                'payroll_period' => 'October 2025',
                'period_start_date' => '2025-10-01',
                'period_end_date' => '2025-10-31'
            ]
        ];
        
        // Find payslip
        $payslip = null;
        foreach ($fallbackPayslips as $ps) {
            if ($ps['id'] === $payslipId) {
                $payslip = $ps;
                break;
            }
        }
        
        if (!$payslip) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Payslip not found']);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $payslip
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error loading payslip: ' . $e->getMessage()
        ]);
    }
}

/**
 * Handle Generate Payslips POST request
 */
function handleGeneratePayslips() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['branch_id']) || !isset($input['payroll_run_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'branch_id and payroll_run_id are required']);
            return;
        }
        
        // Fallback response
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Payslips generated successfully (fallback)',
            'data' => [
                'generated_count' => 3,
                'payroll_run_id' => $input['payroll_run_id'],
                'branch_id' => $input['branch_id']
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error generating payslips: ' . $e->getMessage()
        ]);
    }
}

/**
 * Handle single payslip PDF generation
 */
function handleGeneratePdf($payslipId) {
    try {
        // Fallback - return JSON response (in production, generate actual PDF)
        echo json_encode([
            'success' => true,
            'message' => 'PDF generation initiated',
            'data' => [
                'payslip_id' => $payslipId,
                'pdf_status' => 'ready',
                'download_url' => '/api/payroll/payslips?id=' . $payslipId . '&format=pdf'
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error generating PDF: ' . $e->getMessage()
        ]);
    }
}

/**
 * Handle batch PDF download
 */
function handleBatchPdf() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $payslipIds = $input['payslip_ids'] ?? [];
        
        if (empty($payslipIds)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No payslips selected']);
            return;
        }
        
        // For batch PDF, return list of download URLs
        $downloadUrls = [];
        foreach ($payslipIds as $id) {
            $downloadUrls[] = [
                'payslip_id' => $id,
                'download_url' => '/api/payroll/payslips.php?id=' . urlencode($id) . '&action=pdf'
            ];
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Batch PDF links generated',
            'data' => [
                'downloads' => $downloadUrls,
                'count' => count($downloadUrls)
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error generating batch PDFs: ' . $e->getMessage()
        ]);
    }
}
