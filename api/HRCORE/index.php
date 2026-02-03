<?php
/**
 * HR Core Module Router
 * Routes requests to appropriate handlers
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

$conn = null;
@include __DIR__ . '/../config/database.php';

if (!$conn) {
    http_response_code(500);
    die(ResponseHandler::error('Database connection failed'));
}

$method = $_SERVER['REQUEST_METHOD'];
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts = explode('/', $path);

// Get resource from query parameter or URL path
$resource = isset($_GET['resource']) ? $_GET['resource'] : (isset($parts[count($parts) - 1]) ? $parts[count($parts) - 1] : '');
$id = isset($_GET['id']) ? $_GET['id'] : (isset($parts[count($parts) - 2]) && !empty($parts[count($parts) - 2]) ? $parts[count($parts) - 2] : null);

// Default resource
if (!$resource || $resource === 'hrcore') {
    $resource = 'employees';
}

// Route to appropriate handler
switch ($resource) {
    case 'employees':
        require_once __DIR__ . '/employees.php';
        break;
    case 'documents':
        require_once __DIR__ . '/documents.php';
        break;
    case 'document-categories':
        require_once __DIR__ . '/document-categories.php';
        break;
    case 'document-types':
        require_once __DIR__ . '/document-types.php';
        break;
    case 'departments':
        require_once __DIR__ . '/departments.php';
        break;
    default:
        http_response_code(404);
        die(ResponseHandler::error('Resource not found'));
}
?>
