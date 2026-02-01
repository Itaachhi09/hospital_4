<?php
/**
 * HMO Enrollments API Endpoints - Database Connected
 * GET /api/hmo/enrollments - List HMO enrollments
 * POST /api/hmo/enrollments - Create enrollment
 * GET /api/hmo/enrollments/{id} - Get enrollment details
 * PUT /api/hmo/enrollments/{id} - Update enrollment
 * DELETE /api/hmo/enrollments/{id} - Delete enrollment
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts = explode('/', $path);
$enrollmentId = isset($parts[count($parts) - 1]) && is_numeric($parts[count($parts) - 1]) ? $parts[count($parts) - 1] : null;

switch ($method) {
    case 'GET':
        handleGet($conn, $enrollmentId);
        break;
    
    case 'POST':
        $user = AuthMiddleware::verifyToken();
        handlePost($conn, $user);
        break;
    
    case 'PUT':
        $user = AuthMiddleware::verifyToken();
        handlePut($conn, $enrollmentId, $user);
        break;
    
    case 'DELETE':
        $user = AuthMiddleware::verifyToken();
        handleDelete($conn, $enrollmentId, $user);
        break;
    
    default:
        http_response_code(405);
        die(ResponseHandler::error('Method not allowed'));
}

/**
 * Handle GET requests
 */
function handleGet($conn, $enrollmentId) {
    try {
        if ($enrollmentId) {
            // Get single enrollment
            $sql = "SELECT e.id, e.employee_id, emp.first_name, emp.last_name, emp.email, 
                           e.plan_id, p.plan_name, e.enrollment_date, e.status, e.coverage_type,
                           e.premium_amount, e.created_at
                    FROM hmo_enrollments e
                    LEFT JOIN employees emp ON e.employee_id = emp.id
                    LEFT JOIN hmo_plans p ON e.plan_id = p.id
                    WHERE e.id = ?";
            
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                http_response_code(500);
                die(ResponseHandler::error('Database error: ' . $conn->error));
            }
            
            $stmt->bind_param('i', $enrollmentId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $enrollment = $result->fetch_assoc();
                $stmt->close();
                echo ResponseHandler::success($enrollment, 'HMO enrollment retrieved successfully');
            } else {
                $stmt->close();
                http_response_code(404);
                die(ResponseHandler::error('HMO enrollment not found'));
            }
        } else {
            // Get all enrollments with filters
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $pageSize = isset($_GET['pageSize']) ? min((int)$_GET['pageSize'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
            $offset = ($page - 1) * $pageSize;
            
            // Build filters
            $whereClause = "WHERE 1=1";
            $params = [];
            $types = '';
            
            if (!empty($_GET['employee_id'])) {
                $whereClause .= " AND e.employee_id = ?";
                $params[] = $_GET['employee_id'];
                $types .= 'i';
            }
            
            if (!empty($_GET['status'])) {
                $whereClause .= " AND e.status = ?";
                $params[] = $_GET['status'];
                $types .= 's';
            }
            
            if (!empty($_GET['plan_id'])) {
                $whereClause .= " AND e.plan_id = ?";
                $params[] = $_GET['plan_id'];
                $types .= 'i';
            }
            
            // Count total
            $countSQL = "SELECT COUNT(*) as total FROM hmo_enrollments e $whereClause";
            $countStmt = $conn->prepare($countSQL);
            if (!empty($params)) {
                $countStmt->bind_param($types, ...$params);
            }
            $countStmt->execute();
            $countResult = $countStmt->get_result();
            $countRow = $countResult->fetch_assoc();
            $countStmt->close();
            
            // Get paginated data
            $sql = "SELECT e.id, e.employee_id, emp.first_name, emp.last_name, emp.email,
                           e.plan_id, p.plan_name, e.enrollment_date, e.status, e.coverage_type,
                           e.premium_amount, e.created_at
                    FROM hmo_enrollments e
                    LEFT JOIN employees emp ON e.employee_id = emp.id
                    LEFT JOIN hmo_plans p ON e.plan_id = p.id
                    $whereClause
                    ORDER BY e.enrollment_date DESC
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
            
            $enrollments = [];
            while ($row = $result->fetch_assoc()) {
                $enrollments[] = $row;
            }
            
            $stmt->close();
            
            echo ResponseHandler::paginated($enrollments, $countRow['total'], $page, $pageSize, 'HMO enrollments retrieved successfully');
        }
    } catch (Exception $e) {
        http_response_code(500);
        die(ResponseHandler::error('Error: ' . $e->getMessage()));
    }
}

/**
 * Handle POST requests - Create enrollment
 */
function handlePost($conn, $user) {
    // Check authorization
    $allowedRoles = [ROLE_ADMIN, ROLE_HR_MANAGER];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to create HMO enrollments'));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    $errors = [];
    
    if (empty($input['employee_id'])) {
        $errors['employee_id'] = 'Employee ID is required';
    }
    
    if (empty($input['plan_id'])) {
        $errors['plan_id'] = 'HMO Plan ID is required';
    }
    
    if (empty($input['enrollment_date'])) {
        $errors['enrollment_date'] = 'Enrollment date is required';
    }
    
    if (empty($input['coverage_type'])) {
        $errors['coverage_type'] = 'Coverage type is required';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        die(ResponseHandler::error('Validation failed', 400, $errors));
    }
    
    // Create enrollment
    $enrollmentId = 'HMOE' . date('YmdHis') . rand(1000, 9999);
    $sql = "INSERT INTO hmo_enrollments (id, employee_id, plan_id, enrollment_date, coverage_type, status, premium_amount, created_at)
            VALUES (?, ?, ?, ?, ?, 'active', ?, NOW())";
    
    $stmt = $conn->prepare($sql);
    $premiumAmount = $input['premium_amount'] ?? 0;
    $stmt->bind_param('siissd', $enrollmentId, $input['employee_id'], $input['plan_id'], $input['enrollment_date'], $input['coverage_type'], $premiumAmount);
    
    if ($stmt->execute()) {
        $newEnrollment = [
            'id' => $enrollmentId,
            'employee_id' => $input['employee_id'],
            'plan_id' => $input['plan_id'],
            'enrollment_date' => $input['enrollment_date'],
            'coverage_type' => $input['coverage_type'],
            'premium_amount' => (float)$premiumAmount,
            'status' => 'active'
        ];
        
        $stmt->close();
        http_response_code(201);
        echo ResponseHandler::success($newEnrollment, 'HMO enrollment created successfully', 201);
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to create HMO enrollment'));
    }
}

/**
 * Handle PUT requests - Update enrollment
 */
function handlePut($conn, $enrollmentId, $user) {
    // Check authorization
    $allowedRoles = [ROLE_ADMIN, ROLE_HR_MANAGER];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to update HMO enrollments'));
    }
    
    if (!$enrollmentId) {
        http_response_code(400);
        die(ResponseHandler::error('HMO enrollment ID is required'));
    }
    
    // Check if enrollment exists
    $checkSQL = "SELECT * FROM hmo_enrollments WHERE id = ?";
    $checkStmt = $conn->prepare($checkSQL);
    $checkStmt->bind_param('s', $enrollmentId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        $checkStmt->close();
        http_response_code(404);
        die(ResponseHandler::error('HMO enrollment not found'));
    }
    
    $oldEnrollment = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Build update query
    $updates = [];
    $updateValues = [];
    $types = '';
    
    if (isset($input['plan_id'])) {
        $updates[] = 'plan_id = ?';
        $updateValues[] = $input['plan_id'];
        $types .= 'i';
    }
    
    if (isset($input['status'])) {
        $updates[] = 'status = ?';
        $updateValues[] = $input['status'];
        $types .= 's';
    }
    
    if (isset($input['coverage_type'])) {
        $updates[] = 'coverage_type = ?';
        $updateValues[] = $input['coverage_type'];
        $types .= 's';
    }
    
    if (isset($input['premium_amount'])) {
        $updates[] = 'premium_amount = ?';
        $updateValues[] = $input['premium_amount'];
        $types .= 'd';
    }
    
    if (empty($updates)) {
        http_response_code(400);
        die(ResponseHandler::error('No fields to update'));
    }
    
    $updateValues[] = $enrollmentId;
    $types .= 's';
    
    $sql = "UPDATE hmo_enrollments SET " . implode(', ', $updates) . " WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$updateValues);
    
    if ($stmt->execute()) {
        $stmt->close();
        echo ResponseHandler::success($input, 'HMO enrollment updated successfully');
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to update HMO enrollment'));
    }
}

/**
 * Handle DELETE requests
 */
function handleDelete($conn, $enrollmentId, $user) {
    // Check authorization - Admin only
    if ($user['role'] !== ROLE_ADMIN) {
        http_response_code(403);
        die(ResponseHandler::error('Only administrators can delete HMO enrollments'));
    }
    
    if (!$enrollmentId) {
        http_response_code(400);
        die(ResponseHandler::error('HMO enrollment ID is required'));
    }
    
    // Check if enrollment exists
    $checkSQL = "SELECT * FROM hmo_enrollments WHERE id = ?";
    $checkStmt = $conn->prepare($checkSQL);
    $checkStmt->bind_param('s', $enrollmentId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        $checkStmt->close();
        http_response_code(404);
        die(ResponseHandler::error('HMO enrollment not found'));
    }
    
    $enrollment = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    // Delete enrollment
    $sql = "DELETE FROM hmo_enrollments WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $enrollmentId);
    
    if ($stmt->execute()) {
        $stmt->close();
        echo ResponseHandler::success(null, 'HMO enrollment deleted successfully');
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to delete HMO enrollment'));
    }
}

?>
