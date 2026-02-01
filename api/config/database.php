<?php
/**
 * Database Configuration
 * HR4 Hospital HR Management System
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'hr4_hospital');
define('DB_PORT', 3306);

// Suppress error display
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Create connection with error suppression
$conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

// Check connection
if ($conn->connect_error) {
    // Return proper JSON error instead of die
    header('Content-Type: application/json');
    http_response_code(503);
    echo json_encode(['error' => 'Database connection failed', 'message' => 'Database service is unavailable']);
    exit;
}

// Set charset to utf8
$conn->set_charset("utf8mb4");

// Return connection
return $conn;
?>
