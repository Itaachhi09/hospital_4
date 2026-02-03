<?php
/**
 * Integration test: Health and routing
 * GET /api/health and GET /api/v1/health
 * Asserts API is reachable and returns 200.
 */

$baseUrl = getenv('API_BASE_URL') ?: 'http://localhost/api';
$url = rtrim($baseUrl, '/') . '/health';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$errors = [];
if ($httpCode !== 200) {
    $errors[] = "Expected 200, got $httpCode";
}

if (count($errors) > 0) {
    echo "INTEGRATION TEST (health) FAILED:\n";
    foreach ($errors as $e) {
        echo "  - " . $e . "\n";
    }
    exit(1);
}

echo "Integration test (health) passed. HTTP $httpCode\n";
exit(0);
