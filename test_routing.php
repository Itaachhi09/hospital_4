<?php
// Quick test to verify analytics routing works
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Test the routing logic
$test_paths = [
    '/hospital_4/api/analytics/analytics.php',
    '/hospital_4/api/analytics',
    '/hospital_4/api/analytics/analytics',
    '/hospital_4/api/v1/analytics/dashboard',
];

$routes = [
    'analytics' => 'analytics/analytics.php',
    'analytics/analytics' => 'analytics/analytics.php',
    'v1/analytics/dashboard' => 'analytics/analytics.php',
];

foreach ($test_paths as $fullPath) {
    $path = parse_url($fullPath, PHP_URL_PATH);
    $path = str_replace('/hospital_4/api', '', $path);
    $path = trim($path, '/');
    
    // Remove .php extension if present
    if (substr($path, -4) === '.php') {
        $path = substr($path, 0, -4);
    }
    
    $matches = isset($routes[$path]);
    $route_file = $matches ? $routes[$path] : 'NOT FOUND';
    
    echo "$fullPath\n";
    echo "  -> Parsed path: $path\n";
    echo "  -> Matches route: " . ($matches ? 'YES' : 'NO') . "\n";
    echo "  -> Routes to: $route_file\n\n";
}
?>
