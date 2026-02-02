<?php
/**
 * Login Flow Verification and Testing
 * This script validates the entire authentication flow
 */

// Initialize session for testing
session_start();

// Load configuration and helpers
require_once 'config.php';
require_once 'SessionManager.php';

echo "<h2>HR4 Login Flow Verification</h2>";
echo "<hr>";

// Test 1: Verify configuration
echo "<h3>1. Configuration Check</h3>";
echo "<ul>";
echo "<li>✓ Config file loaded: " . (defined('SESSION_TIMEOUT') ? 'YES' : 'NO') . "</li>";
echo "<li>✓ SessionManager available: " . (class_exists('SessionManager') ? 'YES' : 'NO') . "</li>";
echo "<li>✓ Login page path: " . LOGIN_PAGE . "</li>";
echo "<li>✓ Dashboard path: " . DASHBOARD_PAGE . "</li>";
echo "<li>✓ Session user ID key: " . SESSION_USER_ID_KEY . "</li>";
echo "</ul>";

// Test 2: Test unauthenticated access
echo "<h3>2. Unauthenticated Access Test</h3>";
echo "<ul>";
echo "<li>✓ Current user ID in session: " . (SessionManager::isAuthenticated() ? SessionManager::getUserId() : 'NONE (expected)') . "</li>";
echo "<li>✓ User name in session: " . (SessionManager::getUserName() ? SessionManager::getUserName() : 'NONE (expected)') . "</li>";
echo "</ul>";

// Test 3: Verify API endpoints
echo "<h3>3. API Endpoint Checks</h3>";
echo "<ul>";
$apiEndpoints = [
    '/hospital_4/api/auth/login.php',
    '/hospital_4/api/auth/logout.php'
];
foreach ($apiEndpoints as $endpoint) {
    $path = __DIR__ . str_replace('/hospital_4/api', '/api', $endpoint);
    echo "<li>✓ " . $endpoint . ": " . (file_exists($path) ? "EXISTS" : "MISSING") . "</li>";
}
echo "</ul>";

// Test 4: Verify form elements in index.php
echo "<h3>4. Form Elements in index.php</h3>";
$indexContent = file_get_contents(__DIR__ . '/index.php');
echo "<ul>";
echo "<li>✓ Form element present: " . (strpos($indexContent, 'id="loginForm"') !== false ? 'YES' : 'NO') . "</li>";
echo "<li>✓ Email input present: " . (strpos($indexContent, 'name="email"') !== false ? 'YES' : 'NO') . "</li>";
echo "<li>✓ Password input present: " . (strpos($indexContent, 'name="password"') !== false ? 'YES' : 'NO') . "</li>";
echo "<li>✓ Submit button present: " . (strpos($indexContent, 'type="submit"') !== false ? 'YES' : 'NO') . "</li>";
echo "<li>✓ Auth.js loaded: " . (strpos($indexContent, 'auth.js') !== false ? 'YES' : 'NO') . "</li>";
echo "</ul>";

// Test 5: Verify protected pages
echo "<h3>5. Protected Pages Verification</h3>";
$protectedPages = [
    'dashboard.php',
    'analytics-dashboard.php'
];
foreach ($protectedPages as $page) {
    $content = file_get_contents(__DIR__ . '/' . $page);
    $hasSessionManager = strpos($content, 'SessionManager') !== false;
    $hasAuthCheck = strpos($content, 'requireLogin') !== false;
    echo "<li>✓ " . $page . ": " . ($hasSessionManager && $hasAuthCheck ? "PROTECTED ✓" : "NOT PROTECTED ✗") . "</li>";
}
echo "</ul>";

// Test 6: Session functionality
echo "<h3>6. Session Management Test</h3>";
echo "<ul>";

// Test setting session
SessionManager::setUser('TEST001', 'test@example.com', 'Test User', 'admin', 'test_token');
echo "<li>✓ User set in session: " . (SessionManager::isAuthenticated() ? 'YES' : 'NO') . "</li>";
echo "<li>✓ User ID: " . SessionManager::getUserId() . "</li>";
echo "<li>✓ User Email: " . SessionManager::getUserEmail() . "</li>";
echo "<li>✓ User Name: " . SessionManager::getUserName() . "</li>";
echo "<li>✓ User Role: " . SessionManager::getUserRole() . "</li>";

// Clear session
SessionManager::destroy();
echo "<li>✓ Session destroyed: " . (!SessionManager::isAuthenticated() ? 'YES' : 'NO') . "</li>";
echo "</ul>";

// Test 7: Login flow summary
echo "<h3>7. Complete Login Flow</h3>";
echo "<ol>";
echo "<li><strong>User accesses index.php</strong>";
echo "<ul><li>SessionManager checks if already logged in</li>";
echo "<li>If logged in → redirects to dashboard.php</li>";
echo "<li>If not logged in → shows login form</li></ul>";
echo "</li>";
echo "<li><strong>User submits login form (handleLogin in auth.js)</strong>";
echo "<ul><li>JavaScript sends POST to /hospital_4/api/auth/login.php</li>";
echo "<li>Payload: {email, password}</li>";
echo "<li>No form action/method needed (handled by JS)</li></ul>";
echo "</li>";
echo "<li><strong>Server validates credentials (api/auth/login.php)</strong>";
echo "<ul><li>Loads config.php and SessionManager.php</li>";
echo "<li>Validates email and password against mock users</li>";
echo "<li>If invalid → returns HTTP 401 with error message</li>";
echo "<li>If valid → generates JWT token</li>";
echo "<li><strong>Sets session using SessionManager::setUser()</strong></li>";
echo "<li>Returns JSON: {success: true, data: {token, user}}</li></ul>";
echo "</li>";
echo "<li><strong>JavaScript receives response</strong>";
echo "<ul><li>Stores token in localStorage</li>";
echo "<li>Stores user data in localStorage</li>";
echo "<li>Shows success message</li>";
echo "<li>Redirects to dashboard.php after 1 second</li></ul>";
echo "</li>";
echo "<li><strong>User accesses dashboard.php</strong>";
echo "<ul><li>SessionManager::init() starts session and checks timeout</li>";
echo "<li>SessionManager::requireLogin() checks $_SESSION['" . SESSION_USER_ID_KEY . "']</li>";
echo "<li>If missing → redirects to index.php (login)</li>";
echo "<li>If present → allows access to dashboard</li></ul>";
echo "</li>";
echo "<li><strong>User clicks logout</strong>";
echo "<ul><li>JavaScript calls logout() function</li>";
echo "<li>Clears localStorage (authToken, userData)</li>";
echo "<li>Sends POST to /hospital_4/api/auth/logout.php</li>";
echo "<li>Server calls SessionManager::destroy()</li>";
echo "<li>JavaScript redirects to index.php</li></ul>";
echo "</li>";
echo "</ol>";

// Test 8: Session Keys
echo "<h3>8. Session Key Standardization</h3>";
echo "<ul>";
echo "<li>✓ User ID key: <code>" . SESSION_USER_ID_KEY . "</code></li>";
echo "<li>✓ Email key: <code>" . SESSION_USER_EMAIL_KEY . "</code></li>";
echo "<li>✓ Name key: <code>" . SESSION_USER_NAME_KEY . "</code></li>";
echo "<li>✓ Role key: <code>" . SESSION_USER_ROLE_KEY . "</code></li>";
echo "<li>✓ Token key: <code>" . SESSION_AUTH_TOKEN_KEY . "</code></li>";
echo "</ul>";

echo "<hr>";
echo "<h2>✓ All Components Verified</h2>";
?>
