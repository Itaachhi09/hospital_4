<?php
/**
 * Database Configuration
 * HR4 Hospital HR Management System
 */

if (!defined('DB_HOST')) define('DB_HOST', 'localhost');
if (!defined('DB_USER')) define('DB_USER', 'hr4_admin_4');
if (!defined('DB_PASS')) define('DB_PASS', 'admin123');
if (!defined('DB_NAME')) define('DB_NAME', 'hr4_hospital_4');
if (!defined('DB_PORT')) define('DB_PORT', 3306);

// Suppress error display
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Create connection with error suppression
$conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

// Check connection
if (!$conn || $conn->connect_error) {
    // Log the error for debugging
    error_log("Database connection error: " . ($conn ? $conn->connect_error : "Connection object creation failed"));
    // Set $conn to null so files can check for it
    $conn = null;
}

// Set charset to utf8 if connection exists
if ($conn) {
    $conn->set_charset("utf8mb4");
}
?>

