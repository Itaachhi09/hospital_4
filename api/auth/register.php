<?php
/**
 * User Registration Endpoint
 * POST /api/auth/register
 * 
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@hospital.com",
 *   "password": "password123",
 *   "password_confirm": "password123"
 * }
 */

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Method not allowed']));
}

require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ValidationHelper.php';

// Validate input
$errors = [];

if (empty($input['name'])) {
    $errors['name'] = 'Name is required';
}

if (empty($input['email']) || !ValidationHelper::validateEmail($input['email'])) {
    $errors['email'] = 'Valid email is required';
}

if (empty($input['password']) || strlen($input['password']) < 8) {
    $errors['password'] = 'Password must be at least 8 characters';
}

if (empty($input['password_confirm']) || $input['password'] !== $input['password_confirm']) {
    $errors['password_confirm'] = 'Passwords do not match';
}

// Check password strength
$strength = ValidationHelper::validatePasswordStrength($input['password']);
if (!$strength['valid']) {
    $errors['password_strength'] = 'Password does not meet security requirements: ' . implode(', ', $strength['feedback']);
}

if (!empty($errors)) {
    http_response_code(400);
    die(ResponseHandler::error('Validation failed', 400, $errors));
}

// In production, check if user already exists in database
// For now, we'll just create the user

$name = ValidationHelper::sanitizeInput($input['name']);
$email = ValidationHelper::sanitizeInput($input['email']);
$password = password_hash($input['password'], PASSWORD_DEFAULT, ['cost' => BCRYPT_ROUNDS]);

// In production, insert into database
$user = [
    'id' => 'USR' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT),
    'name' => $name,
    'email' => $email,
    'password_hash' => $password,
    'role' => ROLE_EMPLOYEE,
    'status' => 'active',
    'created_at' => date('Y-m-d H:i:s')
];

$response = [
    'id' => $user['id'],
    'name' => $user['name'],
    'email' => $user['email'],
    'role' => $user['role']
];

echo ResponseHandler::success($response, 'User registered successfully', 201);
?>
