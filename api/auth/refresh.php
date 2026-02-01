<?php
/**
 * Token Refresh Endpoint
 * POST /api/auth/refresh
 * 
 * Request headers:
 * Authorization: Bearer <token>
 */

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Method not allowed']));
}

require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

try {
    // Verify current token
    $user = AuthMiddleware::verifyToken();
    
    // Generate new token with same payload
    $newToken = generateJWT([
        'id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'role' => $user['role']
    ]);
    
    $response = [
        'token' => $newToken,
        'user' => $user
    ];
    
    echo ResponseHandler::success($response, 'Token refreshed successfully');
    
} catch (Exception $e) {
    http_response_code(401);
    die(ResponseHandler::error('Invalid or expired token'));
}

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
