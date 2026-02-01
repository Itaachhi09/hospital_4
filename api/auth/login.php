<?php
/**
 * Login Endpoint
 * POST /api/auth/login
 * 
 * Request body:
 * {
 *   "email": "user@hospital.com",
 *   "password": "password123"
 * }
 */

// Start session for server-side validation
session_start();

error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Method not allowed']));
}

// Include utilities
$configPath = __DIR__ . '/../config/constants.php';
$responseHandlerPath = __DIR__ . '/../utils/ResponseHandler.php';
$validationHelperPath = __DIR__ . '/../utils/ValidationHelper.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    die(json_encode(['error' => 'Config file not found', 'path' => $configPath]));
}

require_once $configPath;
require_once $responseHandlerPath;
require_once $validationHelperPath;

// Validate input
if (empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    die(ResponseHandler::error('Email and password are required'));
}

$email = ValidationHelper::sanitizeInput($input['email']);
$password = $input['password'];

// For development - mock user authentication
// In production, query the database
$mockUsers = [
    [
        'id' => 'USR001',
        'email' => 'admin@hospital.com',
        'password' => password_hash('admin123', PASSWORD_BCRYPT),
        'name' => 'Dexter Admin',
        'role' => 'admin',
        'role_name' => 'admin',
        'status' => 'active'
    ],
    [
        'id' => 'USR002',
        'email' => 'hrchief@hospital.com',
        'password' => password_hash('hrchief123', PASSWORD_BCRYPT),
        'name' => 'Sarah HR Chief',
        'role' => 'hrchief',
        'role_name' => 'hrchief',
        'status' => 'active'
    ],
    [
        'id' => 'USR003',
        'email' => 'admin2@hospital.com',
        'password' => password_hash('admin123', PASSWORD_BCRYPT),
        'name' => 'John Admin',
        'role' => 'admin',
        'role_name' => 'admin',
        'status' => 'active'
    ]
];

// Find user
$user = null;
foreach ($mockUsers as $u) {
    if ($u['email'] === $email) {
        $user = $u;
        break;
    }
}

if (!$user) {
    http_response_code(401);
    die(ResponseHandler::error('Invalid email or password'));
}

// Verify password
if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    die(ResponseHandler::error('Invalid email or password'));
}

if ($user['status'] !== 'active') {
    http_response_code(403);
    die(ResponseHandler::error('User account is inactive'));
}

// Generate JWT token
$token = generateJWT([
    'id' => $user['id'],
    'email' => $user['email'],
    'name' => $user['name'],
    'role' => $user['role']
]);

// Store authentication in session for server-side validation
$_SESSION['authToken'] = $token;
$_SESSION['userId'] = $user['id'];
$_SESSION['userEmail'] = $user['email'];
$_SESSION['userName'] = $user['name'];
$_SESSION['userRole'] = $user['role'];

$response = [
    'token' => $token,
    'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'role_name' => $user['role_name'] ?? $user['role']
    ]
];

echo ResponseHandler::success($response, 'Login successful', 200);

/**
 * Generate JWT Token
 */
function generateJWT($payload) {
    $header = [
        'alg' => JWT_ALGORITHM,
        'typ' => 'JWT'
    ];

    $payload['exp'] = time() + JWT_EXPIRATION;
    $payload['iat'] = time();

    $headerEncoded = base64UrlEncode(json_encode($header));
    $payloadEncoded = base64UrlEncode(json_encode($payload));
    
    $signature = hash_hmac(
        'sha256',
        $headerEncoded . '.' . $payloadEncoded,
        JWT_SECRET,
        true
    );
    
    $signatureEncoded = base64UrlEncode($signature);
    
    return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
}

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
?>
