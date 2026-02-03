<?php
/**
 * HMO Claims API Endpoints - Database Connected
 * GET /api/hmo/claims - List HMO claims
 * POST /api/hmo/claims - File new claim
 * GET /api/hmo/claims/{id} - Get claim details
 * PUT /api/hmo/claims/{id} - Update claim status
 * DELETE /api/hmo/claims/{id} - Delete claim
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
$conn = require __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

if (!$conn) {
    http_response_code(500);
    die(ResponseHandler::error('Database connection failed'));
}

$method = $_SERVER['REQUEST_METHOD'];
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts = explode('/', $path);
$claimId = isset($parts[count($parts) - 1]) && is_numeric($parts[count($parts) - 1]) ? $parts[count($parts) - 1] : null;

switch ($method) {
    case 'GET':
        handleGet($conn, $claimId);
        break;
    
    case 'POST':
        $user = AuthMiddleware::verifyToken();
        handlePost($conn, $user);
        break;
    
    case 'PUT':
        $user = AuthMiddleware::verifyToken();
        handlePut($conn, $claimId, $user);
        break;
    
    case 'DELETE':
        $user = AuthMiddleware::verifyToken();
        handleDelete($conn, $claimId, $user);
        break;
    
    default:
        http_response_code(405);
        die(ResponseHandler::error('Method not allowed'));
}

/**
 * Handle GET requests
 */
function handleGet($conn, $claimId) {
    try {
        if ($claimId) {
            // Get single claim
            $sql = "SELECT c.id, c.enrollment_id, c.claim_date, c.claim_amount, c.status, 
                           c.service_type, c.hospital_clinic, c.description, c.created_at,
                           e.first_name, e.last_name, e.email, p.plan_name
                    FROM hmo_claims c
                    LEFT JOIN hmo_enrollments en ON c.enrollment_id = en.id
                    LEFT JOIN employees e ON en.employee_id = e.id
                    LEFT JOIN hmo_plans p ON en.plan_id = p.id
                    WHERE c.id = ?";
            
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                http_response_code(500);
                die(ResponseHandler::error('Database error: ' . $conn->error));
            }
            
            $stmt->bind_param('i', $claimId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $claim = $result->fetch_assoc();
                $stmt->close();
                echo ResponseHandler::success($claim, 'HMO claim retrieved successfully');
            } else {
                $stmt->close();
                http_response_code(404);
                die(ResponseHandler::error('HMO claim not found'));
            }
        } else {
            // Get all claims with filters
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $pageSize = isset($_GET['pageSize']) ? min((int)$_GET['pageSize'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
            $offset = ($page - 1) * $pageSize;
            
            // Build filters
            $whereClause = "WHERE 1=1";
            $params = [];
            $types = '';
            
            if (!empty($_GET['status'])) {
                $whereClause .= " AND c.status = ?";
                $params[] = $_GET['status'];
                $types .= 's';
            }
            
            if (!empty($_GET['enrollment_id'])) {
                $whereClause .= " AND c.enrollment_id = ?";
                $params[] = $_GET['enrollment_id'];
                $types .= 'i';
            }
            
            if (!empty($_GET['service_type'])) {
                $whereClause .= " AND c.service_type = ?";
                $params[] = $_GET['service_type'];
                $types .= 's';
            }
            
            // Count total
            $countSQL = "SELECT COUNT(*) as total FROM hmo_claims c $whereClause";
            $countStmt = $conn->prepare($countSQL);
            if (!empty($params)) {
                $countStmt->bind_param($types, ...$params);
            }
            $countStmt->execute();
            $countResult = $countStmt->get_result();
            $countRow = $countResult->fetch_assoc();
            $countStmt->close();
            
            // Get paginated data
            $sql = "SELECT c.id, c.enrollment_id, c.claim_date, c.claim_amount, c.status,
                           c.service_type, c.hospital_clinic, c.description, c.created_at,
                           e.first_name, e.last_name, e.email, p.plan_name
                    FROM hmo_claims c
                    LEFT JOIN hmo_enrollments en ON c.enrollment_id = en.id
                    LEFT JOIN employees e ON en.employee_id = e.id
                    LEFT JOIN hmo_plans p ON en.plan_id = p.id
                    $whereClause
                    ORDER BY c.claim_date DESC
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
            
            $claims = [];
            while ($row = $result->fetch_assoc()) {
                $claims[] = $row;
            }
            
            $stmt->close();
            
            echo ResponseHandler::paginated($claims, $countRow['total'], $page, $pageSize, 'HMO claims retrieved successfully');
        }
    } catch (Exception $e) {
        http_response_code(500);
        die(ResponseHandler::error('Error: ' . $e->getMessage()));
    }
}

/**
 * Handle POST requests - File new claim
 */
function handlePost($conn, $user) {
    // Check authorization - HR and employees can file claims
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    $errors = [];
    
    if (empty($input['enrollment_id'])) {
        $errors['enrollment_id'] = 'Enrollment ID is required';
    }
    
    if (empty($input['claim_date'])) {
        $errors['claim_date'] = 'Claim date is required';
    }
    
    if (!isset($input['claim_amount']) || $input['claim_amount'] <= 0) {
        $errors['claim_amount'] = 'Valid claim amount is required';
    }
    
    if (empty($input['service_type'])) {
        $errors['service_type'] = 'Service type is required';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        die(ResponseHandler::error('Validation failed', 400, $errors));
    }
    
    // Create claim
    $claimId = 'CLAIM' . date('YmdHis') . rand(10000, 99999);
    $status = 'pending';
    
    $sql = "INSERT INTO hmo_claims (id, enrollment_id, claim_date, claim_amount, status, service_type, hospital_clinic, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sisdssss', 
        $claimId, 
        $input['enrollment_id'], 
        $input['claim_date'], 
        $input['claim_amount'],
        $status,
        $input['service_type'],
        $input['hospital_clinic'] ?? null,
        $input['description'] ?? null
    );
    
    if ($stmt->execute()) {
        $newClaim = [
            'id' => $claimId,
            'enrollment_id' => $input['enrollment_id'],
            'claim_date' => $input['claim_date'],
            'claim_amount' => (float)$input['claim_amount'],
            'status' => 'pending',
            'service_type' => $input['service_type'],
            'hospital_clinic' => $input['hospital_clinic'] ?? null,
            'description' => $input['description'] ?? null
        ];
        
        $stmt->close();
        http_response_code(201);
        echo ResponseHandler::success($newClaim, 'HMO claim filed successfully', 201);
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to file HMO claim'));
    }
}

/**
 * Handle PUT requests - Update claim status
 */
function handlePut($conn, $claimId, $user) {
    // Check authorization - HR only can update claim status
    $allowedRoles = [ROLE_ADMIN, ROLE_HR_MANAGER];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to update HMO claims'));
    }
    
    if (!$claimId) {
        http_response_code(400);
        die(ResponseHandler::error('HMO claim ID is required'));
    }
    
    // Check if claim exists
    $checkSQL = "SELECT * FROM hmo_claims WHERE id = ?";
    $checkStmt = $conn->prepare($checkSQL);
    $checkStmt->bind_param('i', $claimId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        $checkStmt->close();
        http_response_code(404);
        die(ResponseHandler::error('HMO claim not found'));
    }
    
    $oldClaim = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Build update query
    $updates = [];
    $updateValues = [];
    $types = '';
    
    if (isset($input['status'])) {
        $updates[] = 'status = ?';
        $updateValues[] = $input['status'];
        $types .= 's';
    }
    
    if (isset($input['approved_amount'])) {
        $updates[] = 'approved_amount = ?';
        $updateValues[] = $input['approved_amount'];
        $types .= 'd';
    }
    
    if (isset($input['denial_reason'])) {
        $updates[] = 'denial_reason = ?';
        $updateValues[] = $input['denial_reason'];
        $types .= 's';
    }
    
    if (empty($updates)) {
        http_response_code(400);
        die(ResponseHandler::error('No fields to update'));
    }
    
    $updateValues[] = $claimId;
    $types .= 'i';
    
    $sql = "UPDATE hmo_claims SET " . implode(', ', $updates) . " WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$updateValues);
    
    if ($stmt->execute()) {
        $stmt->close();
        echo ResponseHandler::success($input, 'HMO claim updated successfully');
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to update HMO claim'));
    }
}

/**
 * Handle DELETE requests
 */
function handleDelete($conn, $claimId, $user) {
    // Check authorization - Admin only
    if ($user['role'] !== ROLE_ADMIN) {
        http_response_code(403);
        die(ResponseHandler::error('Only administrators can delete HMO claims'));
    }
    
    if (!$claimId) {
        http_response_code(400);
        die(ResponseHandler::error('HMO claim ID is required'));
    }
    
    // Check if claim exists
    $checkSQL = "SELECT * FROM hmo_claims WHERE id = ?";
    $checkStmt = $conn->prepare($checkSQL);
    $checkStmt->bind_param('i', $claimId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        $checkStmt->close();
        http_response_code(404);
        die(ResponseHandler::error('HMO claim not found'));
    }
    
    $claim = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    // Delete claim
    $sql = "DELETE FROM hmo_claims WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $claimId);
    
    if ($stmt->execute()) {
        $stmt->close();
        echo ResponseHandler::success(null, 'HMO claim deleted successfully');
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to delete HMO claim'));
    }
}

?>
