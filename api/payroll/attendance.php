<?php
/**
 * Attendance & Timekeeping Management Endpoint
 * Integrated with payroll for overtime and shift calculations
 * GET /api/payroll/attendance - List attendance records
 * POST /api/payroll/attendance - Record attendance
 * PUT /api/payroll/attendance/{id} - Update attendance
 * GET /api/payroll/overtime - List overtime records
 * POST /api/payroll/overtime - Record overtime
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
$conn = require __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/PayrollAuditLogger.php';

if (!$conn) {
    http_response_code(500);
    die(ResponseHandler::error('Database connection failed'));
}

$method = $_SERVER['REQUEST_METHOD'];
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts = explode('/', $path);

$action = isset($parts[count($parts) - 2]) ? $parts[count($parts) - 2] : null;
$recordId = isset($parts[count($parts) - 1]) ? $parts[count($parts) - 1] : null;

switch ($method) {
    case 'GET':
        if ($action === 'attendance') {
            handleGetAttendance($conn, $recordId);
        } elseif ($action === 'overtime') {
            handleGetOvertime($conn, $recordId);
        } elseif ($action === 'shifts') {
            handleGetShifts($conn);
        } else {
            http_response_code(404);
            die(ResponseHandler::error('Endpoint not found'));
        }
        break;
    
    case 'POST':
        $user = AuthMiddleware::verifyToken();
        if ($action === 'attendance') {
            handlePostAttendance($conn, $user);
        } elseif ($action === 'overtime') {
            handlePostOvertime($conn, $user);
        } else {
            http_response_code(404);
            die(ResponseHandler::error('Endpoint not found'));
        }
        break;
    
    case 'PUT':
        $user = AuthMiddleware::verifyToken();
        if ($action === 'attendance') {
            handlePutAttendance($conn, $recordId, $user);
        } elseif ($action === 'overtime') {
            handlePutOvertime($conn, $recordId, $user);
        } else {
            http_response_code(404);
            die(ResponseHandler::error('Endpoint not found'));
        }
        break;
    
    default:
        http_response_code(405);
        die(ResponseHandler::error('Method not allowed'));
}

/**
 * Handle GET attendance records
 */
function handleGetAttendance($conn, $recordId) {
    if ($recordId) {
        // Get single record
        $sql = "SELECT 
                    ar.*,
                    e.first_name,
                    e.last_name,
                    e.position,
                    d.name as department_name,
                    st.shift_name
                FROM attendance_records ar
                LEFT JOIN employees e ON ar.employee_id = e.id
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN employee_shift_assignments esa ON e.id = esa.employee_id
                LEFT JOIN shift_templates st ON esa.shift_id = st.id
                WHERE ar.id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('s', $recordId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo ResponseHandler::success($result->fetch_assoc(), 'Attendance record retrieved');
        } else {
            http_response_code(404);
            die(ResponseHandler::error('Attendance record not found'));
        }
        $stmt->close();
    } else {
        // Get paginated records
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $pageSize = isset($_GET['pageSize']) ? min((int)$_GET['pageSize'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
        $offset = ($page - 1) * $pageSize;
        
        // Build filters
        $whereClause = "WHERE 1=1";
        $params = [];
        $types = '';
        
        if (!empty($_GET['employee_id'])) {
            $whereClause .= " AND ar.employee_id = ?";
            $params[] = $_GET['employee_id'];
            $types .= 's';
        }
        
        if (!empty($_GET['date_from'])) {
            $whereClause .= " AND ar.attendance_date >= ?";
            $params[] = $_GET['date_from'];
            $types .= 's';
        }
        
        if (!empty($_GET['date_to'])) {
            $whereClause .= " AND ar.attendance_date <= ?";
            $params[] = $_GET['date_to'];
            $types .= 's';
        }
        
        if (!empty($_GET['status'])) {
            $whereClause .= " AND ar.status = ?";
            $params[] = $_GET['status'];
            $types .= 's';
        }
        
        // Count total
        $countSQL = "SELECT COUNT(*) as total FROM attendance_records ar $whereClause";
        $countStmt = $conn->prepare($countSQL);
        if (!empty($params)) {
            $countStmt->bind_param($types, ...$params);
        }
        $countStmt->execute();
        $countRow = $countStmt->get_result()->fetch_assoc();
        $countStmt->close();
        
        // Get data
        $sql = "SELECT 
                    ar.*,
                    e.first_name,
                    e.last_name,
                    e.position,
                    d.name as department_name,
                    st.shift_name
                FROM attendance_records ar
                LEFT JOIN employees e ON ar.employee_id = e.id
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN employee_shift_assignments esa ON e.id = esa.employee_id AND esa.effective_date <= ar.attendance_date AND (esa.end_date IS NULL OR esa.end_date >= ar.attendance_date)
                LEFT JOIN shift_templates st ON esa.shift_id = st.id
                $whereClause
                ORDER BY ar.attendance_date DESC, ar.time_in DESC
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
        
        $records = [];
        while ($row = $result->fetch_assoc()) {
            $records[] = $row;
        }
        $stmt->close();
        
        echo ResponseHandler::paginated($records, $countRow['total'], $page, $pageSize, 'Attendance records retrieved');
    }
}

/**
 * Handle POST attendance record
 */
function handlePostAttendance($conn, $user) {
    // Check authorization
    $allowedRoles = [ROLE_ADMIN, ROLE_PAYROLL, ROLE_HR_MANAGER];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to record attendance'));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $errors = [];
    
    if (empty($input['employee_id'])) {
        $errors['employee_id'] = 'Employee ID is required';
    }
    
    if (empty($input['attendance_date'])) {
        $errors['attendance_date'] = 'Attendance date is required';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        die(ResponseHandler::error('Validation failed', 400, $errors));
    }
    
    // Check if employee exists
    $empSQL = "SELECT id FROM employees WHERE id = ? AND status = 'active'";
    $empStmt = $conn->prepare($empSQL);
    $empStmt->bind_param('s', $input['employee_id']);
    $empStmt->execute();
    
    if ($empStmt->get_result()->num_rows === 0) {
        $empStmt->close();
        http_response_code(404);
        die(ResponseHandler::error('Employee not found or inactive'));
    }
    $empStmt->close();
    
    // Calculate total hours if time in and out provided
    $totalHours = 0;
    if (!empty($input['time_in']) && !empty($input['time_out'])) {
        $timeIn = new DateTime($input['attendance_date'] . ' ' . $input['time_in']);
        $timeOut = new DateTime($input['attendance_date'] . ' ' . $input['time_out']);
        
        // Handle night shifts (time out next day)
        if ($timeOut < $timeIn) {
            $timeOut->modify('+1 day');
        }
        
        $interval = $timeOut->diff($timeIn);
        $totalHours = $interval->h + ($interval->i / 60);
    }
    
    // Determine if overtime
    $isOvertime = $totalHours > 8 ? true : false;
    $overtimeHours = $isOvertime ? $totalHours - 8 : 0;
    
    // Create record
    $recordId = 'ATT' . date('YmdHis') . rand(1000, 9999);
    $status = $input['status'] ?? 'present';
    $isNightShift = isset($input['is_night_shift']) ? (bool)$input['is_night_shift'] : false;
    $isHoliday = isset($input['is_holiday']) ? (bool)$input['is_holiday'] : false;
    $isSpecialHoliday = isset($input['is_special_holiday']) ? (bool)$input['is_special_holiday'] : false;
    
    $sql = "INSERT INTO attendance_records 
            (id, employee_id, attendance_date, time_in, time_out, total_hours, is_overtime, overtime_hours, 
             is_holiday, is_special_holiday, is_night_shift, status, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sssssdiddddss',
        $recordId,
        $input['employee_id'],
        $input['attendance_date'],
        $input['time_in'] ?? null,
        $input['time_out'] ?? null,
        $totalHours,
        $isOvertime,
        $overtimeHours,
        $isHoliday,
        $isSpecialHoliday,
        $isNightShift,
        $status,
        $input['remarks'] ?? null
    );
    
    if ($stmt->execute()) {
        $logger = new PayrollAuditLogger($conn, $user['id'] ?? 'SYSTEM');
        $logger->logAction('record_attendance', null, null, $input['employee_id'], null, $input, 'Attendance recorded');
        
        $stmt->close();
        http_response_code(201);
        echo ResponseHandler::success([
            'id' => $recordId,
            'employee_id' => $input['employee_id'],
            'attendance_date' => $input['attendance_date'],
            'status' => $status,
            'total_hours' => $totalHours,
            'is_overtime' => $isOvertime
        ], 'Attendance recorded successfully', 201);
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to record attendance'));
    }
}

/**
 * Handle PUT attendance record
 */
function handlePutAttendance($conn, $recordId, $user) {
    $allowedRoles = [ROLE_ADMIN, ROLE_PAYROLL, ROLE_HR_MANAGER];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to update attendance'));
    }
    
    if (!$recordId) {
        http_response_code(400);
        die(ResponseHandler::error('Record ID is required'));
    }
    
    // Get existing record
    $checkSQL = "SELECT * FROM attendance_records WHERE id = ?";
    $checkStmt = $conn->prepare($checkSQL);
    $checkStmt->bind_param('s', $recordId);
    $checkStmt->execute();
    $oldRecord = $checkStmt->get_result()->fetch_assoc();
    $checkStmt->close();
    
    if (!$oldRecord) {
        http_response_code(404);
        die(ResponseHandler::error('Attendance record not found'));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Update record
    $updates = [];
    $params = [];
    $types = '';
    
    if (isset($input['time_in'])) {
        $updates[] = 'time_in = ?';
        $params[] = $input['time_in'];
        $types .= 's';
    }
    
    if (isset($input['time_out'])) {
        $updates[] = 'time_out = ?';
        $params[] = $input['time_out'];
        $types .= 's';
    }
    
    if (isset($input['status'])) {
        $updates[] = 'status = ?';
        $params[] = $input['status'];
        $types .= 's';
    }
    
    if (isset($input['remarks'])) {
        $updates[] = 'remarks = ?';
        $params[] = $input['remarks'];
        $types .= 's';
    }
    
    if (empty($updates)) {
        http_response_code(400);
        die(ResponseHandler::error('No fields to update'));
    }
    
    $updates[] = 'updated_at = NOW()';
    $params[] = $recordId;
    $types .= 's';
    
    $sql = "UPDATE attendance_records SET " . implode(', ', $updates) . " WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        $logger = new PayrollAuditLogger($conn, $user['id'] ?? 'SYSTEM');
        $logger->logAction('update_attendance', null, null, $oldRecord['employee_id'], $oldRecord, $input, 'Attendance updated');
        
        $stmt->close();
        echo ResponseHandler::success($input, 'Attendance record updated successfully');
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to update attendance record'));
    }
}

/**
 * Handle GET overtime records
 */
function handleGetOvertime($conn, $recordId) {
    if ($recordId) {
        $sql = "SELECT 
                    ot.*,
                    e.first_name,
                    e.last_name,
                    e.position
                FROM overtime_records ot
                LEFT JOIN employees e ON ot.employee_id = e.id
                WHERE ot.id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('s', $recordId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo ResponseHandler::success($result->fetch_assoc(), 'Overtime record retrieved');
        } else {
            http_response_code(404);
            die(ResponseHandler::error('Overtime record not found'));
        }
        $stmt->close();
    } else {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $pageSize = isset($_GET['pageSize']) ? min((int)$_GET['pageSize'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
        $offset = ($page - 1) * $pageSize;
        
        $whereClause = "WHERE 1=1";
        $params = [];
        $types = '';
        
        if (!empty($_GET['status'])) {
            $whereClause .= " AND ot.status = ?";
            $params[] = $_GET['status'];
            $types .= 's';
        }
        
        if (!empty($_GET['employee_id'])) {
            $whereClause .= " AND ot.employee_id = ?";
            $params[] = $_GET['employee_id'];
            $types .= 's';
        }
        
        $countSQL = "SELECT COUNT(*) as total FROM overtime_records ot $whereClause";
        $countStmt = $conn->prepare($countSQL);
        if (!empty($params)) {
            $countStmt->bind_param($types, ...$params);
        }
        $countStmt->execute();
        $countRow = $countStmt->get_result()->fetch_assoc();
        $countStmt->close();
        
        $sql = "SELECT 
                    ot.*,
                    e.first_name,
                    e.last_name,
                    e.position
                FROM overtime_records ot
                LEFT JOIN employees e ON ot.employee_id = e.id
                $whereClause
                ORDER BY ot.overtime_date DESC
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
        
        $records = [];
        while ($row = $result->fetch_assoc()) {
            $records[] = $row;
        }
        $stmt->close();
        
        echo ResponseHandler::paginated($records, $countRow['total'], $page, $pageSize, 'Overtime records retrieved');
    }
}

/**
 * Handle POST overtime record
 */
function handlePostOvertime($conn, $user) {
    $allowedRoles = [ROLE_ADMIN, ROLE_PAYROLL, ROLE_HR_MANAGER];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to record overtime'));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $errors = [];
    
    if (empty($input['employee_id'])) {
        $errors['employee_id'] = 'Employee ID is required';
    }
    
    if (empty($input['overtime_date']) || !isset($input['overtime_hours']) || $input['overtime_hours'] <= 0) {
        $errors['overtime_hours'] = 'Overtime date and hours are required';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        die(ResponseHandler::error('Validation failed', 400, $errors));
    }
    
    // Get hourly rate for computation
    $empSQL = "SELECT base_salary FROM employees WHERE id = ?";
    $empStmt = $conn->prepare($empSQL);
    $empStmt->bind_param('s', $input['employee_id']);
    $empStmt->execute();
    $empResult = $empStmt->get_result();
    
    if ($empResult->num_rows === 0) {
        $empStmt->close();
        http_response_code(404);
        die(ResponseHandler::error('Employee not found'));
    }
    
    $emp = $empResult->fetch_assoc();
    $empStmt->close();
    
    // Compute overtime amount
    $hourlyRate = $emp['base_salary'] / 22 / 8;
    $rate = $input['overtime_rate'] ?? 'regular';
    $rateMultiplier = 1.25; // Default regular rate
    
    if ($rate === 'holiday') {
        $rateMultiplier = 1.69;
    } elseif ($rate === 'special_holiday') {
        $rateMultiplier = 1.95;
    }
    
    $computedAmount = $input['overtime_hours'] * $hourlyRate * $rateMultiplier;
    
    $recordId = 'OT' . date('YmdHis') . rand(1000, 9999);
    $status = 'pending';
    
    $sql = "INSERT INTO overtime_records 
            (id, employee_id, overtime_date, overtime_hours, overtime_rate, computed_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ssddsss', $recordId, $input['employee_id'], $input['overtime_date'], 
                       $input['overtime_hours'], $rate, $computedAmount, $status);
    
    if ($stmt->execute()) {
        $logger = new PayrollAuditLogger($conn, $user['id'] ?? 'SYSTEM');
        $logger->logAction('record_overtime', null, null, $input['employee_id'], null, $input, 'Overtime recorded');
        
        $stmt->close();
        http_response_code(201);
        echo ResponseHandler::success([
            'id' => $recordId,
            'employee_id' => $input['employee_id'],
            'overtime_hours' => $input['overtime_hours'],
            'computed_amount' => round($computedAmount, 2),
            'status' => $status
        ], 'Overtime recorded successfully', 201);
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to record overtime'));
    }
}

/**
 * Handle PUT overtime record (for approval)
 */
function handlePutOvertime($conn, $recordId, $user) {
    $allowedRoles = [ROLE_ADMIN, ROLE_PAYROLL];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        die(ResponseHandler::error('You do not have permission to approve overtime'));
    }
    
    if (!$recordId) {
        http_response_code(400);
        die(ResponseHandler::error('Record ID is required'));
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $status = $input['status'] ?? 'pending';
    $approvedDate = date('Y-m-d H:i:s');
    
    $sql = "UPDATE overtime_records SET status = ?, approved_by = ?, approved_date = ?, updated_at = NOW() WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ssss', $status, $user['id'], $approvedDate, $recordId);
    
    if ($stmt->execute()) {
        $stmt->close();
        echo ResponseHandler::success(['status' => $status], 'Overtime record updated');
    } else {
        $stmt->close();
        http_response_code(500);
        die(ResponseHandler::error('Failed to update overtime record'));
    }
}

/**
 * Handle GET shifts
 */
function handleGetShifts($conn) {
    $sql = "SELECT * FROM shift_templates WHERE status = 'active' ORDER BY start_time";
    
    $result = $conn->query($sql);
    
    $shifts = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $shifts[] = $row;
        }
    }
    
    echo ResponseHandler::success($shifts, 'Shifts retrieved successfully');
}

?>
