<?php
/**
 * Salary Management Endpoints - Database Connected
 * Integrated with Philippine hospital payroll standards
 * GET /api/salaries - List employee salaries
 * GET /api/salaries/{id} - Get employee salary
 * POST /api/salaries - Create salary record
 * PUT /api/salaries/{id} - Update salary
 * DELETE /api/salaries/{id} - Delete salary
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
require_once __DIR__ . '/PayrollComputationEngine.php';
require_once __DIR__ . '/PayrollAuditLogger.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$parts = explode('/', $path);
$salaryId = isset($parts[count($parts) - 1]) && !is_numeric($parts[count($parts) - 1]) ? null : $parts[count($parts) - 1];

switch ($method) {
    case 'GET':
        handleGet($conn, $salaryId);
        break;
    
    case 'POST':
        $user = AuthMiddleware::verifyToken();
        handlePost($conn, $user);
        break;
    
    case 'PUT':
        $user = AuthMiddleware::verifyToken();
        handlePut($conn, $salaryId, $user);
        break;
    
    case 'DELETE':
        $user = AuthMiddleware::verifyToken();
        handleDelete($conn, $salaryId, $user);
        break;
    
    default:
        http_response_code(405);
        die(ResponseHandler::error('Method not allowed'));
}

/**
 * Handle GET requests
 */
function handleGet($conn, $salaryId) {
    if ($salaryId) {
        // Get single salary record
        $sql = "SELECT 
                    s.*,
                    e.first_name,
                    e.last_name,
                    e.position,
                    d.name as department_name,
                    sg.grade_name,
                    sg.grade_level
                FROM salaries s
                LEFT JOIN employees e ON s.employee_id = e.id
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN salary_grades sg ON FIND_IN_SET(sg.id, CONCAT(e.id)) > 0
                WHERE s.id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('s', $salaryId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $salary = $result->fetch_assoc();
            $stmt->close();
            echo ResponseHandler::success($salary, 'Salary retrieved successfully');
        } else {
            $stmt->close();
            http_response_code(404);
            die(ResponseHandler::error('Salary record not found'));
        }
    } else {
        // Get all salaries with filters
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $pageSize = isset($_GET['pageSize']) ? min((int)$_GET['pageSize'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
        $offset = ($page - 1) * $pageSize;

        // Some deployments may not have the standalone `salaries` table yet.
        // If it does not exist, return an empty, but valid, paginated response
        // so the frontend does not break with HTML error pages.
        $tableCheck = $conn->query("SHOW TABLES LIKE 'salaries'");
        if (!$tableCheck || $tableCheck->num_rows === 0) {
            echo ResponseHandler::paginated([], 0, $page, $pageSize, 'Salaries table not found. Returning empty list.');
            return;
        }
        
        // Build filters
        $whereClause = "WHERE 1=1";
        $params = [];
        $types = '';
        
        if (!empty($_GET['employee_id'])) {
            $whereClause .= " AND s.employee_id = ?";
            $params[] = $_GET['employee_id'];
            $types .= 's';
        }
        
        if (!empty($_GET['status'])) {
            $whereClause .= " AND s.status = ?";
            $params[] = $_GET['status'];
            $types .= 's';
        }
        
        if (!empty($_GET['department_id'])) {
            $whereClause .= " AND e.department_id = ?";
            $params[] = $_GET['department_id'];
            $types .= 's';
        }
        
        if (!empty($_GET['search'])) {
            $searchTerm = '%' . $_GET['search'] . '%';
            $whereClause .= " AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ?)";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $types .= 'sss';
        }
        
        // Count total
        $countSQL = "SELECT COUNT(*) as total FROM salaries s
                    LEFT JOIN employees e ON s.employee_id = e.id
                    $whereClause";
        
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
                    s.*,
                    e.first_name,
                    e.last_name,
                    e.position,
                    e.employment_type,
                    d.name as department_name,
                    sg.grade_name,
                    sg.grade_level
                FROM salaries s
                LEFT JOIN employees e ON s.employee_id = e.id
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN salary_grades sg ON sg.min_salary <= s.base_salary AND s.base_salary <= sg.max_salary
                $whereClause
                ORDER BY s.effective_date DESC, e.last_name ASC
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
        
        $salaries = [];
        while ($row = $result->fetch_assoc()) {
            // Calculate rates
            $dailyRate = $row['base_salary'] / 22;
            $hourlyRate = $dailyRate / 8;
            
            $row['daily_rate'] = round($dailyRate, 2);
            $row['hourly_rate'] = round($hourlyRate, 2);
            $salaries[] = $row;
        }
        
        $stmt->close();
        
        echo ResponseHandler::paginated($salaries, $countRow['total'], $page, $pageSize, 'Salaries retrieved successfully');
    }
}

/**
 * Handle POST requests - Create salary
 */
function handlePost($conn, $user) {
    // Check authorization
    $allowedRoles = [ROLE_ADMIN, ROLE_PAYROLL, ROLE_HR_MANAGER];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to create salary records'));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    $errors = [];
    
    if (empty($input['employee_id'])) {
        $errors['employee_id'] = 'Employee ID is required';
    }
    
    if (!isset($input['base_salary']) || $input['base_salary'] <= 0) {
        $errors['base_salary'] = 'Base salary must be greater than 0';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        die(ResponseHandler::error('Validation failed', 400, $errors));
    }
    
    // Check if employee exists
    $empSQL = "SELECT id, first_name, last_name FROM employees WHERE id = ?";
    $empStmt = $conn->prepare($empSQL);
    $empStmt->bind_param('s', $input['employee_id']);
    $empStmt->execute();
    $empResult = $empStmt->get_result();
    
    if ($empResult->num_rows === 0) {
        $empStmt->close();
        http_response_code(404);
        die(ResponseHandler::error('Employee not found'));
    }
    
    $employee = $empResult->fetch_assoc();
    $empStmt->close();
    
    // Calculate salary components
    $baseSalary = (float)$input['base_salary'];
    $allowances = (float)($input['allowances'] ?? 0);
    $deductions = (float)($input['deductions'] ?? 0);
    $netSalary = $baseSalary + $allowances - $deductions;
    
    // Create salary record
    $salaryId = 'SAL' . date('YmdHis') . rand(1000, 9999);
    $effectiveDate = $input['effective_date'] ?? date('Y-m-d');
    $status = 'active';
    
    $sql = "INSERT INTO salaries (id, employee_id, base_salary, allowances, deductions, net_salary, effective_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ssdddss', $salaryId, $input['employee_id'], $baseSalary, $allowances, $deductions, $netSalary, $effectiveDate, $status);
    
    if ($stmt->execute()) {
        // Log in audit
        $logger = new PayrollAuditLogger($conn, $user['id'] ?? 'SYSTEM');
        $logger->logAction('create_salary', null, null, $input['employee_id'], null, $input, 'Salary record created');
        
        $newSalary = [
            'id' => $salaryId,
            'employee_id' => $input['employee_id'],
            'employee_name' => $employee['first_name'] . ' ' . $employee['last_name'],
            'base_salary' => $baseSalary,
            'allowances' => $allowances,
            'deductions' => $deductions,
            'net_salary' => $netSalary,
            'effective_date' => $effectiveDate,
            'status' => 'active'
        ];
        
        $stmt->close();
        http_response_code(201);
        echo ResponseHandler::success($newSalary, 'Salary record created successfully', 201);
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to create salary record'));
    }
}

/**
 * Handle PUT requests - Update salary
 */
function handlePut($conn, $salaryId, $user) {
    // Check authorization
    $allowedRoles = [ROLE_ADMIN, ROLE_PAYROLL, ROLE_HR_MANAGER];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to update salary records'));
    }
    
    if (!$salaryId) {
        http_response_code(400);
        die(ResponseHandler::error('Salary ID is required'));
    }
    
    // Check if salary exists
    $checkSQL = "SELECT * FROM salaries WHERE id = ?";
    $checkStmt = $conn->prepare($checkSQL);
    $checkStmt->bind_param('s', $salaryId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        $checkStmt->close();
        http_response_code(404);
        die(ResponseHandler::error('Salary record not found'));
    }
    
    $oldSalary = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Recalculate net salary if components change
    $baseSalary = $input['base_salary'] ?? $oldSalary['base_salary'];
    $allowances = isset($input['allowances']) ? $input['allowances'] : $oldSalary['allowances'];
    $deductions = isset($input['deductions']) ? $input['deductions'] : $oldSalary['deductions'];
    $netSalary = $baseSalary + $allowances - $deductions;
    
    // Build update query
    $updates = [];
    $updateValues = [];
    $types = '';
    
    if (isset($input['base_salary'])) {
        $updates[] = 'base_salary = ?';
        $updateValues[] = $baseSalary;
        $types .= 'd';
    }
    
    if (isset($input['allowances'])) {
        $updates[] = 'allowances = ?';
        $updateValues[] = $allowances;
        $types .= 'd';
    }
    
    if (isset($input['deductions'])) {
        $updates[] = 'deductions = ?';
        $updateValues[] = $deductions;
        $types .= 'd';
    }
    
    if (isset($input['effective_date'])) {
        $updates[] = 'effective_date = ?';
        $updateValues[] = $input['effective_date'];
        $types .= 's';
    }
    
    if (isset($input['status'])) {
        $updates[] = 'status = ?';
        $updateValues[] = $input['status'];
        $types .= 's';
    }
    
    // Always update net_salary and updated_at
    $updates[] = 'net_salary = ?';
    $updateValues[] = $netSalary;
    $types .= 'd';
    
    $updates[] = 'updated_at = NOW()';
    $updateValues[] = $salaryId;
    $types .= 's';
    
    $sql = "UPDATE salaries SET " . implode(', ', $updates) . " WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$updateValues);
    
    if ($stmt->execute()) {
        // Log update in audit
        $logger = new PayrollAuditLogger($conn, $user['id'] ?? 'SYSTEM');
        $logger->logAction('update_salary', null, null, $oldSalary['employee_id'], $oldSalary, $input, 'Salary record updated');
        
        $stmt->close();
        echo ResponseHandler::success($input, 'Salary record updated successfully');
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to update salary record'));
    }
}

/**
 * Handle DELETE requests
 */
function handleDelete($conn, $salaryId, $user) {
    // Check authorization - Admin and HR Manager only
    if (!in_array($user['role'], [ROLE_ADMIN, ROLE_HR_MANAGER])) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to delete salary records'));
    }
    
    if (!$salaryId) {
        http_response_code(400);
        die(ResponseHandler::error('Salary ID is required'));
    }
    
    // Check if salary exists
    $checkSQL = "SELECT * FROM salaries WHERE id = ?";
    $checkStmt = $conn->prepare($checkSQL);
    $checkStmt->bind_param('s', $salaryId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        $checkStmt->close();
        http_response_code(404);
        die(ResponseHandler::error('Salary record not found'));
    }
    
    $salary = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    // Delete salary
    $sql = "DELETE FROM salaries WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $salaryId);
    
    if ($stmt->execute()) {
        // Log deletion in audit
        $logger = new PayrollAuditLogger($conn, $user['id'] ?? 'SYSTEM');
        $logger->logAction('delete_salary', null, null, $salary['employee_id'], $salary, null, 'Salary record deleted');
        
        $stmt->close();
        echo ResponseHandler::success(null, 'Salary record deleted successfully');
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to delete salary record'));
    }
}

