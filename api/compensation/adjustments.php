<?php
/**
 * Salary Adjustments Management API
 * HR4 Hospital HR Management System
 * 
 * Endpoints:
 * GET    /api/compensation/adjustments - List salary adjustments
 * POST   /api/compensation/adjustments - Create new adjustment
 * GET    /api/compensation/adjustments/{id} - Get adjustment details
 * PUT    /api/compensation/adjustments/{id} - Update adjustment
 * POST   /api/compensation/adjustments/{id}/approve-hr - HR approval
 * POST   /api/compensation/adjustments/{id}/approve-finance - Finance approval
 * POST   /api/compensation/adjustments/{id}/reject - Reject adjustment
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
@$conn = require __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

if (!$conn) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed']));
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$parts = array_filter(explode('/', $path));

$adjustmentId = null;
$action = null;

if (count($parts) >= 5) {
    $adjustmentId = $parts[count($parts) - 2] ?? null;
    $action = $parts[count($parts) - 1] ?? null;
    
    if ($action === 'adjustments') {
        $action = null;
        $adjustmentId = null;
    }
}

try {
    switch ($method) {
        case 'GET':
            if ($adjustmentId) {
                handleGetDetail($conn, $adjustmentId);
            } else {
                handleGetList($conn);
            }
            break;

        case 'POST':
            $user = AuthMiddleware::verifyToken();
            if ($action === 'approve-hr' && $adjustmentId) {
                handleApproveHR($conn, $adjustmentId, $user);
            } elseif ($action === 'approve-finance' && $adjustmentId) {
                handleApproveFinance($conn, $adjustmentId, $user);
            } elseif ($action === 'reject' && $adjustmentId) {
                handleReject($conn, $adjustmentId, $user);
            } else {
                handleCreate($conn, $user);
            }
            break;

        case 'PUT':
            $user = AuthMiddleware::verifyToken();
            handleUpdate($conn, $adjustmentId, $user);
            break;

        default:
            http_response_code(405);
            die(json_encode(ResponseHandler::error('Method not allowed')));
    }
} catch (Exception $e) {
    http_response_code(500);
    die(json_encode(ResponseHandler::error('Server error: ' . $e->getMessage())));
}

function handleGetList($conn) {
    // Return mock data for now
    $mockAdjustments = [
        [
            'id' => 1,
            'adjustment_id' => 'SA-001',
            'employee_id' => 'EMP-001',
            'employee_code' => 'N001',
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'position' => 'Registered Nurse',
            'department' => 'Nursing',
            'adjustment_type' => 'merit_increase',
            'current_salary' => 45000,
            'new_salary' => 48000,
            'amount_adjusted' => 3000,
            'percentage_change' => 6.67,
            'reason' => 'Annual performance merit increase',
            'effective_date' => '2026-02-01',
            'approval_status' => 'submitted'
        ],
        [
            'id' => 2,
            'adjustment_id' => 'SA-002',
            'employee_id' => 'EMP-002',
            'employee_code' => 'N002',
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'position' => 'Senior Registered Nurse',
            'department' => 'Nursing',
            'adjustment_type' => 'promotion_increase',
            'current_salary' => 52000,
            'new_salary' => 55000,
            'amount_adjusted' => 3000,
            'percentage_change' => 5.77,
            'reason' => 'Promotion to Senior position',
            'effective_date' => '2026-02-01',
            'approval_status' => 'approved'
        ]
    ];
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $mockAdjustments,
        'total' => count($mockAdjustments),
        'page' => 1,
        'pages' => 1
    ]);
}

function handleGetDetail($conn, $adjustmentId) {
    $sql = "SELECT sa.*, e.employee_code, e.first_name, e.last_name, e.email 
            FROM salary_adjustments sa 
            JOIN employees e ON sa.employee_id = e.id 
            WHERE sa.id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $adjustmentId);
    $stmt->execute();
    $adjustment = $stmt->get_result()->fetch_assoc();

    if (!$adjustment) {
        http_response_code(404);
        die(json_encode(ResponseHandler::error('Salary adjustment not found')));
    }

    // Parse JSON fields
    $adjustment['payroll_impact_preview'] = $adjustment['payroll_impact_preview'] ? json_decode($adjustment['payroll_impact_preview'], true) : [];

    // Get history
    $sql = "SELECT * FROM salary_adjustment_history WHERE adjustment_id = ? ORDER BY created_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $adjustmentId);
    $stmt->execute();
    $adjustment['history'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    http_response_code(200);
    echo json_encode(ResponseHandler::success($adjustment));
}

function handleCreate($conn, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['employee_id', 'adjustment_type', 'current_salary', 'new_salary', 'effective_date'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            die(json_encode(ResponseHandler::error("Missing required field: $field")));
        }
    }

    // Validate employee exists
    $sql = "SELECT id FROM employees WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $data['employee_id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(404);
        die(json_encode(ResponseHandler::error('Employee not found')));
    }

    $adjustmentId = 'SADJ' . date('YmdHis') . rand(1000, 9999);
    $amountAdjusted = $data['new_salary'] - $data['current_salary'];
    $percentageChange = ($amountAdjusted / $data['current_salary']) * 100;

    $sql = "INSERT INTO salary_adjustments 
            (id, employee_id, adjustment_type, current_salary, new_salary, amount_adjusted, 
             percentage_change, effective_date, reason, requested_by, approval_status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        'sssddddsss',
        $adjustmentId,
        $data['employee_id'],
        $data['adjustment_type'],
        $data['current_salary'],
        $data['new_salary'],
        $amountAdjusted,
        $percentageChange,
        $data['effective_date'],
        $data['reason'] ?? null,
        $user['id']
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        die(json_encode(ResponseHandler::error('Failed to create salary adjustment')));
    }

    logAdjustmentHistory($conn, $adjustmentId, 'created', null, ['new_salary' => $data['new_salary']], $user['id']);

    http_response_code(201);
    echo json_encode(ResponseHandler::success(['id' => $adjustmentId, 'message' => 'Salary adjustment created successfully']));
}

function handleUpdate($conn, $adjustmentId, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $sql = "SELECT * FROM salary_adjustments WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $adjustmentId);
    $stmt->execute();
    $adjustment = $stmt->get_result()->fetch_assoc();

    if (!$adjustment) {
        http_response_code(404);
        die(json_encode(ResponseHandler::error('Salary adjustment not found')));
    }

    if ($adjustment['approval_status'] !== 'pending') {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Can only update pending adjustments')));
    }

    $updateFields = [];
    $params = [];

    if (isset($data['new_salary'])) {
        $updateFields[] = 'new_salary = ?';
        $params[] = $data['new_salary'];
        $amountAdjusted = $data['new_salary'] - $adjustment['current_salary'];
        $updateFields[] = 'amount_adjusted = ?';
        $params[] = $amountAdjusted;
    }

    if (empty($updateFields)) {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('No fields to update')));
    }

    $params[] = $adjustmentId;
    $sql = "UPDATE salary_adjustments SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(str_repeat('s', count($params)), ...$params);

    if (!$stmt->execute()) {
        http_response_code(500);
        die(json_encode(ResponseHandler::error('Failed to update salary adjustment')));
    }

    logAdjustmentHistory($conn, $adjustmentId, 'updated', $adjustment, $data, $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success(['message' => 'Salary adjustment updated successfully']));
}

function handleApproveHR($conn, $adjustmentId, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $sql = "UPDATE salary_adjustments 
            SET approved_by_hr = ?, hr_approval_date = NOW(), approval_status = 'hr_approved'
            WHERE id = ? AND approval_status = 'pending'";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $user['id'], $adjustmentId);

    if (!$stmt->execute() || $stmt->affected_rows === 0) {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Failed to approve salary adjustment')));
    }

    logAdjustmentHistory($conn, $adjustmentId, 'approved', null, ['approved_by' => $user['id']], $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success(['message' => 'Salary adjustment HR approved']));
}

function handleApproveFinance($conn, $adjustmentId, $user) {
    $sql = "UPDATE salary_adjustments 
            SET approved_by_finance = ?, finance_approval_date = NOW(), 
                final_approved_by = ?, final_approval_date = NOW(), approval_status = 'finance_approved'
            WHERE id = ? AND approval_status = 'hr_approved'";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sss', $user['id'], $user['id'], $adjustmentId);

    if (!$stmt->execute() || $stmt->affected_rows === 0) {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Failed to approve salary adjustment')));
    }

    logAdjustmentHistory($conn, $adjustmentId, 'approved', null, ['finance_approved_by' => $user['id']], $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success(['message' => 'Salary adjustment finance approved and finalized']));
}

function handleReject($conn, $adjustmentId, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $sql = "UPDATE salary_adjustments 
            SET approval_status = 'rejected', rejection_reason = ?
            WHERE id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $data['reason'] ?? null, $adjustmentId);

    if (!$stmt->execute() || $stmt->affected_rows === 0) {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Failed to reject salary adjustment')));
    }

    logAdjustmentHistory($conn, $adjustmentId, 'rejected', null, ['reason' => $data['reason'] ?? null], $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success(['message' => 'Salary adjustment rejected']));
}

function logAdjustmentHistory($conn, $adjustmentId, $eventType, $oldValues, $newValues, $userId) {
    $historyId = 'HIST' . date('YmdHis') . rand(1000, 9999);
    $oldJson = json_encode($oldValues);
    $newJson = json_encode($newValues);

    $sql = "INSERT INTO salary_adjustment_history 
            (id, adjustment_id, event_type, changed_by, old_values, new_values, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ssssss', $historyId, $adjustmentId, $eventType, $userId, $oldJson, $newJson);
    $stmt->execute();
}
?>
