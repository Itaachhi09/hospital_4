<?php
/**
 * Compensation Module Router
 * HR4 Hospital HR Management System
 * 
 * Routes all compensation-related requests to appropriate handlers
 * Supported endpoints:
 * /api/compensation/plans
 * /api/compensation/adjustments
 * /api/compensation/incentives
 * /api/compensation/bonds
 * /api/compensation/dashboard
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
$conn = require __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_filter(explode('/', $path));

// Get the main resource (plans, adjustments, incentives, bonds)
$resource = $parts[count($parts) - 1] ?? null;

// Route to appropriate handler
switch ($resource) {
    case 'plans':
        require_once __DIR__ . '/plans.php';
        break;

    case 'adjustments':
        require_once __DIR__ . '/adjustments.php';
        break;

    case 'incentives':
        require_once __DIR__ . '/incentives.php';
        break;

    case 'bonds':
        require_once __DIR__ . '/bonds.php';
        break;

    case 'dashboard':
        require_once __DIR__ . '/dashboard.php';
        break;

    case 'compensation':
    case 'index.php':
        // Return module info
        http_response_code(200);
        echo json_encode(ResponseHandler::success([
            'module' => 'compensation',
            'version' => '1.0.0',
            'endpoints' => [
                'plans' => '/api/compensation/plans',
                'adjustments' => '/api/compensation/adjustments',
                'incentives' => '/api/compensation/incentives',
                'bonds' => '/api/compensation/bonds',
                'dashboard' => '/api/compensation/dashboard'
            ]
        ]));
        break;

    default:
        http_response_code(404);
        echo json_encode(ResponseHandler::error('Compensation module endpoint not found'));
}
?>
