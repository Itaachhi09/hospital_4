<?php
/**
 * Logout Endpoint
 * POST /api/auth/logout
 * Clears session and invalidates token
 */

session_start();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed']));
}

// Clear session variables
$_SESSION = [];
session_destroy();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
exit;
?>
