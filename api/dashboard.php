<?php
/**
 * Dashboard API Endpoint
 * Returns dashboard statistics and metrics based on user role
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    require_once __DIR__ . '/config/constants.php';
    require_once __DIR__ . '/utils/ResponseHandler.php';
    require_once __DIR__ . '/middlewares/AuthMiddleware.php';
    
    // Attempt database connection with error suppression
    @include __DIR__ . '/config/database.php';
    
    $method = $_SERVER['REQUEST_METHOD'];
    $role = isset($_GET['role']) ? strtolower($_GET['role']) : 'user';
    
    if ($method !== 'GET') {
        http_response_code(405);
        die(json_encode(['error' => 'Method not allowed']));
    }
    
    // Get dashboard data (even if database is unavailable, return valid JSON)
    $dashboardData = getDashboardData(isset($conn) ? $conn : null, $role);
    
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
