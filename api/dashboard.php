<?php
/**
 * Dashboard API Endpoint
 * Returns dashboard statistics and metrics based on user role
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Log all errors to file
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../error_log.txt');

// Set up error handler to catch all errors
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    $errorMsg = "PHP Error [$errno]: $errstr in $errfile:$errline";
    error_log($errorMsg);
    // Return false to let PHP handle it normally
    return false;
});

// More comprehensive exception handler
set_exception_handler(function($exception) {
    $errorMsg = "Exception: " . $exception->getMessage() . " in " . $exception->getFile() . ":" . $exception->getLine() . "\n" . $exception->getTraceAsString();
    error_log($errorMsg);
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $exception->getMessage(),
        'debug' => APP_ENV === 'development' ? $errorMsg : null
    ]);
    exit;
});

// Register handler for fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null) {
        $errorMsg = "Fatal Error [" . $error['type'] . "]: " . $error['message'] . " in " . $error['file'] . ":" . $error['line'];
        error_log($errorMsg);
        // Only send response if headers haven't been sent yet
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'error' => 'Server fatal error',
                'message' => $error['message']
            ]);
        }
    }
});

try {
    $config_file = __DIR__ . '/config/constants.php';
    if (!file_exists($config_file)) {
        throw new Exception("Config file not found: " . $config_file);
    }
    require_once $config_file;
    
    $response_handler_file = __DIR__ . '/utils/ResponseHandler.php';
    if (!file_exists($response_handler_file)) {
        throw new Exception("ResponseHandler file not found: " . $response_handler_file);
    }
    require_once $response_handler_file;
    
    $auth_file = __DIR__ . '/middlewares/AuthMiddleware.php';
    if (!file_exists($auth_file)) {
        throw new Exception("AuthMiddleware file not found: " . $auth_file);
    }
    require_once $auth_file;
    
    // Attempt database connection
    $conn = null;
    $db_file = __DIR__ . '/config/database.php';
    if (!file_exists($db_file)) {
        error_log("Database config file not found: " . $db_file);
    } else {
        @include $db_file;
    }
    
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $role = isset($_GET['role']) ? strtolower($_GET['role']) : 'user';
    
    if ($method !== 'GET') {
        http_response_code(405);
        die(json_encode(['error' => 'Method not allowed']));
    }
    
    // Get dashboard data (even if database is unavailable, return valid JSON)
    $dashboardData = getDashboardData($conn, $role);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $dashboardData
    ]);
    exit;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
    exit;
}

/**
 * Get dashboard data based on user role
 */
function getDashboardData($conn, $role) {
    $data = [
        'summary' => [],
        'charts' => [],
        'stats' => [
            'total_employees' => 0,
            'on_leave_employees' => 0,
            'active_payroll_runs' => 0,
            'pending_requests' => 0
        ]
    ];
    
    // If no database connection, return empty data structure
    if (!$conn) {
        return $data;
    }
    
    try {
        // Get employee statistics
        $result = $conn->query("SELECT COUNT(*) as total FROM employees WHERE status = 'active'");
        if ($result) {
            $row = $result->fetch_assoc();
            $data['stats']['total_employees'] = intval($row['total'] ?? 0);
        }
        
        // Get on-leave count
        $result = $conn->query("SELECT COUNT(*) as total FROM employees WHERE status = 'on_leave'");
        if ($result) {
            $row = $result->fetch_assoc();
            $data['stats']['on_leave_employees'] = intval($row['total'] ?? 0);
        }
        
        // Get active payroll runs
        $result = $conn->query("SELECT COUNT(*) as total FROM payroll_runs WHERE status = 'processed'");
        if ($result) {
            $row = $result->fetch_assoc();
            $data['stats']['active_payroll_runs'] = intval($row['total'] ?? 0);
        }
        
        // Get pending requests (handle if table doesn't exist)
        $result = @$conn->query("SELECT COUNT(*) as total FROM leave_requests WHERE status = 'pending'");
        if ($result) {
            $row = $result->fetch_assoc();
            $data['stats']['pending_requests'] = intval($row['total'] ?? 0);
        }
        
        // Get department distribution
        $result = $conn->query(
            "SELECT d.name, COUNT(e.id) as count 
             FROM departments d 
             LEFT JOIN employees e ON d.id = e.department_id 
             GROUP BY d.id, d.name"
        );
        $deptDistribution = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $deptDistribution[] = [
                    'department' => $row['name'],
                    'count' => intval($row['count'] ?? 0)
                ];
            }
        }
        $data['charts']['department_distribution'] = $deptDistribution;
        
        // Get employee status distribution
        $result = $conn->query(
            "SELECT status, COUNT(*) as count 
             FROM employees 
             GROUP BY status"
        );
        $statusDistribution = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $statusDistribution[] = [
                    'status' => ucfirst(str_replace('_', ' ', $row['status'])),
                    'count' => intval($row['count'] ?? 0)
                ];
            }
        }
        $data['charts']['employee_status'] = $statusDistribution;
        
    } catch (Exception $e) {
        // Return partial data even if queries fail
        error_log("Dashboard data error: " . $e->getMessage());
    }
    
    return $data;
}

?>
