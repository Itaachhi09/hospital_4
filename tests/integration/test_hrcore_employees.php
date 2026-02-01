<?php
/**
 * Integration test: HR Core employees API
 * GET /api/v1/hrcore/employees (and optionally GET /api/v1/hrcore/employees/{id})
 * Asserts HTTP 200 and JSON shape; auth may be required.
 */

$baseUrl = getenv('API_BASE_URL') ?: 'http://localhost/hospital_4/api';
$url = rtrim($baseUrl, '/') . '/v1/hrcore/employees?page=1&pageSize=5';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$errors = [];
if ($httpCode !== 200 && $httpCode !== 401) {
    $errors[] = "Expected 200 or 401, got $httpCode";
}
$data = json_decode($response, true);
if ($data === null && $response !== '') {
    $errors[] = "Invalid JSON response";
}
if ($httpCode === 200 && is_array($data)) {
    if (!isset($data['success'])) {
        $errors[] = "Response must have 'success' field";
    }
    if (isset($data['data']) && !is_array($data['data']) && !is_array($data['pagination'] ?? null)) {
        // paginated list may have data array and pagination
        if (isset($data['data']) && !is_array($data['data'])) {
            $errors[] = "Response data must be array for list";
        }
    }
}

if (count($errors) > 0) {
    echo "INTEGRATION TEST (HR Core employees) FAILED:\n";
    foreach ($errors as $e) {
        echo "  - " . $e . "\n";
    }
    echo "Response (first 500 chars): " . substr($response, 0, 500) . "\n";
    exit(1);
}

echo "Integration test (HR Core employees) passed. HTTP $httpCode\n";
exit(0);
