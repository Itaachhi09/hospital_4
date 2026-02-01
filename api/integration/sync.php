<?php
/**
 * Integration Sync Endpoint
 * Handles data synchronization between HR 1, HR 2, and HR 3 systems
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PARSED_PATH'] ?? '';
$systemId = $_SERVER['SYSTEM_ID'] ?? 'HR1';

// Verify authentication
$user = AuthMiddleware::verifyToken();

// Check if user has integration permissions
if (!in_array($user['role'], [ROLE_ADMIN, ROLE_HR_MANAGER])) {
    http_response_code(403);
    die(ResponseHandler::error('You do not have permission to access integration endpoints'));
}

$conn = require __DIR__ . '/../config/database.php';

// Route based on path
if (strpos($path, 'employees') !== false) {
    handleEmployeeSync($conn, $method, $systemId);
} elseif (strpos($path, 'payroll') !== false) {
    handlePayrollSync($conn, $method, $systemId);
} else {
    handleGeneralSync($conn, $method, $systemId);
}

/**
 * Handle employee data synchronization
 */
function handleEmployeeSync($conn, $method, $systemId) {
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['employees']) || !is_array($input['employees'])) {
            http_response_code(400);
            die(ResponseHandler::error('Invalid employee data format'));
        }
        
        $synced = 0;
        $errors = [];
        
        foreach ($input['employees'] as $emp) {
            try {
                // Check if employee exists
                $checkSql = "SELECT id FROM employees WHERE id = ?";
                $checkStmt = $conn->prepare($checkSql);
                $checkStmt->bind_param('s', $emp['id']);
                $checkStmt->execute();
                $exists = $checkStmt->get_result()->num_rows > 0;
                $checkStmt->close();
                
                if ($exists) {
                    // Update existing employee
                    $updateSql = "UPDATE employees SET 
                        first_name = ?, last_name = ?, email = ?, 
                        department_id = ?, position_id = ?, status = ?,
                        updated_at = NOW()
                        WHERE id = ?";
                    $updateStmt = $conn->prepare($updateSql);
                    $updateStmt->bind_param('sssssss',
                        $emp['first_name'],
                        $emp['last_name'],
                        $emp['email'],
                        $emp['department_id'] ?? null,
                        $emp['position_id'] ?? null,
                        $emp['status'] ?? 'active',
                        $emp['id']
                    );
                    $updateStmt->execute();
                    $updateStmt->close();
                } else {
                    // Insert new employee
                    $insertSql = "INSERT INTO employees 
                        (id, employee_code, first_name, last_name, email, 
                         department_id, position_id, status, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
                    $insertStmt = $conn->prepare($insertSql);
                    $employeeCode = 'E' . str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT);
                    $insertStmt->bind_param('ssssssss',
                        $emp['id'],
                        $employeeCode,
                        $emp['first_name'],
                        $emp['last_name'],
                        $emp['email'],
                        $emp['department_id'] ?? null,
                        $emp['position_id'] ?? null,
                        $emp['status'] ?? 'active'
                    );
                    $insertStmt->execute();
                    $insertStmt->close();
                }
                
                $synced++;
            } catch (Exception $e) {
                $errors[] = "Employee {$emp['id']}: " . $e->getMessage();
            }
        }
        
        echo ResponseHandler::success([
            'system_id' => $systemId,
            'synced_count' => $synced,
            'total_count' => count($input['employees']),
            'errors' => $errors
        ], 'Employee synchronization completed');
        
    } elseif ($method === 'GET') {
        // Get employees for sync
        $sql = "SELECT id, employee_code, first_name, last_name, email, 
                       department_id, position_id, status, updated_at
                FROM employees 
                WHERE status = 'active'
                ORDER BY updated_at DESC
                LIMIT 100";
        
        $result = $conn->query($sql);
        $employees = [];
        
        while ($row = $result->fetch_assoc()) {
            $employees[] = $row;
        }
        
        echo ResponseHandler::success([
            'system_id' => $systemId,
            'employees' => $employees,
            'count' => count($employees)
        ], 'Employee data retrieved for synchronization');
    }
}

/**
 * Handle payroll data synchronization
 */
function handlePayrollSync($conn, $method, $systemId) {
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['payroll_runs']) || !is_array($input['payroll_runs'])) {
            http_response_code(400);
            die(ResponseHandler::error('Invalid payroll data format'));
        }
        
        $synced = 0;
        $errors = [];
        
        foreach ($input['payroll_runs'] as $payroll) {
            try {
                // Sync payroll run
                $checkSql = "SELECT id FROM payroll_runs WHERE id = ?";
                $checkStmt = $conn->prepare($checkSql);
                $checkStmt->bind_param('s', $payroll['id']);
                $checkStmt->execute();
                $exists = $checkStmt->get_result()->num_rows > 0;
                $checkStmt->close();
                
                if (!$exists) {
                    $insertSql = "INSERT INTO payroll_runs 
                        (id, payroll_period, total_employees, total_gross_salary, 
                         total_deductions, total_net_salary, approval_status, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
                    $insertStmt = $conn->prepare($insertSql);
                    $insertStmt->bind_param('ssiddds',
                        $payroll['id'],
                        $payroll['period'],
                        $payroll['total_employees'] ?? 0,
                        $payroll['total_gross_salary'] ?? 0,
                        $payroll['total_deductions'] ?? 0,
                        $payroll['total_net_salary'] ?? 0,
                        $payroll['status'] ?? 'draft'
                    );
                    $insertStmt->execute();
                    $insertStmt->close();
                    $synced++;
                }
            } catch (Exception $e) {
                $errors[] = "Payroll {$payroll['id']}: " . $e->getMessage();
            }
        }
        
        echo ResponseHandler::success([
            'system_id' => $systemId,
            'synced_count' => $synced,
            'total_count' => count($input['payroll_runs']),
            'errors' => $errors
        ], 'Payroll synchronization completed');
        
    } elseif ($method === 'GET') {
        // Get payroll data for sync
        $period = $_GET['period'] ?? date('Y-m');
        
        $sql = "SELECT id, payroll_period, total_employees, total_gross_salary, 
                       total_deductions, total_net_salary, approval_status, updated_at
                FROM payroll_runs 
                WHERE payroll_period = ?
                ORDER BY updated_at DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('s', $period);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $payrolls = [];
        while ($row = $result->fetch_assoc()) {
            $payrolls[] = $row;
        }
        $stmt->close();
        
        echo ResponseHandler::success([
            'system_id' => $systemId,
            'period' => $period,
            'payroll_runs' => $payrolls,
            'count' => count($payrolls)
        ], 'Payroll data retrieved for synchronization');
    }
}

/**
 * Handle general synchronization
 */
function handleGeneralSync($conn, $method, $systemId) {
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        echo ResponseHandler::success([
            'system_id' => $systemId,
            'sync_type' => $input['sync_type'] ?? 'general',
            'timestamp' => date('Y-m-d H:i:s')
        ], 'Synchronization request received');
    } else {
        echo ResponseHandler::success([
            'system_id' => $systemId,
            'status' => 'ready',
            'supported_sync_types' => ['employees', 'payroll', 'compensation', 'hmo']
        ], 'Integration endpoint ready');
    }
}
?>
