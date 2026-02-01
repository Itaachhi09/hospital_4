<?php
/**
 * CSRF Protection Middleware
 * Provides Cross-Site Request Forgery protection for state-changing operations
 */

class CSRFProtection {
    
    private static $tokenLength = 32;
    
    /**
     * Generate CSRF token
     */
    public static function generateToken() {
        if (!isset($_SESSION)) {
            session_start();
        }
        
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(self::$tokenLength));
        }
        
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Get CSRF token
     */
    public static function getToken() {
        if (!isset($_SESSION)) {
            session_start();
        }
        
        return $_SESSION['csrf_token'] ?? null;
    }
    
    /**
     * Verify CSRF token
     */
    public static function verifyToken($token) {
        if (!isset($_SESSION)) {
            session_start();
        }
        
        $sessionToken = $_SESSION['csrf_token'] ?? null;
        
        if (!$sessionToken || !$token) {
            return false;
        }
        
        // Constant-time comparison
        return hash_equals($sessionToken, $token);
    }
    
    /**
     * Validate CSRF token from request
     * Checks X-CSRF-Token header or csrf_token form field
     */
    public static function validate() {
        $token = self::getTokenFromRequest();
        
        if (!$token || !self::verifyToken($token)) {
            http_response_code(403);
            die(json_encode([
                'success' => false,
                'message' => 'CSRF token validation failed',
                'timestamp' => date('Y-m-d H:i:s')
            ]));
        }
        
        return true;
    }
    
    /**
     * Get CSRF token from request (header or form field)
     */
    private static function getTokenFromRequest() {
        $headers = getallheaders();
        
        // Check X-CSRF-Token header first
        if (!empty($headers['X-CSRF-Token'])) {
            return $headers['X-CSRF-Token'];
        }
        
        // Check form field or JSON body
        if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['csrf_token'])) {
                return $input['csrf_token'];
            }
            
            if (isset($_POST['csrf_token'])) {
                return $_POST['csrf_token'];
            }
        }
        
        return null;
    }
    
    /**
     * Inject CSRF token into HTML response
     */
    public static function injectToken($html) {
        $token = self::generateToken();
        
        // Add to meta tag
        $metaTag = '<meta name="csrf-token" content="' . htmlspecialchars($token, ENT_QUOTES) . '">';
        
        if (strpos($html, '</head>') !== false) {
            $html = str_replace('</head>', $metaTag . "\n</head>", $html);
        }
        
        return $html;
    }
}

?>
