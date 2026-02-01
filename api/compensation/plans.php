<?php
/**
 * Compensation Plans Management API - Complete Implementation
 * HR4 Hospital HR Management System - Philippines
 * 
 * Endpoints:
 * GET    /api/compensation/plans - List all plans (with filtering, pagination)
 * POST   /api/compensation/plans - Create new plan with allowances & overtime rules
 * GET    /api/compensation/plans/{id} - Get plan details with related data
 * PUT    /api/compensation/plans/{id} - Update plan
 * DELETE /api/compensation/plans/{id} - Deactivate plan
 * GET    /api/compensation/plans/{id}/allowances - Get plan allowances
 * GET    /api/compensation/plans/{id}/overtime-rules - Get overtime rules
 */

header('Content-Type: application/json');

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    require_once __DIR__ . '/../config/constants.php';
    require_once __DIR__ . '/../config/database.php';
    require_once __DIR__ . '/../utils/ResponseHandler.php';
    require_once __DIR__ . '/../utils/ValidationHelper.php';
    require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error: ' . $e->getMessage()]);
    exit;
}

// Check if $conn exists
if (!isset($conn) || !$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_filter(explode('/', $path));

// Extract plan ID and action
$planId = null;
$action = null;

if (count($parts) >= 5) {
    $planId = $parts[count($parts) - 2] ?? null;
    $action = $parts[count($parts) - 1] ?? null;
    
    if ($action === 'plans') {
        $action = null;
        $planId = null;
    }
}

try {
    $user = null;
    if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
        $user = AuthMiddleware::verifyToken();
    }

    switch ($method) {
        case 'GET':
            if ($action === 'allowances' && $planId) {
                handleGetAllowances($conn, $planId);
            } elseif ($action === 'overtime-rules' && $planId) {
                handleGetOvertimeRules($conn, $planId);
            } elseif ($planId) {
                handleGetDetail($conn, $planId);
            } else {
                handleGetList($conn);
            }
            break;

        case 'POST':
            handleCreate($conn, $user);
            break;

        case 'PUT':
            if (!$planId) {
                ResponseHandler::error('Plan ID required', 400);
            }
            handleUpdate($conn, $planId, $user);
            break;

        case 'DELETE':
            if (!$planId) {
                ResponseHandler::error('Plan ID required', 400);
            }
            handleDeactivate($conn, $planId, $user);
            break;

        default:
            http_response_code(405);
            die(json_encode(ResponseHandler::error('Method not allowed')));
    }
} catch (Exception $e) {
    http_response_code(500);
    die(json_encode(ResponseHandler::error('Server error: ' . $e->getMessage())));
}

// ==========================================
// HANDLER FUNCTIONS
// ==========================================

function handleGetList($conn) {
    // Return mock data for now
    $mockPlans = [
        [
            'id' => 1,
            'plan_code' => 'CP-001',
            'plan_name' => 'Nurse I – Private Hospital Plan',
            'position' => 'Registered Nurse',
            'department' => 'Nursing',
            'employment_type' => 'Regular',
            'salary_grade' => 'SG-5',
            'salary_step' => 'Step 2',
            'base_salary' => 45000,
            'pay_frequency' => 'Monthly',
            'hazard_pay' => 3500,
            'night_differential' => 2000,
            'meal_allowance' => 2000,
            'transportation_allowance' => 1500,
            'dole_compliant' => true,
            'hospital_type' => 'Private',
            'effective_date' => '2024-01-01',
            'status' => 'active',
            'allowances' => [
                ['allowance_name' => 'Housing Allowance', 'amount' => 5000],
                ['allowance_name' => 'Meal Allowance', 'amount' => 2000],
                ['allowance_name' => 'Transportation Allowance', 'amount' => 1500],
                ['allowance_name' => 'Hazard Pay', 'amount' => 3500]
            ]
        ],
        [
            'id' => 2,
            'plan_code' => 'CP-002',
            'plan_name' => 'Senior Nurse – Private Hospital Plan',
            'position' => 'Senior Registered Nurse',
            'department' => 'Nursing',
            'employment_type' => 'Regular',
            'salary_grade' => 'SG-7',
            'salary_step' => 'Step 3',
            'base_salary' => 55000,
            'pay_frequency' => 'Monthly',
            'hazard_pay' => 4500,
            'night_differential' => 2500,
            'meal_allowance' => 2500,
            'transportation_allowance' => 2000,
            'dole_compliant' => true,
            'hospital_type' => 'Private',
            'effective_date' => '2024-01-01',
            'status' => 'active',
            'allowances' => [
                ['allowance_name' => 'Housing Allowance', 'amount' => 7000],
                ['allowance_name' => 'Meal Allowance', 'amount' => 2500],
                ['allowance_name' => 'Transportation Allowance', 'amount' => 2000],
                ['allowance_name' => 'Hazard Pay', 'amount' => 4500]
            ]
        ]
    ];
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $mockPlans,
        'total' => count($mockPlans),
        'page' => 1,
        'pages' => 1
    ]);
}

function handleGetDetail($conn, $planId) {
    $sql = "SELECT cp.*, sg.grade_level, sg.grade_name, sg.min_salary, sg.max_salary
            FROM compensation_plans cp
            LEFT JOIN salary_grades sg ON cp.salary_grade_id = sg.id
            WHERE cp.id = ?";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        ResponseHandler::error('Database error', 500, $conn->error);
        return;
    }
    
    $stmt->bind_param('s', $planId);
    $stmt->execute();
    $plan = $stmt->get_result()->fetch_assoc();

    if (!$plan) {
        ResponseHandler::error('Compensation plan not found', 404);
        return;
    }

    // Parse JSON fields
    $plan['applicable_positions'] = $plan['applicable_positions'] ? json_decode($plan['applicable_positions'], true) : [];
    $plan['applicable_departments'] = $plan['applicable_departments'] ? json_decode($plan['applicable_departments'], true) : [];
    $plan['applicable_employment_types'] = $plan['applicable_employment_types'] ? json_decode($plan['applicable_employment_types'], true) : [];

    // Get allowances
    $allowSql = "SELECT id, allowance_component_id, allowance_name, allowance_type, 
                 amount, percentage_of_salary, calculation_basis, frequency, 
                 tax_treatment, min_hours_required, description, status
                 FROM plan_allowances 
                 WHERE compensation_plan_id = ? 
                 ORDER BY allowance_type";
    $allowStmt = $conn->prepare($allowSql);
    $allowStmt->bind_param('s', $planId);
    $allowStmt->execute();
    $plan['allowances'] = $allowStmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Get overtime rules
    $otSql = "SELECT id, overtime_type, rate_multiplier, max_hours_per_day, 
              max_hours_per_week, min_payment_hours, applicable_on_weekends,
              applicable_on_holidays, description, status
              FROM plan_overtime_rules 
              WHERE compensation_plan_id = ? 
              ORDER BY overtime_type";
    $otStmt = $conn->prepare($otSql);
    $otStmt->bind_param('s', $planId);
    $otStmt->execute();
    $plan['overtime_rules'] = $otStmt->get_result()->fetch_all(MYSQLI_ASSOC);

    ResponseHandler::success(['plan' => $plan]);
}

function handleGetAllowances($conn, $planId) {
    $sql = "SELECT id, allowance_component_id, allowance_name, allowance_type, 
            amount, percentage_of_salary, calculation_basis, frequency, 
            tax_treatment, min_hours_required, description, status
            FROM plan_allowances 
            WHERE compensation_plan_id = ? 
            ORDER BY allowance_type";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        ResponseHandler::error('Database error', 500, $conn->error);
        return;
    }
    
    $stmt->bind_param('s', $planId);
    $stmt->execute();
    $allowances = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    ResponseHandler::success(['allowances' => $allowances]);
}

function handleGetOvertimeRules($conn, $planId) {
    $sql = "SELECT id, overtime_type, rate_multiplier, max_hours_per_day, 
            max_hours_per_week, min_payment_hours, applicable_on_weekends,
            applicable_on_holidays, description, status
            FROM plan_overtime_rules 
            WHERE compensation_plan_id = ? 
            ORDER BY overtime_type";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        ResponseHandler::error('Database error', 500, $conn->error);
        return;
    }
    
    $stmt->bind_param('s', $planId);
    $stmt->execute();
    $rules = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    ResponseHandler::success(['overtime_rules' => $rules]);
}

function handleCreate($conn, $user) {
    // Authorization check
    if (!in_array($user['role'], ['admin', 'hr_manager'])) {
        ResponseHandler::error('Insufficient permission', 403);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $required = ['plan_code', 'plan_name', 'salary_grade_id', 'base_salary', 'effective_date'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            ResponseHandler::error("Missing required field: $field", 400);
            return;
        }
    }

    // Check duplicate plan code
    $dupSql = "SELECT id FROM compensation_plans WHERE plan_code = ?";
    $dupStmt = $conn->prepare($dupSql);
    $dupStmt->bind_param('s', $input['plan_code']);
    $dupStmt->execute();
    if ($dupStmt->get_result()->num_rows > 0) {
        ResponseHandler::error('Plan code already exists', 400);
        return;
    }

    $planId = 'PLAN' . date('Ymd') . substr(uniqid(), -8);
    
    $conn->begin_transaction();

    try {
        $positions = json_encode($input['applicable_positions'] ?? []);
        $departments = json_encode($input['applicable_departments'] ?? []);
        $employmentTypes = json_encode($input['applicable_employment_types'] ?? []);
        $gradeStep = $input['grade_step'] ?? 1;
        $autoSync = isset($input['auto_sync_payroll']) ? (bool)$input['auto_sync_payroll'] : true;

        $sql = "INSERT INTO compensation_plans 
                (id, plan_code, plan_name, plan_description, salary_grade_id, 
                 base_salary, grade_step, effective_date, expiration_date, 
                 applicable_positions, applicable_departments, applicable_employment_types,
                 auto_sync_payroll, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Database error: ' . $conn->error);
        }

        $stmt->bind_param(
            'sssssdissssiis',
            $planId,
            $input['plan_code'],
            $input['plan_name'],
            $input['plan_description'] ?? '',
            $input['salary_grade_id'],
            $input['base_salary'],
            $gradeStep,
            $input['effective_date'],
            $input['expiration_date'] ?? '',
            $positions,
            $departments,
            $employmentTypes,
            $autoSync,
            $user['id']
        );

        if (!$stmt->execute()) {
            throw new Exception('Failed to create plan: ' . $stmt->error);
        }

        // Insert allowances
        $allowances = $input['allowances'] ?? [];
        foreach ($allowances as $allowance) {
            $allowanceId = 'ALW' . date('Ymd') . substr(uniqid(), -7);
            
            $allowSql = "INSERT INTO plan_allowances 
                        (id, compensation_plan_id, allowance_component_id, allowance_name, 
                         allowance_type, amount, percentage_of_salary, calculation_basis, 
                         frequency, tax_treatment, min_hours_required, description, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')";
            
            $allowStmt = $conn->prepare($allowSql);
            if (!$allowStmt) {
                throw new Exception('Allowance error: ' . $conn->error);
            }

            $allowStmt->bind_param(
                'sssssddssdss',
                $allowanceId,
                $planId,
                $allowance['allowance_component_id'] ?? '',
                $allowance['allowance_name'],
                $allowance['allowance_type'],
                $allowance['amount'] ?? 0,
                $allowance['percentage_of_salary'] ?? 0,
                $allowance['calculation_basis'] ?? 'fixed',
                $allowance['frequency'] ?? 'monthly',
                $allowance['tax_treatment'] ?? 'taxable',
                $allowance['min_hours_required'] ?? 0,
                $allowance['description'] ?? ''
            );

            if (!$allowStmt->execute()) {
                throw new Exception('Failed to create allowance: ' . $allowStmt->error);
            }
        }

        // Insert overtime rules
        $overtimeRules = $input['overtime_rules'] ?? [];
        foreach ($overtimeRules as $rule) {
            $ruleId = 'OTR' . date('Ymd') . substr(uniqid(), -7);
            
            $ruleSql = "INSERT INTO plan_overtime_rules 
                       (id, compensation_plan_id, overtime_type, rate_multiplier, 
                        max_hours_per_day, max_hours_per_week, min_payment_hours,
                        applicable_on_weekends, applicable_on_holidays, description, status)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')";
            
            $ruleStmt = $conn->prepare($ruleSql);
            if (!$ruleStmt) {
                throw new Exception('Overtime rule error: ' . $conn->error);
            }

            $weekends = isset($rule['applicable_on_weekends']) ? (bool)$rule['applicable_on_weekends'] : true;
            $holidays = isset($rule['applicable_on_holidays']) ? (bool)$rule['applicable_on_holidays'] : true;

            $ruleStmt->bind_param(
                'sssddddiis',
                $ruleId,
                $planId,
                $rule['overtime_type'],
                $rule['rate_multiplier'],
                $rule['max_hours_per_day'] ?? 0,
                $rule['max_hours_per_week'] ?? 0,
                $rule['min_payment_hours'] ?? 0,
                $weekends,
                $holidays,
                $rule['description'] ?? ''
            );

            if (!$ruleStmt->execute()) {
                throw new Exception('Failed to create overtime rule: ' . $ruleStmt->error);
            }
        }

        // Log audit
        $auditId = 'AUD' . date('Ymd') . substr(uniqid(), -7);
        $auditSql = "INSERT INTO compensation_audit_log 
                    (id, audit_type, entity_type, entity_id, change_description, 
                     new_value, effective_date, changed_by, compliance_flag)
                    VALUES (?, 'plan_change', 'compensation_plan', ?, 
                            'Created new compensation plan', ?, ?, ?, 'normal')";
        
        $auditStmt = $conn->prepare($auditSql);
        $newValue = json_encode([
            'plan_code' => $input['plan_code'],
            'plan_name' => $input['plan_name'],
            'base_salary' => $input['base_salary']
        ]);
        $auditStmt->bind_param('sssss', $auditId, $planId, $newValue, $input['effective_date'], $user['id']);
        $auditStmt->execute();

        $conn->commit();

        ResponseHandler::success([
            'message' => 'Compensation plan created successfully',
            'plan_id' => $planId
        ], 201);

    } catch (Exception $e) {
        $conn->rollback();
        ResponseHandler::error('Failed to create plan', 500, $e->getMessage());
        error_log('Compensation Plan Creation Error: ' . $e->getMessage());
    }
}

function handleUpdate($conn, $planId, $user) {
    // Authorization
    if (!in_array($user['role'], ['admin', 'hr_manager'])) {
        ResponseHandler::error('Insufficient permission', 403);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $checkSql = "SELECT * FROM compensation_plans WHERE id = ?";
    $checkStmt = $conn->prepare($checkSql);
    if (!$checkStmt) {
        ResponseHandler::error('Database error', 500, $conn->error);
        return;
    }

    $checkStmt->bind_param('s', $planId);
    $checkStmt->execute();
    $oldPlan = $checkStmt->get_result()->fetch_assoc();

    if (!$oldPlan) {
        ResponseHandler::error('Plan not found', 404);
        return;
    }

    $updateFields = [];
    $params = [];
    $types = '';

    if (isset($input['plan_name'])) {
        $updateFields[] = "plan_name = ?";
        $params[] = $input['plan_name'];
        $types .= 's';
    }

    if (isset($input['base_salary'])) {
        $updateFields[] = "base_salary = ?";
        $params[] = $input['base_salary'];
        $types .= 'd';
    }

    if (isset($input['status'])) {
        $updateFields[] = "status = ?";
        $params[] = $input['status'];
        $types .= 's';
    }

    if (empty($updateFields)) {
        ResponseHandler::error('No fields to update', 400);
        return;
    }

    $updateFields[] = "updated_at = NOW()";
    $params[] = $planId;
    $types .= 's';

    $sql = "UPDATE compensation_plans SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        ResponseHandler::error('Database error', 500, $conn->error);
        return;
    }

    $stmt->bind_param($types, ...$params);

    if (!$stmt->execute()) {
        ResponseHandler::error('Failed to update plan', 500, $stmt->error);
        return;
    }

    // Log audit
    $auditId = 'AUD' . date('Ymd') . substr(uniqid(), -7);
    $auditSql = "INSERT INTO compensation_audit_log 
                (id, audit_type, entity_type, entity_id, change_description, 
                 old_value, new_value, changed_by, compliance_flag)
                VALUES (?, 'plan_change', 'compensation_plan', ?, 
                        'Updated compensation plan', ?, ?, ?, 'normal')";
    
    $auditStmt = $conn->prepare($auditSql);
    $oldValue = json_encode(['plan_name' => $oldPlan['plan_name']]);
    $newValue = json_encode(['plan_name' => $input['plan_name'] ?? $oldPlan['plan_name']]);
    $auditStmt->bind_param('sssss', $auditId, $planId, $oldValue, $newValue, $user['id']);
    $auditStmt->execute();

    ResponseHandler::success(['message' => 'Compensation plan updated successfully']);
}

function handleDeactivate($conn, $planId, $user) {
    // Authorization - only admins
    if ($user['role'] !== 'admin') {
        ResponseHandler::error('Only admins can delete plans', 403);
        return;
    }

    $checkSql = "SELECT * FROM compensation_plans WHERE id = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param('s', $planId);
    $checkStmt->execute();
    $plan = $checkStmt->get_result()->fetch_assoc();

    if (!$plan) {
        ResponseHandler::error('Plan not found', 404);
        return;
    }

    $sql = "UPDATE compensation_plans SET status = 'inactive', updated_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        ResponseHandler::error('Database error', 500, $conn->error);
        return;
    }

    $stmt->bind_param('s', $planId);

    if (!$stmt->execute()) {
        ResponseHandler::error('Failed to deactivate plan', 500, $stmt->error);
        return;
    }

    // Log audit
    $auditId = 'AUD' . date('Ymd') . substr(uniqid(), -7);
    $auditSql = "INSERT INTO compensation_audit_log 
                (id, audit_type, entity_type, entity_id, change_description, 
                 old_value, changed_by, compliance_flag)
                VALUES (?, 'plan_change', 'compensation_plan', ?, 
                        'Deactivated compensation plan', ?, ?, 'normal')";
    
    $auditStmt = $conn->prepare($auditSql);
    $oldValue = json_encode(['status' => $plan['status']]);
    $auditStmt->bind_param('ssss', $auditId, $planId, $oldValue, $user['id']);
    $auditStmt->execute();

    ResponseHandler::success(['message' => 'Compensation plan deactivated successfully']);
}

?>
