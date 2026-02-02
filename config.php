<?php
/**
 * Application Configuration
 * Centralized configuration for session, redirects, and authentication
 */

// Define base configuration
define('APP_NAME', 'HR4 Hospital HR Management System');
define('APP_ROOT', dirname(__DIR__));
define('APP_URL', 'http://localhost/hospital_4');

// Session configuration
define('SESSION_TIMEOUT', 3600); // 1 hour
define('SESSION_USER_ID_KEY', 'user_id'); // Standard session key for user ID
define('SESSION_USER_EMAIL_KEY', 'user_email');
define('SESSION_USER_NAME_KEY', 'user_name');
define('SESSION_USER_ROLE_KEY', 'user_role');
define('SESSION_AUTH_TOKEN_KEY', 'auth_token');

// Redirect paths (relative to root)
define('LOGIN_PAGE', 'index.php');
define('DASHBOARD_PAGE', 'dashboard.php');
define('HOME_PAGE', 'home.php');
define('ANALYTICS_PAGE', 'analytics-dashboard.php');

// API configuration
define('API_BASE_URL', '/api');
define('JWT_SECRET', 'your-secret-key-change-this-in-production');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 3600); // 1 hour

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 0); // Never show errors to user, log them instead
ini_set('log_errors', 1);
ini_set('error_log', dirname(__DIR__) . '/logs/php-errors.log');

// Timezone
date_default_timezone_set('UTC');
?>
