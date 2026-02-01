<?php
/**
 * Employee Management Endpoints
 * CRUD operations for employee records
 */

// Suppress error display, we'll handle it ourselves
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../config/constants.php';
    require_once __DIR__ . '/../utils/ResponseHandler.php';
    require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
    
    // Get database connection
    $conn = require __DIR__ . '/../config/database.php';
    
    if (!$conn || $conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    $id = isset($_GET['id']) ? $_GET['id'] : null;

    switch ($method) {
        case 'GET':
            if ($id) {
                getEmployee($conn, $id);
            } else {
                listEmployees($conn);
            }
            break;
        case 'POST':
            createEmployee($conn);
            break;
        case 'PUT':
        case 'PATCH':
            if ($id) {
                updateEmployee($conn, $id);
            } else {
                http_response_code(400);
                die(ResponseHandler::error('Employee ID is required'));
            }
            break;
        case 'DELETE':
            if ($id) {
                deleteEmployee($conn, $id);
            } else {
                http_response_code(400);
                die(ResponseHandler::error('Employee ID is required'));
            }
            break;
        default:
            http_response_code(405);
            die(ResponseHandler::error('Method not allowed'));
    }
} catch (Exception $e) {
    http_response_code(500);
    die(ResponseHandler::error('Server error: ' . $e->getMessage()));
}

function listEmployees($conn) {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $pageSize = isset($_GET['pageSize']) ? min(MAX_PAGE_SIZE, max(1, intval($_GET['pageSize']))) : DEFAULT_PAGE_SIZE;
    $offset = ($page - 1) * $pageSize;
    
    // Filters
    $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
    $status = isset($_GET['status']) ? $conn->real_escape_string($_GET['status']) : '';
    $department = isset($_GET['department_id']) ? $conn->real_escape_string($_GET['department_id']) : '';
    $employment_type = isset($_GET['employment_type']) ? $conn->real_escape_string($_GET['employment_type']) : '';
    
    // Build WHERE clause
    $where = ['1=1'];
    $params = [];
    $types = '';
    
    if (!empty($search)) {
        $where[] = "(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_code LIKE ? OR e.email LIKE ?)";
        $searchParam = "%{$search}%";
        $params = array_merge($params, [$searchParam, $searchParam, $searchParam, $searchParam]);
        $types .= 'ssss';
    }
    
    if (!empty($status)) {
        $where[] = "e.status = ?";
        $params[] = $status;
        $types .= 's';
    }
    
    if (!empty($department)) {
        $where[] = "e.department_id = ?";
        $params[] = $department;
        $types .= 's';
    }
    
    if (!empty($employment_type)) {
        $where[] = "e.employment_type = ?";
        $params[] = $employment_type;
        $types .= 's';
    }
    
    $whereClause = implode(' AND ', $where);
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM employees e WHERE {$whereClause}";
    $countStmt = $conn->prepare($countSql);
    if ($countStmt === false) {
        http_response_code(400);
        die(ResponseHandler::error('Prepare failed for count query: ' . $conn->error));
    }
    
    if (!empty($types)) {
        if (!$countStmt->bind_param($types, ...$params)) {
            http_response_code(400);
            die(ResponseHandler::error('Bind failed for count: ' . $countStmt->error));
        }
    }
    
    if (!$countStmt->execute()) {
        http_response_code(400);
        die(ResponseHandler::error('Count query execute failed: ' . $countStmt->error));
    }
    
    $countResult = $countStmt->get_result();
    $total = $countResult->fetch_assoc()['total'];
    $countStmt->close();
    
    // Get employees with joins
    $sql = "SELECT 
                e.*,
                d.name as department_name,
                u.name as user_name,
                CONCAT(m.first_name, ' ', m.last_name) as manager_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON e.user_id = u.id
            LEFT JOIN employees m ON e.manager_id = m.id
            WHERE {$whereClause}
            ORDER BY e.created_at DESC
            LIMIT ? OFFSET ?";
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(400);
        die(ResponseHandler::error('Prepare failed for main query: ' . $conn->error));
    }
    
    $params[] = $pageSize;
    $params[] = $offset;
    $types .= 'ii';
    
    if (!$stmt->bind_param($types, ...$params)) {
        http_response_code(400);
        die(ResponseHandler::error('Bind failed: ' . $stmt->error));
    }
    
    if (!$stmt->execute()) {
        http_response_code(400);
        die(ResponseHandler::error('Execute failed: ' . $stmt->error));
    }
    
    $result = $stmt->get_result();
    
    $employees = [];
    while ($row = $result->fetch_assoc()) {
        $employees[] = $row;
    }
    $stmt->close();
    
    echo ResponseHandler::paginated($employees, $total, $page, $pageSize, 'Employees retrieved successfully');
}

function getEmployee($conn, $id) {
    $sql = "SELECT 
                e.*,
                d.name as department_name,
                d.id as department_id,
                u.name as user_name,
                CONCAT(m.first_name, ' ', m.last_name) as manager_name,
                m.id as manager_id
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN users u ON e.user_id = u.id
            LEFT JOIN employees m ON e.manager_id = m.id
            WHERE e.id = ?";
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        http_response_code(400);
        die(ResponseHandler::error('Prepare failed: ' . $conn->error));
    }
    if (!$stmt->bind_param('s', $id)) {
        http_response_code(400);
        die(ResponseHandler::error('Bind failed: ' . $stmt->error));
    }
    if (!$stmt->execute()) {
        http_response_code(400);
        die(ResponseHandler::error('Execute failed: ' . $stmt->error));
    }
    $result = $stmt->get_result();
    
    if ($employee = $result->fetch_assoc()) {
        echo ResponseHandler::success($employee, 'Employee retrieved successfully');
    } else {
        http_response_code(404);
        die(ResponseHandler::error('Employee not found'));
    }
    $stmt->close();
}

function createEmployee($conn) {
    $user = AuthMiddleware::verifyToken();
    if (!in_array($user['role'], [ROLE_ADMIN, ROLE_HR_MANAGER])) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to create employees'));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validation
    $errors = [];
    if (empty($input['first_name'])) $errors[] = 'First name is required';
    if (empty($input['last_name'])) $errors[] = 'Last name is required';
    if (empty($input['email'])) $errors[] = 'Email is required';
    if (empty($input['hire_date'])) $errors[] = 'Hire date is required';
    if (empty($input['department_id'])) $errors[] = 'Department is required';
    
    if (!empty($errors)) {
        http_response_code(400);
        die(ResponseHandler::error('Validation failed', 400, $errors));
    }
    
    // Generate employee ID and code
    $employeeId = 'EMP' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);
    $employeeCode = 'E' . str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT);
    
    // Check if IDs already exist
    while (true) {
        $check = $conn->prepare("SELECT id FROM employees WHERE id = ? OR employee_code = ?");
        $check->bind_param('ss', $employeeId, $employeeCode);
        $check->execute();
        if ($check->get_result()->num_rows == 0) break;
        $employeeId = 'EMP' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);
        $employeeCode = 'E' . str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT);
        $check->close();
    }
    
    // Create user account first (simplified - in production, create proper user)
    $userId = 'USR' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);
    $passwordHash = password_hash('TempPassword123!', PASSWORD_BCRYPT);
    $userName = trim(($input['first_name'] ?? '') . ' ' . ($input['last_name'] ?? ''));
    
    $userSql = "INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)";
    $userStmt = $conn->prepare($userSql);
    $role = ROLE_EMPLOYEE;
    $status = 'active';
    $userStmt->bind_param('ssssss', $userId, $userName, $input['email'], $passwordHash, $role, $status);
    $userStmt->execute();
    $userStmt->close();
    
    // Insert employee
    $sql = "INSERT INTO employees (
        id, user_id, employee_code, first_name, last_name, middle_name,
        email, phone, date_of_birth, gender, civil_status, nationality,
        address, emergency_contact_name, emergency_contact_relationship,
        emergency_contact_phone, tin, philhealth_id, sss_id, pagibig_id,
        position_id, department_id, hire_date, employment_type,
        salary_grade_id, manager_id, base_salary, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $status = $input['status'] ?? 'active';
    $stmt->bind_param('sssssssssssssssssssssssssssss',
        $employeeId,
        $userId,
        $employeeCode,
        $input['first_name'],
        $input['last_name'],
        $input['middle_name'] ?? null,
        $input['email'],
        $input['phone'] ?? null,
        $input['date_of_birth'] ?? null,
        $input['gender'] ?? null,
        $input['civil_status'] ?? null,
        $input['nationality'] ?? 'Filipino',
        $input['address'] ?? null,
        $input['emergency_contact_name'] ?? null,
        $input['emergency_contact_relationship'] ?? null,
        $input['emergency_contact_phone'] ?? null,
        $input['tin'] ?? null,
        $input['philhealth_id'] ?? null,
        $input['sss_id'] ?? null,
        $input['pagibig_id'] ?? null,
        $input['position_id'] ?? null,
        $input['department_id'],
        $input['hire_date'],
        $input['employment_type'] ?? 'regular',
        $input['salary_grade_id'] ?? null,
        $input['manager_id'] ?? null,
        $input['base_salary'] ?? null,
        $status
    );
    
    if ($stmt->execute()) {
        echo ResponseHandler::success(['id' => $employeeId], 'Employee created successfully', 201);
    } else {
        http_response_code(500);
        die(ResponseHandler::error('Failed to create employee: ' . $conn->error));
    }
    $stmt->close();
}

function updateEmployee($conn, $id) {
    $user = AuthMiddleware::verifyToken();
    if (!in_array($user['role'], [ROLE_ADMIN, ROLE_HR_MANAGER])) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to update employees'));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Build update query dynamically
    $fields = [];
    $params = [];
    $types = '';
    
    $allowedFields = [
        'first_name', 'last_name', 'middle_name', 'email', 'phone',
        'date_of_birth', 'gender', 'civil_status', 'nationality', 'address',
        'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
        'tin', 'philhealth_id', 'sss_id', 'pagibig_id',
        'position_id', 'department_id', 'hire_date', 'employment_type',
        'salary_grade_id', 'manager_id', 'base_salary', 'status'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $fields[] = "{$field} = ?";
            $params[] = $input[$field];
            $types .= 's';
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        die(ResponseHandler::error('No fields to update'));
    }
    
    $sql = "UPDATE employees SET " . implode(', ', $fields) . " WHERE id = ?";
    $params[] = $id;
    $types .= 's';
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        echo ResponseHandler::success(['id' => $id], 'Employee updated successfully');
    } else {
        http_response_code(500);
        die(ResponseHandler::error('Failed to update employee: ' . $conn->error));
    }
    $stmt->close();
}

function deleteEmployee($conn, $id) {
    $user = AuthMiddleware::verifyToken();
    if (!in_array($user['role'], [ROLE_ADMIN, ROLE_HR_MANAGER])) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to delete employees'));
    }
    
    // Soft delete - update status to inactive
    $sql = "UPDATE employees SET status = 'inactive' WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $id);
    
    if ($stmt->execute()) {
        echo ResponseHandler::success(['id' => $id], 'Employee deleted successfully');
    } else {
        http_response_code(500);
        die(ResponseHandler::error('Failed to delete employee: ' . $conn->error));
    }
    $stmt->close();
}
?>
