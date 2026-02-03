<?php
/**
 * Database Configuration
 * HR4 Hospital HR Management System
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'hr4_admin_4');
define('DB_PASS', 'admin123');
define('DB_NAME', 'hr4_hospital_4');
define('DB_PORT', 3306);

// Suppress error display
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Create connection with error suppression
$conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

// Check connection
if (!$conn || $conn->connect_error) {
    // Set $conn to null so files can check for it
    $conn = null;
    // If this is being required (not included), return null
    // Files should check if $conn is null before using it
    return null;
}

// Set charset to utf8
$conn->set_charset("utf8mb4");

// Return connection (for files that use $conn = require ...)
// Also make it available globally for files that use require_once
return $conn;
?>
