<?php
/**
 * Unified API Gateway/Router
 * HR4 Hospital HR Management System
 * Supports API versioning and multi-system integration (HR 1, HR 2, HR 3)
 */

// Enable error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-System-ID');
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
require_once __DIR__ . '/utils/ErrorLogger.php';
require_once __DIR__ . '/middlewares/AuthMiddleware.php';
require_once __DIR__ . '/core/CentralErrorHandler.php';

// Optional: enable central error handler for consistent JSON errors and logging (set APP_ENV in constants)
// CentralErrorHandler::setShowDetails(defined('APP_ENV') && APP_ENV === 'development');
// CentralErrorHandler::register();

/**
 * API Router Class
 * Handles routing with versioning and system identification
 */
class APIRouter {
    
    private $routes = [];
    private $version = 'v1';
    private $systemId = null;
    
    public function __construct() {
        $this->parseRequest();
        $this->registerRoutes();
    }
    
    /**
     * Parse request to extract version and system ID
     */
    private function parseRequest() {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path = str_replace('/hospital_4/api', '', $path);
        $path = trim($path, '/');
        
        // Extract API version from path (/api/v1/... or /api/v2/...)
        if (preg_match('#^v(\d+)#', $path, $matches)) {
            $this->version = 'v' . $matches[1];
            $path = preg_replace('#^v\d+/#', '', $path);
        }
        
        // Extract system ID from header (for multi-system integration)
        $headers = getallheaders();
        $this->systemId = $headers['X-System-ID'] ?? $_GET['system_id'] ?? 'HR1';
        
        // Store parsed path in global for route handlers
        $_SERVER['PARSED_PATH'] = $path;
        $_SERVER['API_VERSION'] = $this->version;
        $_SERVER['SYSTEM_ID'] = $this->systemId;
    }
    
    /**
     * Register all API routes
     */
    private function registerRoutes() {
        // Authentication routes (no version prefix)
        $this->routes['auth/login'] = 'auth/login.php';
        $this->routes['auth/register'] = 'auth/register.php';
        $this->routes['auth/refresh'] = 'auth/refresh.php';
        
        // HR Core Module - v1
        $this->routes['v1/hrcore/employees'] = 'HRCORE/employees.php';
        $this->routes['v1/hrcore/employees/{id}'] = 'HRCORE/employees.php';
        $this->routes['v1/hrcore/employees/{id}/documents'] = 'HRCORE/documents.php';
        $this->routes['v1/hrcore/departments'] = 'HRCORE/departments.php';
        $this->routes['v1/hrcore/departments/{id}'] = 'HRCORE/departments.php';
        $this->routes['v1/hrcore/positions'] = 'HRCORE/positions.php';
        $this->routes['v1/hrcore/positions/{id}'] = 'HRCORE/positions.php';
        
        // Payroll Module - v1
        $this->routes['v1/payroll/runs'] = 'payroll/payroll.php';
        $this->routes['v1/payroll/runs/{id}'] = 'payroll/payroll.php';
        $this->routes['v1/payroll/runs/{id}/compute'] = 'payroll/payroll.php';
        $this->routes['v1/payroll/runs/{id}/approve'] = 'payroll/payroll.php';
        $this->routes['v1/payroll/payslips'] = 'payroll/payslips.php';
        $this->routes['v1/payroll/payslips/{employeeId}'] = 'payroll/payslips.php';
        $this->routes['v1/payroll/compute'] = 'payroll/payroll.php';
        $this->routes['v1/payroll/attendance'] = 'payroll/attendance.php';
        $this->routes['v1/payroll/compliance'] = 'payroll/compliance.php';
        
        // Compensation Module - v1
        $this->routes['v1/compensation/benefits'] = 'compensation/compensation.php';
        $this->routes['v1/compensation/benefits/{id}'] = 'compensation/compensation.php';
        $this->routes['v1/compensation/allowances'] = 'compensation/allowances.php';
        $this->routes['v1/compensation/allowances/{id}'] = 'compensation/allowances.php';
        $this->routes['v1/compensation/deductions'] = 'compensation/deductions.php';
        $this->routes['v1/compensation/deductions/{id}'] = 'compensation/deductions.php';
        $this->routes['v1/compensation/bonuses'] = 'compensation/compensation.php';
        $this->routes['v1/compensation/adjustments'] = 'compensation/compensation.php';
        $this->routes['v1/compensation/adjustments/{id}'] = 'compensation/compensation.php';
        $this->routes['v1/compensation/salary-grades'] = 'compensation/salary-grades.php';
        $this->routes['v1/compensation/templates'] = 'compensation/templates.php';
        
        // Compensation Module - New Endpoints (HR4)
        $this->routes['compensation/plans'] = 'compensation/plans.php';
        $this->routes['compensation/plans/{id}'] = 'compensation/plans.php';
        $this->routes['compensation/adjustments'] = 'compensation/adjustments.php';
        $this->routes['compensation/adjustments/{id}'] = 'compensation/adjustments.php';
        $this->routes['compensation/incentives'] = 'compensation/incentives.php';
        $this->routes['compensation/incentives/{id}'] = 'compensation/incentives.php';
        $this->routes['compensation/bonds'] = 'compensation/bonds.php';
        $this->routes['compensation/bonds/{id}'] = 'compensation/bonds.php';
        
        // HMO Module - v1
        $this->routes['v1/hmo/providers'] = 'hmo/hmo.php';
        $this->routes['v1/hmo/providers/{id}'] = 'hmo/hmo.php';
        $this->routes['v1/hmo/plans'] = 'hmo/hmo.php';
        $this->routes['v1/hmo/plans/{id}'] = 'hmo/hmo.php';
        $this->routes['v1/hmo/enrollments'] = 'hmo/enrollments.php';
        $this->routes['v1/hmo/enrollments/{id}'] = 'hmo/enrollments.php';
        $this->routes['v1/hmo/enroll'] = 'hmo/enrollments.php';
        $this->routes['v1/hmo/claims'] = 'hmo/claims.php';
        $this->routes['v1/hmo/claims/{id}'] = 'hmo/claims.php';
        
        // Dashboard endpoint
        $this->routes['v1/dashboard'] = 'dashboard.php';
        
        // Analytics Module - v1
        $this->routes['v1/analytics/hr-metrics'] = 'analytics/analytics.php';
        $this->routes['v1/analytics/payroll-summary'] = 'analytics/analytics.php';
        $this->routes['v1/analytics/hmo-usage'] = 'analytics/analytics.php';
        $this->routes['v1/analytics/dashboard'] = 'analytics/analytics.php';
        $this->routes['v1/analytics/reports'] = 'analytics/analytics.php';
        $this->routes['v1/analytics/statistics'] = 'analytics/analytics.php';
        
        // Integration endpoints for HR 1, HR 2, HR 3
        $this->routes['v1/integration/sync'] = 'integration/sync.php';
        $this->routes['v1/integration/employees'] = 'integration/sync.php';
        $this->routes['v1/integration/payroll'] = 'integration/sync.php';
        
        // Health check
        $this->routes['health'] = 'health.php';
        $this->routes['v1/health'] = 'health.php';
    }
    
    /**
     * Match route and dispatch to handler
     */
    public function dispatch() {
        $path = $_SERVER['PARSED_PATH'] ?? '';
        $method = $_SERVER['REQUEST_METHOD'];
        
        // Health check (no auth required)
        if ($path === 'health' || $path === 'v1/health') {
            require_once __DIR__ . '/health.php';
            return;
        }
        
        // Try exact match first
        $routeKey = $this->version . '/' . $path;
        if (isset($this->routes[$routeKey])) {
            $this->loadHandler($this->routes[$routeKey]);
            return;
        }
        
        // Try without version prefix
        if (isset($this->routes[$path])) {
            $this->loadHandler($this->routes[$path]);
            return;
        }
        
        // Try pattern matching for dynamic routes
        foreach ($this->routes as $pattern => $handler) {
            $regex = $this->patternToRegex($pattern);
            if (preg_match($regex, $path)) {
                $this->loadHandler($handler);
                return;
            }
        }
        
        // 404 Not Found
        http_response_code(404);
        die(ResponseHandler::error('Endpoint not found', 404));
    }
    
    /**
     * Convert route pattern to regex
     */
    private function patternToRegex($pattern) {
        // Replace {id} with regex pattern
        $regex = preg_replace('/\{(\w+)\}/', '([^/]+)', $pattern);
        // Escape forward slashes
        $regex = str_replace('/', '\/', $regex);
        return '/^' . $regex . '$/';
    }
    
    /**
     * Load route handler
     */
    private function loadHandler($handler) {
        $filePath = __DIR__ . '/' . $handler;
        
        if (file_exists($filePath)) {
            require_once $filePath;
        } else {
            http_response_code(500);
            die(ResponseHandler::error('Handler file not found: ' . $handler, 500));
        }
    }
}

// Initialize and dispatch
try {
    $router = new APIRouter();
    $router->dispatch();
} catch (Exception $e) {
    http_response_code(500);
    die(ResponseHandler::error('Router error: ' . $e->getMessage(), 500));
}
?>
