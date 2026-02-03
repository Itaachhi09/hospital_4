<?php
/**
 * Logout Endpoint
 * POST /api/auth/logout
 * Clears session and invalidates token
 */

// Load configuration and session manager
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../SessionManager.php';

// Initialize session
SessionManager::init();

// Set response header
header('Content-Type: application/json');

// Only accept POST requests
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed']));
}

// Clear session using SessionManager
SessionManager::destroy();

// Also clear the session cookie
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

// Return success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
exit;
?>

