<?php
/**
 * Pay Bonds Management API
 * HR4 Hospital HR Management System
 * 
 * Endpoints:
 * GET    /api/compensation/bonds - List pay bonds
 * POST   /api/compensation/bonds - Create new pay bond
 * GET    /api/compensation/bonds/{id} - Get bond details
 * PUT    /api/compensation/bonds/{id} - Update bond
 * POST   /api/compensation/bonds/{id}/activate - Activate bond
 * POST   /api/compensation/bonds/{id}/deductions - Get deduction schedule
 * POST   /api/compensation/bonds/{id}/deductions/process - Process monthly deduction
 * POST   /api/compensation/bonds/{id}/early-termination - Handle early termination
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
@$conn = require __DIR__ . '/../config/database.php';

if (!$conn) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed']));
}
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_filter(explode('/', $path));

$bondId = null;
$action = null;

if (count($parts) >= 5) {
    $bondId = $parts[count($parts) - 2] ?? null;
    $action = $parts[count($parts) - 1] ?? null;

    if ($parts[count($parts) - 1] === 'bonds') {
        $action = null;
        $bondId = null;
    }
}

try {
    switch ($method) {
        case 'GET':
            if ($bondId && $action === 'deductions') {
                handleGetDeductions($conn, $bondId);
            } elseif ($bondId) {
                handleGetDetail($conn, $bondId);
            } else {
                handleGetList($conn);
            }
            break;

        case 'POST':
            $user = AuthMiddleware::verifyToken();
            if ($action === 'activate' && $bondId) {
                handleActivate($conn, $bondId, $user);
            } elseif ($action === 'process' && $bondId) {
                handleProcessDeduction($conn, $bondId, $user);
            } elseif ($action === 'early-termination' && $bondId) {
                handleEarlyTermination($conn, $bondId, $user);
            } else {
                handleCreate($conn, $user);
            }
            break;

        case 'PUT':
            $user = AuthMiddleware::verifyToken();
            handleUpdate($conn, $bondId, $user);
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
    $mockBonds = [
        [
            'id' => 1,
            'bond_id' => 'BOND-001',
            'employee_id' => 'EMP-001',
            'employee_code' => 'N001',
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'bond_category' => 'training_bond',
            'bond_amount' => 50000,
            'monthly_deduction' => 2500,
            'total_deducted' => 7500,
            'remaining_balance' => 42500,
            'bond_status' => 'active',
            'start_date' => '2023-06-01',
            'end_date' => '2026-06-01',
            'payment_history' => [
                ['month' => 'Jan 2024', 'deduction' => 2500, 'balance' => 40000],
                ['month' => 'Feb 2024', 'deduction' => 2500, 'balance' => 37500],
                ['month' => 'Mar 2024', 'deduction' => 2500, 'balance' => 35000]
            ],
            'legal_notes' => 'Training Bond Agreement - Training Program Completion'
        ],
        [
            'id' => 2,
            'bond_id' => 'BOND-002',
            'employee_id' => 'EMP-002',
            'employee_code' => 'N002',
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'bond_category' => 'contractual_bond',
            'bond_amount' => 30000,
            'monthly_deduction' => 1000,
            'total_deducted' => 3000,
            'remaining_balance' => 27000,
            'bond_status' => 'active',
            'start_date' => '2024-01-01',
            'end_date' => '2027-01-01',
            'payment_history' => [
                ['month' => 'Jan 2024', 'deduction' => 1000, 'balance' => 29000],
                ['month' => 'Feb 2024', 'deduction' => 1000, 'balance' => 28000],
                ['month' => 'Mar 2024', 'deduction' => 1000, 'balance' => 27000]
            ],
            'legal_notes' => 'Contractual Bond - 3 Year Service Requirement'
        ]
    ];
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $mockBonds,
        'total' => count($mockBonds),
        'page' => 1,
        'pages' => 1
    ]);
}

function handleGetDetail($conn, $bondId) {
    $sql = "SELECT pb.*, e.employee_code, e.first_name, e.last_name, e.email
            FROM pay_bonds pb 
            JOIN employees e ON pb.employee_id = e.id 
            WHERE pb.id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $bondId);
    $stmt->execute();
    $bond = $stmt->get_result()->fetch_assoc();

    if (!$bond) {
        http_response_code(404);
        die(json_encode(ResponseHandler::error('Pay bond not found')));
    }

    // Get deductions processed
    $sql = "SELECT * FROM pay_bond_deductions WHERE bond_id = ? ORDER BY deduction_month DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $bondId);
    $stmt->execute();
    $bond['deductions'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    http_response_code(200);
    echo json_encode(ResponseHandler::success($bond));
}

function handleGetDeductions($conn, $bondId) {
    $sql = "SELECT * FROM pay_bond_deductions WHERE bond_id = ? ORDER BY deduction_month DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $bondId);
    $stmt->execute();
    $deductions = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Get bond details
    $sql = "SELECT id, bond_amount, monthly_deduction, total_deducted, remaining_balance FROM pay_bonds WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $bondId);
    $stmt->execute();
    $bond = $stmt->get_result()->fetch_assoc();

    if (!$bond) {
        http_response_code(404);
        die(json_encode(ResponseHandler::error('Pay bond not found')));
    }

    http_response_code(200);
    echo json_encode(ResponseHandler::success([
        'bond_summary' => $bond,
        'deductions' => $deductions
    ]));
}

function handleCreate($conn, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['employee_id', 'bond_type', 'bond_amount', 'monthly_deduction', 'deduction_start_date'];
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

    $bondId = 'BOND' . date('YmdHis') . rand(1000, 9999);
    $conditionDetails = json_encode($data['condition_details'] ?? []);

    $sql = "INSERT INTO pay_bonds 
            (id, employee_id, bond_type, bond_amount, monthly_deduction, 
             deduction_start_date, condition_details, created_by, bond_status, 
             total_deducted, remaining_balance, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0, ?, NOW(), NOW())";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        'sssddsssds',
        $bondId,
        $data['employee_id'],
        $data['bond_type'],
        $data['bond_amount'],
        $data['monthly_deduction'],
        $data['deduction_start_date'],
        $conditionDetails,
        $user['id'],
        $data['bond_amount']
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        die(json_encode(ResponseHandler::error('Failed to create pay bond')));
    }

    logBondHistory($conn, $bondId, 'created', ['amount' => $data['bond_amount']], $user['id']);

    http_response_code(201);
    echo json_encode(ResponseHandler::success(['id' => $bondId, 'message' => 'Pay bond created successfully']));
}

function handleUpdate($conn, $bondId, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $sql = "SELECT * FROM pay_bonds WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $bondId);
    $stmt->execute();
    $bond = $stmt->get_result()->fetch_assoc();

    if (!$bond) {
        http_response_code(404);
        die(json_encode(ResponseHandler::error('Pay bond not found')));
    }

    if ($bond['bond_status'] !== 'draft') {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Can only update draft bonds')));
    }

    $updateFields = [];
    $params = [];

    if (isset($data['monthly_deduction'])) {
        $updateFields[] = 'monthly_deduction = ?';
        $params[] = $data['monthly_deduction'];
    }

    if (empty($updateFields)) {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('No fields to update')));
    }

    $params[] = $bondId;
    $sql = "UPDATE pay_bonds SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(str_repeat('s', count($params)), ...$params);

    if (!$stmt->execute()) {
        http_response_code(500);
        die(json_encode(ResponseHandler::error('Failed to update pay bond')));
    }

    logBondHistory($conn, $bondId, 'updated', $data, $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success(['message' => 'Pay bond updated successfully']));
}

function handleActivate($conn, $bondId, $user) {
    $sql = "UPDATE pay_bonds 
            SET bond_status = 'active', activated_date = NOW()
            WHERE id = ? AND bond_status = 'draft'";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $bondId);

    if (!$stmt->execute() || $stmt->affected_rows === 0) {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Failed to activate pay bond')));
    }

    logBondHistory($conn, $bondId, 'activated', ['activated_by' => $user['id']], $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success(['message' => 'Pay bond activated']));
}

function handleProcessDeduction($conn, $bondId, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    // Get bond details
    $sql = "SELECT * FROM pay_bonds WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $bondId);
    $stmt->execute();
    $bond = $stmt->get_result()->fetch_assoc();

    if (!$bond) {
        http_response_code(404);
        die(json_encode(ResponseHandler::error('Pay bond not found')));
    }

    if ($bond['bond_status'] !== 'active') {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Bond must be active to process deductions')));
    }

    // Check if balance > 0
    if ($bond['remaining_balance'] <= 0) {
        http_response_code(400);
        die(json_encode(ResponseHandler::error('Bond already fully deducted')));
    }

    // Create deduction record
    $deductionId = 'DEDN' . date('YmdHis') . rand(1000, 9999);
    $deductionMonth = $data['deduction_month'] ?? date('Y-m-01');
    $deductionAmount = min($bond['monthly_deduction'], $bond['remaining_balance']);
    $newBalance = $bond['remaining_balance'] - $deductionAmount;

    $sql = "INSERT INTO pay_bond_deductions 
            (id, bond_id, deduction_month, deduction_amount, remaining_balance, processed_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        'sssdds',
        $deductionId,
        $bondId,
        $deductionMonth,
        $deductionAmount,
        $newBalance,
        $user['id']
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        die(json_encode(ResponseHandler::error('Failed to process deduction')));
    }

    // Update bond totals
    $newTotalDeducted = $bond['total_deducted'] + $deductionAmount;
    $newBondStatus = $newBalance <= 0 ? 'completed' : 'active';

    $sql = "UPDATE pay_bonds 
            SET total_deducted = ?, remaining_balance = ?, bond_status = ?, updated_at = NOW()
            WHERE id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ddss', $newTotalDeducted, $newBalance, $newBondStatus, $bondId);
    $stmt->execute();

    logBondHistory($conn, $bondId, 'deduction_processed', [
        'amount' => $deductionAmount,
        'remaining' => $newBalance
    ], $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success([
        'message' => 'Bond deduction processed',
        'deduction_amount' => $deductionAmount,
        'remaining_balance' => $newBalance
    ]));
}

function handleEarlyTermination($conn, $bondId, $user) {
    $data = json_decode(file_get_contents('php://input'), true);

    $sql = "SELECT * FROM pay_bonds WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $bondId);
    $stmt->execute();
    $bond = $stmt->get_result()->fetch_assoc();

    if (!$bond) {
        http_response_code(404);
        die(json_encode(ResponseHandler::error('Pay bond not found')));
    }

    // Calculate penalty if applicable
    $penalty = $data['penalty'] ?? 0;
    $terminationReason = $data['reason'] ?? 'employee_resignation';
    $finalBalance = $bond['remaining_balance'] + $penalty;

    // Update bond status
    $sql = "UPDATE pay_bonds 
            SET bond_status = 'terminated', 
                termination_reason = ?, 
                termination_penalty = ?,
                final_settlement_amount = ?,
                updated_at = NOW()
            WHERE id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sdds', $terminationReason, $penalty, $finalBalance, $bondId);

    if (!$stmt->execute()) {
        http_response_code(500);
        die(json_encode(ResponseHandler::error('Failed to process early termination')));
    }

    logBondHistory($conn, $bondId, 'early_terminated', [
        'reason' => $terminationReason,
        'penalty' => $penalty,
        'final_amount' => $finalBalance
    ], $user['id']);

    http_response_code(200);
    echo json_encode(ResponseHandler::success([
        'message' => 'Pay bond terminated',
        'remaining_balance' => $bond['remaining_balance'],
        'penalty' => $penalty,
        'final_settlement_amount' => $finalBalance
    ]));
}

function logBondHistory($conn, $bondId, $eventType, $data, $userId) {
    $dataJson = json_encode($data);

    $sql = "INSERT INTO compensation_audit_log 
            (id, entity_type, entity_id, event_type, data, performed_by, created_at) 
            VALUES (?, 'pay_bond', ?, ?, ?, ?, NOW())";

    $logId = 'LOG' . date('YmdHis') . rand(1000, 9999);
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sssss', $logId, $bondId, $eventType, $dataJson, $userId);
    $stmt->execute();
}
?>
