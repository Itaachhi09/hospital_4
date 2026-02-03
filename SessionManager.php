<?php
/**
 * Session Management Helper
 * Centralized session handling functions
 */

require_once 'config.php';

class SessionManager {
    
    /**
     * Initialize session with security settings
     */
    public static function init() {
        // Only start session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Set session timeout
        if (isset($_SESSION['last_activity'])) {
            if (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT) {
                self::destroy();
                return false;
            }
        }
        $_SESSION['last_activity'] = time();
        
        return true;
    }
    
    /**
     * Set user data in session after successful login
     */
    public static function setUser($userId, $email, $name, $role, $token = null) {
        $_SESSION[SESSION_USER_ID_KEY] = $userId;
        $_SESSION[SESSION_USER_EMAIL_KEY] = $email;
        $_SESSION[SESSION_USER_NAME_KEY] = $name;
        $_SESSION[SESSION_USER_ROLE_KEY] = $role;
        if ($token) {
            $_SESSION[SESSION_AUTH_TOKEN_KEY] = $token;
        }
        $_SESSION['last_activity'] = time();
    }
    
    /**
     * Get user ID from session
     */
    public static function getUserId() {
        return $_SESSION[SESSION_USER_ID_KEY] ?? null;
    }
    
    /**
     * Get user email from session
     */
    public static function getUserEmail() {
        return $_SESSION[SESSION_USER_EMAIL_KEY] ?? null;
    }
    
    /**
     * Get user name from session
     */
    public static function getUserName() {
        return $_SESSION[SESSION_USER_NAME_KEY] ?? null;
    }
    
    /**
     * Get user role from session
     */
    public static function getUserRole() {
        return $_SESSION[SESSION_USER_ROLE_KEY] ?? null;
    }
    
    /**
     * Get authentication token from session
     */
    public static function getToken() {
        return $_SESSION[SESSION_AUTH_TOKEN_KEY] ?? null;
    }
    
    /**
     * Check if user is authenticated
     */
    public static function isAuthenticated() {
        return isset($_SESSION[SESSION_USER_ID_KEY]);
    }
    
    /**
     * Destroy session and clear data completely
     */
    public static function destroy() {
        // Clear all session variables
        $_SESSION = [];
        
        // Destroy the session
        if (session_status() === PHP_SESSION_ACTIVE) {
            // Delete session file if it exists
            $sessionFile = session_save_path() . '/sess_' . session_id();
            if (file_exists($sessionFile)) {
                @unlink($sessionFile);
            }
            
            session_destroy();
        }
        
        // Clear session cookie
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 3600,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }
    }
    
    /**
     * Redirect to login if not authenticated
     * Use this in protected pages
     */
    public static function requireLogin($redirect = true) {
        if (!self::isAuthenticated()) {
            if ($redirect) {
                header('Location: ' . LOGIN_PAGE);
                exit;
            }
            return false;
        }
        return true;
    }
    
    /**
     * Redirect to dashboard if already authenticated
     * Use this in login page to prevent double login
     */
    public static function redirectIfAuthenticated() {
        if (self::isAuthenticated()) {
            header('Location: ' . DASHBOARD_PAGE);
            exit;
        }
    }
}
?>
