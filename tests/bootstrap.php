<?php
/**
 * Test bootstrap: load API config and contracts so tests can use interfaces/DTOs.
 * Adjust base path if tests are run from a different working directory.
 */

$apiRoot = dirname(__DIR__) . '/api';
if (!is_dir($apiRoot)) {
    $apiRoot = __DIR__ . '/../api';
}

define('API_ROOT', $apiRoot);
require_once API_ROOT . '/config/constants.php';
require_once API_ROOT . '/contracts/DTOs/EmployeeDTO.php';
require_once API_ROOT . '/contracts/DTOs/PayrollRunDTO.php';
require_once API_ROOT . '/contracts/Interfaces/HRCoreClientInterface.php';
require_once API_ROOT . '/contracts/Interfaces/EventDispatcherInterface.php';
require_once API_ROOT . '/contracts/Clients/HRCoreApiClient.php';
require_once API_ROOT . '/HRCORE/HRCoreLocalClient.php';
