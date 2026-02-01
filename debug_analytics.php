<?php
// Debug script to test analytics API
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Simulate a direct request to analytics.php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/hospital_4/api/analytics/analytics.php?resource=dashboard';
$_GET['resource'] = 'dashboard';

// Change to the API directory
chdir(__DIR__ . '/api');

// Set up basic configuration
require_once __DIR__ . '/api/config/constants.php';

// Try to test loading the database
try {
    $conn = require_once __DIR__ . '/api/config/database.php';
    echo "Database connection: " . ($conn ? "OK" : "FAILED") . "\n";
    if ($conn && $conn->connect_error) {
        echo "Connection error: " . $conn->connect_error . "\n";
    }
} catch (Exception $e) {
    echo "Error loading database: " . $e->getMessage() . "\n";
}

// Check analytics.php file
$analyticsFile = __DIR__ . '/api/analytics/analytics.php';
echo "Analytics file exists: " . (file_exists($analyticsFile) ? "YES" : "NO") . "\n";

// Check what the .htaccess routes would do
echo "\n=== PATH ANALYSIS ===\n";
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/hospital_4/api', '', $path);
$path = trim($path, '/');
echo "Parsed path: $path\n";

// Check if the path would match any routes in index.php
echo "Would match in api/index.php: ";
$routes = [
    'auth/login' => 'auth/login.php',
    'analytics/analytics' => 'analytics/analytics.php',
];
echo (isset($routes[$path]) ? "YES - " . $routes[$path] : "NO") . "\n";
?>
