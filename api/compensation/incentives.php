<?php
/**
 * Incentives Management API
 * HR4 Hospital HR Management System
 * 
 * Endpoints:
 * GET    /api/compensation/incentives - List incentive issuances
 * POST   /api/compensation/incentives - Create new incentive issuance
 * GET    /api/compensation/incentives/{id} - Get issuance details
 * GET    /api/compensation/incentives/types/list - List incentive types
 * POST   /api/compensation/incentives/types - Create incentive type
 * POST   /api/compensation/incentives/{id}/approve - Approve issuance
 * POST   /api/compensation/incentives/{id}/reject - Reject issuance
 * POST   /api/compensation/incentives/{id}/mark-paid - Mark as paid
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_filter(explode('/', $path));

$issuanceId = null;
$action = null;

if (count($parts) >= 5) {
    $issuanceId = $parts[count($parts) - 2] ?? null;
    $action = $parts[count($parts) - 1] ?? null;

    // Check for /types/list
    if ($parts[count($parts) - 2] === 'types' && $parts[count($parts) - 1] === 'list') {
        $issuanceId = null;
        $action = 'types-list';
    } elseif ($parts[count($parts) - 1] === 'incentives') {
        $action = null;
        $issuanceId = null;
    }
}

try {
    switch ($method) {
        case 'GET':
            if ($action === 'types-list') {
                handleGetTypes($conn);
            } elseif ($issuanceId) {
                handleGetDetail($conn, $issuanceId);
            } else {
                handleGetList($conn);
            }
            break;

        case 'POST':
            $user = AuthMiddleware::verifyToken();
            if ($action === 'types') {
                handleCreateType($conn, $user);
            } elseif ($action === 'approve' && $issuanceId) {
                handleApprove($conn, $issuanceId, $user);
            } elseif ($action === 'reject' && $issuanceId) {
                handleReject($conn, $issuanceId, $user);
            } elseif ($action === 'mark-paid' && $issuanceId) {
                handleMarkPaid($conn, $issuanceId, $user);
            } else {
                handleCreate($conn, $user);
            }
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
    $mockIncentives = [
        [
            'id' => 1,
            'incentive_id' => 'INC-001',
            'employee_id' => 'EMP-001',
            'employee_code' => 'N001',
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'incentive_category' => 'performance_bonus',
            'incentive_amount' => 5000,
            'payment_basis' => 'Performance',
            'tax_status' => 'taxable',
            'approval_status' => 'approved',
            'paid_status' => 'pending',
            'distribution_status' => 'pending',
            'one_time_or_recurring' => 'One-time',
            'distribution_date' => '2026-02-15',
            'grant_history' => [
                ['date' => '2024-01-15', 'amount' => 3000],
                ['date' => '2023-01-15', 'amount' => 2500]
            ]
        ],
        [
            'id' => 2,
            'incentive_id' => 'INC-002',
            'employee_id' => 'EMP-002',
            'employee_code' => 'N002',
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'incentive_category' => 'holiday_pay',
            'incentive_amount' => 8000,
            'payment_basis' => 'Fixed',
            'tax_status' => 'non_taxable',
            'approval_status' => 'approved',
            'paid_status' => 'paid',
            'distribution_status' => 'distributed',
            'one_time_or_recurring' => 'Recurring',
            'distribution_date' => '2026-01-15',
            'grant_history' => [
                ['date' => '2025-01-15', 'amount' => 8000],
                ['date' => '2024-01-15', 'amount' => 8000]
            ]
        ]
    ];
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $mockIncentives,
        'total' => count($mockIncentives),
        'page' => 1,
        'pages' => 1
    ]);
}

function handleGetDetail($conn, $issuanceId) {
    $sql = "SELECT ii.*, e.employee_code, e.first_name, e.last_name, e.email,
            it.name as incentive_type, it.description as type_description
            FROM incentive_issuances ii 
            JOIN employees e ON ii.employee_id = e.id 
            JOIN incentive_types it ON ii.incentive_type_id = it.id
            WHERE ii.id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $issuanceId);
    $stmt->execute();
    $issuance = $stmt->get_result()->fetch_assoc();

    if (!$issuance) {
        http_response_code(404);
        die(json_encode(ResponseHandler::error('Incentive issuance not found')));
    }

    $issuance['criteria'] = $issuance['criteria'] ? json_decode($issuance['criteria'], true) : [];

    http_response_code(200);
    echo json_encode(ResponseHandler::success($issuance));
}

function handleGetTypes($conn) {
    $sql = "SELECT * FROM incentive_types WHERE status = 'active' ORDER BY name";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $types = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    http_response_code(200);
    echo json_encode(ResponseHandler::success(['types' => $types]));
}

function handleCreate($conn, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['employee_id', 'incentive_type_id', 'amount', 'incentive_month'];
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

    // Validate incentive type
    $sql = "SELECT id FROM incentive_types WHERE id = ? AND status = 'active'";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $data['incentive_type_id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(404);
        die(json_encode(ResponseHandler::error('Incentive type not found')));
    }

    $issuanceId = 'INCV' . date('YmdHis') . rand(1000, 9999);
    $criteria = json_encode($data['criteria'] ?? []);
    $paymentBasis = $data['payment_basis'] ?? 'fixed';

    $sql = "INSERT INTO incentive_issuances 
            (id, employee_id, incentive_type_id, amount, payment_basis, incentive_month, 
             criteria, remarks, issued_by, approval_status, paid_status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', NOW(), NOW())";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        'sssdsss',
        $issuanceId,
        $data['employee_id'],
        $data['incentive_type_id'],
        $data['amount'],
        $paymentBasis,
        $data['incentive_month'],
        $criteria,
        $data['remarks'] ?? null,
        $user['id']
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        die(json_encode(ResponseHandler::error('Failed to create incentive issuance')));
    }

    logIncentiveHistory($conn, $issuanceId, 'created', ['amount' => $data['amount']], $user['id']);

    http_response_code(201);
    echo json_encode(ResponseHandler::success(['id' => $issuanceId, 'message' => 'Incentive issuance created successfully']));
}

function handleCreateType($conn, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['name', 'description'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            die(json_encode(ResponseHandler::error("Missing required field: $field")));
        }
    }

    $typeId = 'ITYPE' . date('YmdHis') . rand(1000, 9999);

    $sql = "INSERT INTO incentive_types 
            (id, name, description, category, status, created_at) 
            VALUES (?, ?, ?, ?, 'active', NOW())";

    $stmt = $conn->prepare($sql);
    $category = $data['category'] ?? 'other';
    $stmt->bind_param('ssss', $typeId, $data['name'], $data['description'], $category);

    if (!$stmt->execute()) {
        http_response_code(500);
        die(json_encode(ResponseHandler::error('Failed to create incentive type')));
    }

    http_response_code(201);
    echo json_encode(ResponseHandler::success(['id' => $typeId, 'message' => 'Incentive type created successfully']));
}

function handleApprove($conn, $issuanceId, $user) {
    $sql = "UPDATE incentive_issuances 
            SET approval_status = 'approved', approved_by = ?, approval_date = NOW()
            WHERE id = ? AND approval_status = 'pending'";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $user['id'], $issuanceId);

    if (!$stmt->execute() || $stmt->affected_rows === 0) {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Failed to approve incentive issuance')));
    }

    logIncentiveHistory($conn, $issuanceId, 'approved', ['approved_by' => $user['id']], $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success(['message' => 'Incentive issuance approved']));
}

function handleReject($conn, $issuanceId, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $sql = "UPDATE incentive_issuances 
            SET approval_status = 'rejected', rejection_reason = ?
            WHERE id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $data['reason'] ?? null, $issuanceId);

    if (!$stmt->execute() || $stmt->affected_rows === 0) {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Failed to reject incentive issuance')));
    }

    logIncentiveHistory($conn, $issuanceId, 'rejected', ['reason' => $data['reason'] ?? null], $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success(['message' => 'Incentive issuance rejected']));
}

function handleMarkPaid($conn, $issuanceId, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $sql = "UPDATE incentive_issuances 
            SET paid_status = 'paid', paid_date = NOW(), paid_through = ?
            WHERE id = ?";

    $stmt = $conn->prepare($sql);
    $paidThrough = $data['paid_through'] ?? 'payroll';
    $stmt->bind_param('ss', $paidThrough, $issuanceId);

    if (!$stmt->execute() || $stmt->affected_rows === 0) {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Failed to mark incentive as paid')));
    }

    logIncentiveHistory($conn, $issuanceId, 'marked_paid', ['paid_through' => $paidThrough], $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success(['message' => 'Incentive marked as paid']));
}

function logIncentiveHistory($conn, $issuanceId, $eventType, $data, $userId) {
    $dataJson = json_encode($data);

    $sql = "INSERT INTO compensation_audit_log 
            (id, entity_type, entity_id, event_type, data, performed_by, created_at) 
            VALUES (?, 'incentive_issuance', ?, ?, ?, ?, NOW())";

    $logId = 'LOG' . date('YmdHis') . rand(1000, 9999);
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sssss', $logId, $issuanceId, $eventType, $dataJson, $userId);
    $stmt->execute();
}
?>
