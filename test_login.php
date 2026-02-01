<?php
/**
 * Test Login Endpoint
 */

// Simulate a login request
$ch = curl_init('http://localhost/hospital_4/api/auth/login.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'admin@hospital.com',
    'password' => 'admin123'
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: " . $httpCode . "\n";
echo "Response:\n";
echo $response . "\n";
echo "\nParsed:\n";
$decoded = json_decode($response, true);
var_dump($decoded);
?>
