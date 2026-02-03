<?php
/**
 * JWT Authentication Middleware
 * Verifies JWT tokens with HMAC signature verification and validates user authorization
 * SECURITY ENHANCED: Implements proper JWT signature validation
 */

require_once __DIR__ . '/../config/constants.php';

class AuthMiddleware {
    
    public static function verifyToken() {
        // Try to get Authorization header from multiple sources
        // First try getallheaders() (Apache)
        $authHeader = null;
        
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? null;
        }
        
        // Fallback to $_SERVER for LiteSpeed and other servers
        if (!$authHeader && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }
        
        // Also try the lowercase version
        if (!$authHeader && !empty($_SERVER['http_authorization'])) {
            $authHeader = $_SERVER['http_authorization'];
        }
        
        if (!$authHeader) {
            http_response_code(401);
            die(json_encode(['error' => 'No authorization header provided']));
        }
        
        // Extract token from "Bearer <token>"
        $parts = explode(' ', $authHeader);
        if (count($parts) !== 2 || $parts[0] !== 'Bearer') {
            http_response_code(401);
            die(json_encode(['error' => 'Invalid authorization header format']));
        }
        
        $token = $parts[1];
        
        try {
            $decoded = self::decodeJWT($token);
            return $decoded;
        } catch (Exception $e) {
            http_response_code(401);
            die(json_encode(['error' => 'Invalid or expired token: ' . $e->getMessage()]));
        }
    }

    /**
     * Try to verify token without dying on failure
     * Returns user data on success, null on failure
     */
    public static function tryVerifyToken() {
        // Try to get Authorization header from multiple sources
        $authHeader = null;
        
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? null;
        }
        
        // Fallback to $_SERVER for LiteSpeed and other servers
        if (!$authHeader && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }
        
        // Also try the lowercase version
        if (!$authHeader && !empty($_SERVER['http_authorization'])) {
            $authHeader = $_SERVER['http_authorization'];
        }
        
        if (!$authHeader) {
            return null;
        }
        
        // Extract token from "Bearer <token>"
        $parts = explode(' ', $authHeader);
        if (count($parts) !== 2 || $parts[0] !== 'Bearer') {
            return null;
        }
        
        $token = $parts[1];
        
        try {
            $decoded = self::decodeJWT($token);
            return $decoded;
        } catch (Exception $e) {
            // Log error but don't die
            error_log('Token verification failed: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Decode and verify JWT token with HMAC signature validation
     * SECURITY FIX: Now validates the signature to prevent token tampering
     */
    public static function decodeJWT($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }
        
        $header = $parts[0];
        $payload = $parts[1];
        $signature = $parts[2];
        
        // Decode header
        $headerDecoded = json_decode(self::base64UrlDecode($header), true);
        if (!$headerDecoded) {
            throw new Exception('Invalid header');
        }
        
        // Verify algorithm is HS256
        if (($headerDecoded['alg'] ?? null) !== 'HS256') {
            throw new Exception('Unsupported algorithm: ' . ($headerDecoded['alg'] ?? 'none'));
        }
        
        // Decode payload
        $payloadDecoded = json_decode(self::base64UrlDecode($payload), true);
        if (!$payloadDecoded) {
            throw new Exception('Invalid payload');
        }
        
        // SECURITY FIX: Verify HMAC signature
        $message = $header . '.' . $payload;
        $secret = JWT_SECRET;
        
        // Create expected signature using HMAC-SHA256
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', $message, $secret, true)
        );
        
        // Constant-time comparison to prevent timing attacks
        if (!hash_equals($expectedSignature, $signature)) {
            throw new Exception('Invalid signature');
        }
        
        // Check expiration
        if (isset($payloadDecoded['exp']) && $payloadDecoded['exp'] < time()) {
            throw new Exception('Token expired');
        }
        
        // Check issued at time (optional but recommended)
        if (isset($payloadDecoded['iat']) && $payloadDecoded['iat'] > time()) {
            throw new Exception('Token issued in the future');
        }
        
        return $payloadDecoded;
    }
    
    /**
     * Base64 URL decode (used in JWT)
     */
    private static function base64UrlDecode($data) {
        $b64 = strtr($data, '-_', '+/');
        return base64_decode($b64);
    }
    
    /**
     * Base64 URL encode (used in JWT)
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    public static function checkRole($user, $requiredRole) {
        if (!isset($user['role'])) {
            http_response_code(403);
            die(json_encode(['error' => 'No role assigned to user']));
        }
        
        $userRoles = is_array($user['role']) ? $user['role'] : [$user['role']];
        
        if (!in_array($requiredRole, $userRoles)) {
            http_response_code(403);
            die(json_encode(['error' => 'Insufficient permissions']));
        }
    }
}
?>
