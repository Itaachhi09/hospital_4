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

// Load configuration and session manager
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../SessionManager.php';

// Initialize session
SessionManager::init();

// Set response header
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed']));
}

// Include utilities
$responseHandlerPath = __DIR__ . '/../utils/ResponseHandler.php';
$validationHelperPath = __DIR__ . '/../utils/ValidationHelper.php';

if (!file_exists($responseHandlerPath)) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'ResponseHandler not found']));
}

require_once $responseHandlerPath;
require_once $validationHelperPath;

// Validate input
if (empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Email and password are required']));
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
    die(json_encode(['success' => false, 'message' => 'Invalid email or password']));
}

// Verify password
if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Invalid email or password']));
}

if ($user['status'] !== 'active') {
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'User account is inactive']));
}

// Generate JWT token
$token = generateJWT([
    'id' => $user['id'],
    'email' => $user['email'],
    'name' => $user['name'],
    'role' => $user['role']
]);

// Store authentication in session using SessionManager (IMPORTANT!)
// This allows server-side session validation on protected pages
SessionManager::setUser(
    $user['id'],           // userId
    $user['email'],        // email
    $user['name'],         // name
    $user['role'],         // role
    $token                 // token
);

// Prepare response
$response = [
    'success' => true,
    'data' => [
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'role_name' => $user['role_name'] ?? $user['role']
        ]
    ],
    'message' => 'Login successful'
];

http_response_code(200);
echo json_encode($response);
exit;

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

?>
