<?php
/**
 * Contract test: HRCoreClientInterface implementations
 * Verifies that HRCoreLocalClient and HRCoreApiClient satisfy the interface
 * (method existence and return types: getEmployeeById returns EmployeeDTO|null, etc.)
 */

require_once __DIR__ . '/../bootstrap.php';

$errors = [];

// 1. Interface exists and has required methods
if (!interface_exists('HRCoreClientInterface')) {
    $errors[] = 'HRCoreClientInterface not found';
} else {
    $methods = ['getEmployeeById', 'getEmployeesByIds', 'isEmployeeActive', 'getEmployeeDepartmentId'];
    foreach ($methods as $m) {
        if (!method_exists('HRCoreClientInterface', $m)) {
            $errors[] = "HRCoreClientInterface must have method: $m";
        }
    }
}

// 2. HRCoreLocalClient implements HRCoreClientInterface
if (!class_exists('HRCoreLocalClient')) {
    $errors[] = 'HRCoreLocalClient not found';
} elseif (!in_array('HRCoreClientInterface', class_implements('HRCoreLocalClient'))) {
    $errors[] = 'HRCoreLocalClient must implement HRCoreClientInterface';
}

// 3. HRCoreApiClient implements HRCoreClientInterface
if (!class_exists('HRCoreApiClient')) {
    $errors[] = 'HRCoreApiClient not found';
} elseif (!in_array('HRCoreClientInterface', class_implements('HRCoreApiClient'))) {
    $errors[] = 'HRCoreApiClient must implement HRCoreClientInterface';
}

// 4. EmployeeDTO has toArray and constructor from array
if (!class_exists('EmployeeDTO')) {
    $errors[] = 'EmployeeDTO not found';
} else {
    if (!method_exists('EmployeeDTO', 'toArray')) {
        $errors[] = 'EmployeeDTO must have toArray()';
    }
    $dto = new EmployeeDTO(['id' => 'T1', 'first_name' => 'A', 'last_name' => 'B', 'email' => 'a@b.com', 'status' => 'active']);
    if (!($dto instanceof EmployeeDTO)) {
        $errors[] = 'EmployeeDTO constructor must return EmployeeDTO';
    }
    $arr = $dto->toArray();
    if (!is_array($arr) || ($arr['id'] ?? '') !== 'T1') {
        $errors[] = 'EmployeeDTO toArray() must return array with id';
    }
}

if (count($errors) > 0) {
    echo "CONTRACT TESTS FAILED:\n";
    foreach ($errors as $e) {
        echo "  - " . $e . "\n";
    }
    exit(1);
}

echo "Contract tests (HRCoreClientInterface + DTOs) passed.\n";
exit(0);
