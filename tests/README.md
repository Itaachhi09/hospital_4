# HR4 API Integration Testing Framework

This folder contains automated tests for the modular API: contract tests between modules and integration tests for API communication.

## Structure

- **contract/** – Contract tests: verify that implementations satisfy shared interfaces (e.g. HRCoreClientInterface).
- **integration/** – Integration tests: call real API endpoints and assert responses (e.g. HR Core employee, Payroll compute).
- **bootstrap.php** – Loads API config and contracts for tests (adjust path if needed).

## Requirements

- PHP 7.4+ (or 8.x)
- Web server running HR4 API (e.g. XAMPP) for integration tests, or use `php -S` for local runs.
- Database `hr4_hospital` with schema applied for full integration tests.

## Running Tests

### Contract tests (no server required)

```bash
cd c:\xampp\htdocs
php tests/contract/test_hrcore_interface.php
```

### Integration tests (API must be reachable)

Set base URL if needed (default: `http://localhost/api`):

```bash
set API_BASE_URL=http://localhost/api
php tests/integration/test_hrcore_employees.php
php tests/integration/test_payroll_health.php
```

### Run all tests

```bash
php tests/run_all.php
```

## Adding Tests

- **Contract test:** Require interface and implementations; assert method signatures and return types (e.g. getEmployeeById returns EmployeeDTO or null).
- **Integration test:** Use cURL or file_get_contents to call GET/POST; assert HTTP status and JSON shape; use auth token if required.
- **Regression:** Reuse or extend Postman collection in `postman/` and run before deployment.

## CI

Run contract and integration tests in CI before deployment. For integration tests, use a staging API URL and test database.
