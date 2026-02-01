-- ==========================================
-- COMPENSATION MODULE - COMPLETE SCHEMA
-- HR4 Hospital HR Management System (Philippines)
-- Date: January 31, 2026
-- Version: 1.0
-- ==========================================

USE hr4_hospital;

-- ==========================================
-- 1. COMPENSATION PLANS SUBMODULE
-- ==========================================

-- Main compensation plan definitions
CREATE TABLE IF NOT EXISTS compensation_plans (
    id VARCHAR(20) PRIMARY KEY,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    plan_name VARCHAR(255) NOT NULL,
    plan_description TEXT,
    applicable_positions JSON,
    applicable_departments JSON,
    applicable_employment_types JSON,
    salary_grade_id VARCHAR(20),
    base_salary DECIMAL(12, 2),
    grade_step INT DEFAULT 1,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    auto_sync_payroll BOOLEAN DEFAULT TRUE,
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salary_grade_id) REFERENCES salary_grades(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_plan_code (plan_code),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Allowances within compensation plans
CREATE TABLE IF NOT EXISTS plan_allowances (
    id VARCHAR(20) PRIMARY KEY,
    compensation_plan_id VARCHAR(20) NOT NULL,
    allowance_component_id VARCHAR(20),
    allowance_name VARCHAR(100) NOT NULL,
    allowance_type ENUM('hazard_pay', 'meal', 'transportation', 'shift_differential', 'night_differential', 'on_call', 'rice_subsidy', 'uniform', 'other') NOT NULL,
    amount DECIMAL(12, 2),
    percentage_of_salary DECIMAL(5, 2),
    calculation_basis ENUM('fixed', 'percentage', 'daily_rate', 'hourly_rate') DEFAULT 'fixed',
    frequency ENUM('monthly', 'daily', 'per_shift', 'one_time') DEFAULT 'monthly',
    tax_treatment ENUM('taxable', 'non_taxable') DEFAULT 'taxable',
    min_hours_required DECIMAL(5, 2),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (compensation_plan_id) REFERENCES compensation_plans(id),
    FOREIGN KEY (allowance_component_id) REFERENCES allowance_components(id),
    INDEX idx_compensation_plan_id (compensation_plan_id),
    INDEX idx_allowance_type (allowance_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Overtime rules within compensation plans
CREATE TABLE IF NOT EXISTS plan_overtime_rules (
    id VARCHAR(20) PRIMARY KEY,
    compensation_plan_id VARCHAR(20) NOT NULL,
    overtime_type ENUM('regular', 'holiday', 'night', 'special') NOT NULL,
    rate_multiplier DECIMAL(3, 2) NOT NULL,
    max_hours_per_day DECIMAL(5, 2),
    max_hours_per_week DECIMAL(5, 2),
    min_payment_hours DECIMAL(5, 2),
    applicable_on_weekends BOOLEAN DEFAULT TRUE,
    applicable_on_holidays BOOLEAN DEFAULT TRUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (compensation_plan_id) REFERENCES compensation_plans(id),
    INDEX idx_compensation_plan_id (compensation_plan_id),
    INDEX idx_overtime_type (overtime_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. SALARY ADJUSTMENTS SUBMODULE
-- ==========================================

-- Salary adjustment requests with approval workflow
CREATE TABLE IF NOT EXISTS salary_adjustments (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    adjustment_type ENUM('annual_increase', 'promotion_adjustment', 'cola', 'merit_increase', 'market_adjustment', 'correction', 'other') NOT NULL,
    adjustment_code VARCHAR(50) NOT NULL UNIQUE,
    current_salary DECIMAL(12, 2) NOT NULL,
    adjustment_amount DECIMAL(12, 2),
    adjustment_percentage DECIMAL(5, 2),
    new_salary DECIMAL(12, 2) NOT NULL,
    effective_date DATE NOT NULL,
    reason TEXT,
    justification TEXT,
    promotion_from_position VARCHAR(100),
    promotion_to_position VARCHAR(100),
    approval_status ENUM('draft', 'submitted', 'hr_approved', 'finance_approved', 'admin_approved', 'rejected', 'cancelled') DEFAULT 'draft',
    approval_notes TEXT,
    requested_by VARCHAR(20) NOT NULL,
    requested_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    hr_approver_id VARCHAR(20),
    hr_approval_date DATETIME,
    finance_approver_id VARCHAR(20),
    finance_approval_date DATETIME,
    admin_approver_id VARCHAR(20),
    admin_approval_date DATETIME,
    payroll_recalculation_triggered BOOLEAN DEFAULT FALSE,
    payroll_run_id VARCHAR(20),
    status ENUM('active', 'inactive', 'reversed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (hr_approver_id) REFERENCES users(id),
    FOREIGN KEY (finance_approver_id) REFERENCES users(id),
    FOREIGN KEY (admin_approver_id) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_adjustment_code (adjustment_code),
    INDEX idx_adjustment_type (adjustment_type),
    INDEX idx_approval_status (approval_status),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Salary adjustment history (audit trail)
CREATE TABLE IF NOT EXISTS salary_adjustment_history (
    id VARCHAR(20) PRIMARY KEY,
    salary_adjustment_id VARCHAR(20) NOT NULL,
    change_event ENUM('created', 'submitted', 'hr_review', 'finance_review', 'admin_review', 'approved', 'rejected', 'cancelled', 'reversed') NOT NULL,
    previous_status VARCHAR(100),
    new_status VARCHAR(100),
    old_data JSON,
    new_data JSON,
    changed_by VARCHAR(20),
    change_reason TEXT,
    change_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (salary_adjustment_id) REFERENCES salary_adjustments(id),
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_salary_adjustment_id (salary_adjustment_id),
    INDEX idx_change_event (change_event),
    INDEX idx_change_timestamp (change_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. INCENTIVES SUBMODULE
-- ==========================================

-- Incentive types definition
CREATE TABLE IF NOT EXISTS incentive_types (
    id VARCHAR(20) PRIMARY KEY,
    incentive_code VARCHAR(50) NOT NULL UNIQUE,
    incentive_name VARCHAR(100) NOT NULL,
    incentive_category ENUM('performance_bonus', 'holiday_pay', 'hazard_incentive', 'loyalty_incentive', 'productivity_bonus', 'attendance_bonus', 'safety_bonus', 'customer_service_bonus', 'other') NOT NULL,
    description TEXT,
    incentive_value_type ENUM('fixed_amount', 'percentage_of_salary', 'tiered_amount', 'formula_based') DEFAULT 'fixed_amount',
    taxable_status ENUM('taxable', 'non_taxable') DEFAULT 'taxable',
    frequency ENUM('one_time', 'monthly', 'quarterly', 'semi_annual', 'annual', 'on_event') DEFAULT 'one_time',
    applicable_employee_types JSON,
    applicable_grades JSON,
    min_months_employed INT DEFAULT 0,
    condition_required BOOLEAN DEFAULT FALSE,
    condition_description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_incentive_code (incentive_code),
    INDEX idx_incentive_category (incentive_category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Incentive configuration per employee or group
CREATE TABLE IF NOT EXISTS incentives (
    id VARCHAR(20) PRIMARY KEY,
    incentive_type_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20),
    department_id VARCHAR(20),
    position_id VARCHAR(20),
    incentive_amount DECIMAL(12, 2),
    incentive_percentage DECIMAL(5, 2),
    incentive_formula VARCHAR(255),
    effective_date DATE NOT NULL,
    end_date DATE,
    linked_metrics JSON,
    performance_threshold DECIMAL(5, 2),
    target_value DECIMAL(12, 2),
    one_time_or_recurring ENUM('one_time', 'recurring') DEFAULT 'one_time',
    distribution_date DATE,
    distribution_status ENUM('pending', 'approved', 'paid', 'voided') DEFAULT 'pending',
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(20),
    approved_date DATETIME,
    reason_for_incentive TEXT,
    status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (incentive_type_id) REFERENCES incentive_types(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_incentive_type_id (incentive_type_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_approval_status (approval_status),
    INDEX idx_distribution_status (distribution_status),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Incentive distribution tracking
CREATE TABLE IF NOT EXISTS incentive_distributions (
    id VARCHAR(20) PRIMARY KEY,
    incentive_id VARCHAR(20) NOT NULL,
    distribution_date DATE NOT NULL,
    distribution_amount DECIMAL(12, 2),
    payment_method ENUM('bank_transfer', 'check', 'cash', 'payroll_deduction') DEFAULT 'bank_transfer',
    payment_reference VARCHAR(100),
    included_in_payroll_run_id VARCHAR(20),
    distribution_status ENUM('pending', 'processed', 'paid', 'voided') DEFAULT 'pending',
    paid_date DATE,
    approved_by VARCHAR(20),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (incentive_id) REFERENCES incentives(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_incentive_id (incentive_id),
    INDEX idx_distribution_date (distribution_date),
    INDEX idx_distribution_status (distribution_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. PAY BONDS SUBMODULE
-- ==========================================

-- Pay bond types (Training, Scholarship, Contractual, etc.)
CREATE TABLE IF NOT EXISTS bond_types (
    id VARCHAR(20) PRIMARY KEY,
    bond_code VARCHAR(50) NOT NULL UNIQUE,
    bond_name VARCHAR(100) NOT NULL,
    bond_category ENUM('training_bond', 'scholarship_bond', 'contractual_bond', 'equipment_bond', 'advance_salary_bond', 'other') NOT NULL,
    description TEXT,
    default_duration_months INT,
    early_termination_penalty DECIMAL(12, 2),
    early_termination_percentage DECIMAL(5, 2),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_bond_code (bond_code),
    INDEX idx_bond_category (bond_category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee pay bonds
CREATE TABLE IF NOT EXISTS pay_bonds (
    id VARCHAR(20) PRIMARY KEY,
    bond_code VARCHAR(50) NOT NULL UNIQUE,
    employee_id VARCHAR(20) NOT NULL,
    bond_type_id VARCHAR(20) NOT NULL,
    bond_amount DECIMAL(12, 2) NOT NULL,
    bond_start_date DATE NOT NULL,
    bond_end_date DATE NOT NULL,
    bond_duration_months INT,
    duration_unit ENUM('months', 'years') DEFAULT 'months',
    bond_purpose TEXT,
    approved_by VARCHAR(20),
    approved_date DATETIME,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    monthly_deduction_amount DECIMAL(12, 2),
    deduction_method ENUM('fixed_amount', 'percentage_of_salary') DEFAULT 'fixed_amount',
    remaining_balance DECIMAL(12, 2),
    total_deducted DECIMAL(12, 2) DEFAULT 0,
    deduction_count INT DEFAULT 0,
    bond_status ENUM('active', 'completed', 'voided', 'terminated', 'on_hold') DEFAULT 'active',
    termination_date DATE,
    termination_reason TEXT,
    early_termination_invoked BOOLEAN DEFAULT FALSE,
    early_termination_penalty_applied DECIMAL(12, 2),
    early_termination_date DATE,
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (bond_type_id) REFERENCES bond_types(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_bond_code (bond_code),
    INDEX idx_employee_id (employee_id),
    INDEX idx_bond_type_id (bond_type_id),
    INDEX idx_bond_status (bond_status),
    INDEX idx_bond_start_date (bond_start_date),
    INDEX idx_bond_end_date (bond_end_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bond deduction schedule tracking
CREATE TABLE IF NOT EXISTS bond_deductions (
    id VARCHAR(20) PRIMARY KEY,
    pay_bond_id VARCHAR(20) NOT NULL,
    deduction_date DATE NOT NULL,
    deduction_amount DECIMAL(12, 2) NOT NULL,
    deduction_status ENUM('scheduled', 'pending', 'processed', 'failed', 'voided') DEFAULT 'scheduled',
    payroll_run_id VARCHAR(20),
    included_in_payroll BOOLEAN DEFAULT FALSE,
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    paid_date DATE,
    remaining_balance DECIMAL(12, 2),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pay_bond_id) REFERENCES pay_bonds(id),
    INDEX idx_pay_bond_id (pay_bond_id),
    INDEX idx_deduction_date (deduction_date),
    INDEX idx_deduction_status (deduction_status),
    INDEX idx_included_in_payroll (included_in_payroll)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- COMPENSATION AUDIT & COMPLIANCE TABLES
-- ==========================================

-- Comprehensive compensation change audit trail
CREATE TABLE IF NOT EXISTS compensation_audit_log (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20),
    audit_type ENUM('salary_change', 'allowance_change', 'deduction_change', 'plan_change', 'adjustment_change', 'incentive_change', 'bond_change', 'approval_change') NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(20),
    change_description TEXT,
    old_value JSON,
    new_value JSON,
    effective_date DATE,
    changed_by VARCHAR(20),
    change_reason TEXT,
    approval_id VARCHAR(20),
    compliance_flag ENUM('dole_compliant', 'bir_compliant', 'sss_compliant', 'philhealth_compliant', 'pagibig_compliant', 'flagged', 'normal') DEFAULT 'normal',
    compliance_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_audit_type (audit_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_compliance_flag (compliance_flag),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compensation compliance checklist
CREATE TABLE IF NOT EXISTS compensation_compliance_checks (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20),
    check_type ENUM('minimum_wage_check', 'wage_order_check', 'overtime_computation_check', 'deduction_limit_check', 'tax_computation_check', 'government_contribution_check', 'bond_compliance_check') NOT NULL,
    check_date DATE NOT NULL,
    check_result ENUM('passed', 'failed', 'warning', 'review_needed') DEFAULT 'passed',
    details JSON,
    corrective_action_required BOOLEAN DEFAULT FALSE,
    corrective_action_description TEXT,
    resolved_date DATE,
    resolved_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_check_type (check_type),
    INDEX idx_check_date (check_date),
    INDEX idx_check_result (check_result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==========================================
-- Additional composite indexes for common queries
ALTER TABLE compensation_plans ADD INDEX idx_grade_effective (salary_grade_id, effective_date);
ALTER TABLE salary_adjustments ADD INDEX idx_employee_effective (employee_id, effective_date);
ALTER TABLE pay_bonds ADD INDEX idx_employee_active (employee_id, bond_status);

-- ==========================================
-- CONSTRAINTS & TRIGGERS (Optional - Database specific)
-- ==========================================

-- Constraint: Ensure salary adjustment new_salary is different from current_salary
ALTER TABLE salary_adjustments ADD CONSTRAINT check_salary_different CHECK (new_salary <> current_salary);

-- Constraint: Ensure new_salary is positive
ALTER TABLE salary_adjustments ADD CONSTRAINT check_positive_salary CHECK (new_salary > 0);

-- Constraint: Ensure bond end date is after start date
ALTER TABLE pay_bonds ADD CONSTRAINT check_bond_dates CHECK (bond_end_date > bond_start_date);

-- Constraint: Ensure effective date is not in the past for new records
ALTER TABLE compensation_plans ADD CONSTRAINT check_future_effective_date CHECK (effective_date >= CURDATE());

-- ==========================================
-- COMPLETION STATUS
-- ==========================================
-- All four submodules have been created:
-- 1. Compensation Plans - with allowances and overtime rules
-- 2. Salary Adjustments - with multi-level approval workflow
-- 3. Incentives - with distribution tracking
-- 4. Pay Bonds - with deduction schedule tracking
-- 
-- Audit and compliance tables included for Philippine compliance
-- Ready for API and UI implementation
-- ==========================================
