<?php
/**
 * Run all tests: contract tests first, then integration tests.
 * Exit code 0 if all pass, 1 if any fail.
 */

$root = dirname(__DIR__);
$contractDir = $root . '/tests/contract';
$integrationDir = $root . '/tests/integration';

$failed = 0;

// Contract tests
echo "Running contract tests...\n";
passthru('php "' . $contractDir . '/test_hrcore_interface.php"', $code);
if ($code !== 0) {
    $failed++;
}

// Integration tests (require API to be up)
echo "\nRunning integration tests...\n";
passthru('php "' . $integrationDir . '/test_payroll_health.php"', $code);
if ($code !== 0) {
    $failed++;
}
passthru('php "' . $integrationDir . '/test_hrcore_employees.php"', $code);
if ($code !== 0) {
    $failed++;
}

echo "\n";
if ($failed > 0) {
    echo "Some tests failed ($failed).\n";
    exit(1);
}
echo "All tests passed.\n";
exit(0);
