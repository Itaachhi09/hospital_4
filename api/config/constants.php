<?php
/**
 * Application Constants
 * HR4 Hospital HR Management System
 */

// Application Settings
if (!defined('APP_NAME')) define('APP_NAME', 'HR4 Hospital HR Management System');
if (!defined('APP_VERSION')) define('APP_VERSION', '1.0.0');
if (!defined('APP_ENV')) define('APP_ENV', 'development'); // development, staging, production

// API Settings
if (!defined('API_BASE_URL')) define('API_BASE_URL', 'http://localhost/api');
if (!defined('API_TIMEOUT')) define('API_TIMEOUT', 30);

// JWT Settings
// SECURITY: In production, load JWT_SECRET from environment variable: $_ENV['JWT_SECRET'] ?? 'fallback'
if (!defined('JWT_SECRET')) define('JWT_SECRET', 'hr4_hospital_super_secret_jwt_key_2024_v1_change_this_in_production_env');
if (!defined('JWT_ALGORITHM')) define('JWT_ALGORITHM', 'HS256');
if (!defined('JWT_EXPIRATION')) define('JWT_EXPIRATION', 86400); // 24 hours in seconds
if (!defined('JWT_REFRESH_EXPIRATION')) define('JWT_REFRESH_EXPIRATION', 604800); // 7 days for refresh tokens

// Security
if (!defined('BCRYPT_ROUNDS')) define('BCRYPT_ROUNDS', 12);

// CORS Settings
if (!defined('ALLOWED_ORIGINS')) define('ALLOWED_ORIGINS', ['http://localhost:3000', 'http://localhost']);

// Pagination
if (!defined('DEFAULT_PAGE_SIZE')) define('DEFAULT_PAGE_SIZE', 20);
if (!defined('MAX_PAGE_SIZE')) define('MAX_PAGE_SIZE', 100);

// File Upload
if (!defined('MAX_UPLOAD_SIZE')) define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024); // 10MB
if (!defined('ALLOWED_FILE_TYPES')) define('ALLOWED_FILE_TYPES', ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']);

// Roles
if (!defined('ROLE_ADMIN')) define('ROLE_ADMIN', 'admin');
if (!defined('ROLE_HR_MANAGER')) define('ROLE_HR_MANAGER', 'hr_manager');
if (!defined('ROLE_EMPLOYEE')) define('ROLE_EMPLOYEE', 'employee');
if (!defined('ROLE_PAYROLL')) define('ROLE_PAYROLL', 'payroll_officer');
if (!defined('ROLE_FINANCE')) define('ROLE_FINANCE', 'finance_officer');

?>
