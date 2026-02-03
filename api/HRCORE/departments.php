<?php
/**
 * Departments Endpoints
 * List departments for HR Core module
 */

// Suppress error display, we'll handle it ourselves
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../config/constants.php';
    require_once __DIR__ . '/../utils/ResponseHandler.php';
    
    // Get database connection
    $conn = require __DIR__ . '/../config/database.php';
    
    if (!$conn || $conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $sql = "SELECT id, name, description, status FROM departments WHERE status = 'active' ORDER BY name";
        $result = $conn->query($sql);
        
        if (!$result) {
            throw new Exception('Query failed: ' . $conn->error);
        }
        
        $departments = [];
        while ($row = $result->fetch_assoc()) {
            $departments[] = $row;
        }
        
        echo ResponseHandler::success($departments, 'Departments retrieved successfully');
    } else {
        http_response_code(405);
        die(ResponseHandler::error('Method not allowed'));
    }
} catch (Exception $e) {
    http_response_code(500);
    die(ResponseHandler::error('Server error: ' . $e->getMessage()));
}
?>
