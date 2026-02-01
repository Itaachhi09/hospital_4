<?php
/**
 * Test Analytics API
 * Run from command line: php test_analytics_api.php
 */

// Simulate the API request
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/hospital_4/api/v1/analytics/dashboard';

// Change to API directory
chdir(__DIR__ . '/api/analytics');

// Include the API
require_once 'analytics-enhanced.php';
?>
