<?php
/**
 * Application Constants
 * HR4 Hospital HR Management System
 */

// Application Settings
define('APP_NAME', 'HR4 Hospital HR Management System');
define('APP_VERSION', '1.0.0');
define('APP_ENV', 'development'); // development, staging, production

// API Settings
define('API_BASE_URL', 'http://localhost/hospital_4/api');
define('API_TIMEOUT', 30);

// JWT Settings
// SECURITY: In production, load JWT_SECRET from environment variable: $_ENV['JWT_SECRET'] ?? 'fallback'
define('JWT_SECRET', 'hr4_hospital_super_secret_jwt_key_2024_v1_change_this_in_production_env');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 86400); // 24 hours in seconds
define('JWT_REFRESH_EXPIRATION', 604800); // 7 days for refresh tokens

// Security
define('BCRYPT_ROUNDS', 12);

// CORS Settings
define('ALLOWED_ORIGINS', ['http://localhost:3000', 'http://localhost']);

// Pagination
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// File Upload
define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_FILE_TYPES', ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']);

// Roles
define('ROLE_ADMIN', 'admin');
define('ROLE_HR_MANAGER', 'hr_manager');
define('ROLE_EMPLOYEE', 'employee');
define('ROLE_PAYROLL', 'payroll_officer');
define('ROLE_FINANCE', 'finance_officer');

?>
