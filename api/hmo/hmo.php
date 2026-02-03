<?php
/**
 * HMO Management Endpoints
 * GET /api/hmo/providers - List HMO providers
 * POST /api/hmo/providers - Create provider
 * GET /api/hmo/plans - List health plans
 * POST /api/hmo/plans - Create plan
 * GET /api/hmo/enrollment - List enrollments
 * POST /api/hmo/enrollment - Create enrollment
 * GET /api/hmo/claims - List claims
 * POST /api/hmo/claims - File claim
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$parts = explode('/', $path);

// Get resource from URL path or query parameter
$resource = isset($_GET['resource']) ? $_GET['resource'] : (isset($parts[count($parts) - 1]) ? $parts[count($parts) - 1] : '');
$id = isset($_GET['id']) ? $_GET['id'] : (isset($parts[count($parts) - 2]) && is_numeric($parts[count($parts) - 2]) ? $parts[count($parts) - 2] : null);

// If no resource from URL, default to 'providers' for backward compatibility
if (!$resource || $resource === 'hmo') {
    $resource = 'providers';
}

// Mock database
$providers = [
    ['ProviderID' => 'HMO001', 'ProviderName' => 'MediCare Plus', 'ContactPerson' => 'John Doe', 'ContactPhone' => '08012345678', 'ContactEmail' => 'contact@medicare.com', 'IsActive' => 1],
    ['ProviderID' => 'HMO002', 'ProviderName' => 'HealthGuard Insurance', 'ContactPerson' => 'Jane Smith', 'ContactPhone' => '08087654321', 'ContactEmail' => 'info@healthguard.com', 'IsActive' => 1],
];

$plans = [
    ['PlanID' => 'PLAN001', 'ProviderID' => 'HMO001', 'PlanName' => 'Basic Health', 'CoverageLimit' => 500000, 'MonthlyPremium' => 3500, 'IsActive' => 1],
    ['PlanID' => 'PLAN002', 'ProviderID' => 'HMO001', 'PlanName' => 'Premium Health', 'CoverageLimit' => 1000000, 'MonthlyPremium' => 7000, 'IsActive' => 1],
];

$enrollments = [
    ['EnrollmentID' => 'ENR001', 'EmployeeID' => 'EMP001', 'PlanID' => 'PLAN001', 'EnrollmentDate' => '2025-01-01', 'Status' => 'Active', 'Dependents' => 2],
    ['EnrollmentID' => 'ENR002', 'EmployeeID' => 'EMP002', 'PlanID' => 'PLAN002', 'EnrollmentDate' => '2025-02-01', 'Status' => 'Active', 'Dependents' => 0],
];

$claims = [
    ['ClaimID' => 'CLM001', 'EmployeeID' => 'EMP001', 'ClaimDate' => '2026-01-10', 'Amount' => 50000, 'ClaimStatus' => 'Approved', 'Reason' => 'Medical Treatment'],
    ['ClaimID' => 'CLM002', 'EmployeeID' => 'EMP002', 'ClaimDate' => '2026-01-15', 'Amount' => 75000, 'ClaimStatus' => 'Pending', 'Reason' => 'Surgery'],
];

switch ($resource) {
    case 'providers':
        handleProviders($method, $id);
        break;
    case 'plans':
        handlePlans($method, $id);
        break;
    case 'enrollment':
        handleEnrollment($method, $id);
        break;
    case 'claims':
        handleClaims($method, $id);
        break;
    default:
        http_response_code(404);
        die(ResponseHandler::error('Resource not found'));
}

function handleProviders($method, $id) {
    global $providers;
    
    switch ($method) {
        case 'GET':
            if ($id) {
                foreach ($providers as $prov) {
                    if ($prov['ProviderID'] == $id) {
                        echo ResponseHandler::success($prov, 'Provider retrieved successfully');
                        return;
                    }
                }
                http_response_code(404);
                die(ResponseHandler::error('Provider not found'));
            } else {
                echo ResponseHandler::paginated($providers, count($providers), 1, DEFAULT_PAGE_SIZE, 'Providers retrieved successfully');
            }
            break;
        
        case 'POST':
            $user = AuthMiddleware::verifyToken();
            if (!in_array($user['role'], [ROLE_ADMIN, ROLE_HR_MANAGER])) {
                http_response_code(403);
                die(ResponseHandler::error('You do not have permission'));
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $errors = [];
            
            if (empty($input['ProviderName'])) $errors['ProviderName'] = 'Provider name is required';
            if (empty($input['ContactPhone'])) $errors['ContactPhone'] = 'Contact phone is required';
            
            if (!empty($errors)) {
                http_response_code(400);
                die(ResponseHandler::error('Validation failed', 400, $errors));
            }
            
            $newProvider = [
                'ProviderID' => 'HMO' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT),
                'ProviderName' => ValidationHelper::sanitizeInput($input['ProviderName']),
                'ContactPerson' => ValidationHelper::sanitizeInput($input['ContactPerson'] ?? ''),
                'ContactPhone' => ValidationHelper::sanitizeInput($input['ContactPhone']),
                'ContactEmail' => ValidationHelper::sanitizeInput($input['ContactEmail'] ?? ''),
                'IsActive' => 1
            ];
            
            http_response_code(201);
            echo ResponseHandler::success($newProvider, 'Provider created successfully', 201);
            break;
        
        default:
            http_response_code(405);
            die(ResponseHandler::error('Method not allowed'));
    }
}

function handlePlans($method, $id) {
    global $plans;
    
    switch ($method) {
        case 'GET':
            if ($id) {
                foreach ($plans as $plan) {
                    if ($plan['PlanID'] == $id) {
                        echo ResponseHandler::success($plan, 'Plan retrieved successfully');
                        return;
                    }
                }
                http_response_code(404);
                die(ResponseHandler::error('Plan not found'));
            } else {
                echo ResponseHandler::paginated($plans, count($plans), 1, DEFAULT_PAGE_SIZE, 'Plans retrieved successfully');
            }
            break;
        
        case 'POST':
            $user = AuthMiddleware::verifyToken();
            if (!in_array($user['role'], [ROLE_ADMIN, ROLE_HR_MANAGER])) {
                http_response_code(403);
                die(ResponseHandler::error('You do not have permission'));
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $errors = [];
            
            if (empty($input['PlanName'])) $errors['PlanName'] = 'Plan name is required';
            if (empty($input['ProviderID'])) $errors['ProviderID'] = 'Provider ID is required';
            
            if (!empty($errors)) {
                http_response_code(400);
                die(ResponseHandler::error('Validation failed', 400, $errors));
            }
            
            $newPlan = [
                'PlanID' => 'PLAN' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT),
                'ProviderID' => ValidationHelper::sanitizeInput($input['ProviderID']),
                'PlanName' => ValidationHelper::sanitizeInput($input['PlanName']),
                'CoverageLimit' => (float)($input['CoverageLimit'] ?? 0),
                'MonthlyPremium' => (float)($input['MonthlyPremium'] ?? 0),
                'IsActive' => 1
            ];
            
            http_response_code(201);
            echo ResponseHandler::success($newPlan, 'Plan created successfully', 201);
            break;
        
        default:
            http_response_code(405);
            die(ResponseHandler::error('Method not allowed'));
    }
}

function handleEnrollment($method, $id) {
    global $enrollments;
    
    switch ($method) {
        case 'GET':
            if ($id) {
                foreach ($enrollments as $enr) {
                    if ($enr['EnrollmentID'] == $id) {
                        echo ResponseHandler::success($enr, 'Enrollment retrieved successfully');
                        return;
                    }
                }
                http_response_code(404);
                die(ResponseHandler::error('Enrollment not found'));
            } else {
                echo ResponseHandler::paginated($enrollments, count($enrollments), 1, DEFAULT_PAGE_SIZE, 'Enrollments retrieved successfully');
            }
            break;
        
        case 'POST':
            $user = AuthMiddleware::verifyToken();
            if (!in_array($user['role'], [ROLE_ADMIN, ROLE_HR_MANAGER])) {
                http_response_code(403);
                die(ResponseHandler::error('You do not have permission'));
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $errors = [];
            
            if (empty($input['EmployeeID'])) $errors['EmployeeID'] = 'Employee ID is required';
            if (empty($input['PlanID'])) $errors['PlanID'] = 'Plan ID is required';
            
            if (!empty($errors)) {
                http_response_code(400);
                die(ResponseHandler::error('Validation failed', 400, $errors));
            }
            
            $newEnrollment = [
                'EnrollmentID' => 'ENR' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'EmployeeID' => ValidationHelper::sanitizeInput($input['EmployeeID']),
                'PlanID' => ValidationHelper::sanitizeInput($input['PlanID']),
                'EnrollmentDate' => $input['EnrollmentDate'] ?? date('Y-m-d'),
                'Status' => 'Active',
                'Dependents' => (int)($input['Dependents'] ?? 0)
            ];
            
            http_response_code(201);
            echo ResponseHandler::success($newEnrollment, 'Enrollment created successfully', 201);
            break;
        
        default:
            http_response_code(405);
            die(ResponseHandler::error('Method not allowed'));
    }
}

function handleClaims($method, $id) {
    global $claims;
    
    switch ($method) {
        case 'GET':
            if ($id) {
                foreach ($claims as $clm) {
                    if ($clm['ClaimID'] == $id) {
                        echo ResponseHandler::success($clm, 'Claim retrieved successfully');
                        return;
                    }
                }
                http_response_code(404);
                die(ResponseHandler::error('Claim not found'));
            } else {
                $status = isset($_GET['status']) ? $_GET['status'] : null;
                $filtered = $claims;
                
                if ($status) {
                    $filtered = array_filter($claims, function($c) use ($status) {
                        return $c['ClaimStatus'] == $status;
                    });
                }
                
                echo ResponseHandler::paginated($filtered, count($filtered), 1, DEFAULT_PAGE_SIZE, 'Claims retrieved successfully');
            }
            break;
        
        case 'POST':
            $user = AuthMiddleware::verifyToken();
            
            $input = json_decode(file_get_contents('php://input'), true);
            $errors = [];
            
            if (empty($input['EmployeeID'])) $errors['EmployeeID'] = 'Employee ID is required';
            if (!isset($input['Amount']) || $input['Amount'] <= 0) $errors['Amount'] = 'Valid amount is required';
            
            if (!empty($errors)) {
                http_response_code(400);
                die(ResponseHandler::error('Validation failed', 400, $errors));
            }
            
            $newClaim = [
                'ClaimID' => 'CLM' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'EmployeeID' => ValidationHelper::sanitizeInput($input['EmployeeID']),
                'ClaimDate' => $input['ClaimDate'] ?? date('Y-m-d'),
                'Amount' => (float)$input['Amount'],
                'ClaimStatus' => 'Pending',
                'Reason' => ValidationHelper::sanitizeInput($input['Reason'] ?? '')
            ];
            
            http_response_code(201);
            echo ResponseHandler::success($newClaim, 'Claim filed successfully', 201);
            break;
        
        default:
            http_response_code(405);
            die(ResponseHandler::error('Method not allowed'));
    }
}
?>
