<?php
/**
 * Token Verification Endpoint
 * Validates JWT token from Authorization header
 */

require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

// Only accept POST requests
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed']));
}

try {
    // Verify token from Authorization header
    $userData = AuthMiddleware::verifyToken();
    
    // Token is valid
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Token is valid',
        'data' => $userData
    ]);
    exit;
    
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Token verification failed: ' . $e->getMessage()
    ]);
    exit;
}
?>
