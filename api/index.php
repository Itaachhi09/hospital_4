<?php
/**
 * API Entry Point
 * HR4 Hospital HR Management System
 */

// Enable error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    die();
}

// Load configuration and utilities
require_once __DIR__ . '/config/constants.php';
require_once __DIR__ . '/utils/ResponseHandler.php';
require_once __DIR__ . '/utils/ValidationHelper.php';
require_once __DIR__ . '/middlewares/AuthMiddleware.php';

// Simple routing
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/hospital_4/api', '', $path);
$path = trim($path, '/');

// Route dispatcher
$routes = [
    'auth/login' => 'auth/login.php',
    'auth/register' => 'auth/register.php',
    'auth/refresh' => 'auth/refresh.php',
    'auth/verify' => 'auth/verify.php',
    'auth/logout' => 'auth/logout.php',
    'employees' => 'HRCORE/employees.php',
    'departments' => 'HRCORE/departments.php',
    'hrcore/employees' => 'HRCORE/employees.php',
    'hrcore/departments' => 'HRCORE/departments.php',
    'payroll' => 'payroll/payroll.php',
    'salaries' => 'payroll/salaries.php',
    'dashboard' => 'dashboard.php',
    'v1/dashboard' => 'dashboard.php',
    'compensation/plans' => 'compensation/plans.php',
    'compensation/adjustments' => 'compensation/adjustments.php',
    'compensation/incentives' => 'compensation/incentives.php',
    'compensation/bonds' => 'compensation/bonds.php',
];

if (isset($routes[$path])) {
    require_once __DIR__ . '/' . $routes[$path];
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}
?>
