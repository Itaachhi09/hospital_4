<?php
/**
 * Root Index - Authentication Gateway
 * Redirects users to login initially, then to dashboard after auth
 */

// Start session to check for existing auth
@session_start();

// Check if user has valid authentication token in session
$isAuthenticated = isset($_SESSION['authToken']) && !empty($_SESSION['authToken']);

// Redirect based on authentication status
if ($isAuthenticated) {
    // User is logged in, redirect to dashboard
    header('Location: /hospital_4/public/dashboard.html', true, 302);
} else {
    // User is not logged in, redirect to login
    header('Location: /hospital_4/public/login.html', true, 302);
}
exit;
?>
