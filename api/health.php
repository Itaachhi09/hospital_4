<?php
/**
 * Health Check Endpoint
 * Used for monitoring and load balancer health checks
 */

header('Content-Type: application/json');

@require_once __DIR__ . '/config/database.php';

$health = [
    'status' => 'healthy',
    'timestamp' => date('Y-m-d H:i:s'),
    'version' => '1.0.0',
    'system' => 'HR4 Hospital HR Management System'
];

// Check database connection
try {
    @$conn = require __DIR__ . '/config/database.php';
    if ($conn && !$conn->connect_error) {
        $health['database'] = 'connected';
        $conn->close();
    } else {
        $health['database'] = 'disconnected';
        $health['status'] = 'degraded';
    }
} catch (Exception $e) {
    $health['database'] = 'error: ' . $e->getMessage();
    $health['status'] = 'unhealthy';
}

http_response_code($health['status'] === 'healthy' ? 200 : 503);
echo json_encode($health, JSON_PRETTY_PRINT);
?>
