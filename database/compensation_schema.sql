-- ==========================================
-- COMPENSATION MODULE - Hospital HR4
-- Philippine Hospital Compensation Standards
-- ==========================================

USE hr4_hospital;

-- ==========================================
-- 1. COMPENSATION PLANS
-- ==========================================

-- Compensation Plan Master
CREATE TABLE IF NOT EXISTS compensation_plans (
    id VARCHAR(20) PRIMARY KEY,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    plan_name VARCHAR(255) NOT NULL,
    description TEXT,
    salary_grade_id VARCHAR(20),
    employment_type ENUM('regular', 'contractual', 'casual', 'job_order') DEFAULT 'regular',
    applicable_positions JSON,
    applicable_departments JSON,
    base_salary DECIMAL(12, 2) NOT NULL,
    daily_rate DECIMAL(10, 2),
    hourly_rate DECIMAL(10, 2),
    created_by VARCHAR(20),
    effective_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salary_grade_id) REFERENCES salary_grades(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_plan_code (plan_code),
    INDEX idx_employment_type (employment_type),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compensation Plan Allowances
CREATE TABLE IF NOT EXISTS compensation_plan_allowances (
    id VARCHAR(20) PRIMARY KEY,
    plan_id VARCHAR(20) NOT NULL,
    allowance_name VARCHAR(100) NOT NULL,
    allowance_type ENUM('hazard_pay', 'meal', 'transportation', 'night_differential', 'shift_differential', 'on_call', 'rice_subsidy', 'other') NOT NULL,
    amount DECIMAL(12, 2),
    percentage DECIMAL(5, 2),
    calculation_basis ENUM('fixed', 'percentage', 'daily_rate') DEFAULT 'fixed',
    frequency ENUM('monthly', 'daily', 'per_shift', 'one_time') DEFAULT 'monthly',
    is_taxable BOOLEAN DEFAULT FALSE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES compensation_plans(id) ON DELETE CASCADE,
    INDEX idx_plan_id (plan_id),
    INDEX idx_allowance_type (allowance_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compensation Plan Deductions
CREATE TABLE IF NOT EXISTS compensation_plan_deductions (
    id VARCHAR(20) PRIMARY KEY,
    plan_id VARCHAR(20) NOT NULL,
    deduction_name VARCHAR(100) NOT NULL,
    deduction_type ENUM('sss', 'philhealth', 'pag_ibig', 'tax_withholding', 'insurance', 'union', 'loan', 'other') NOT NULL,
    amount DECIMAL(12, 2),
    percentage DECIMAL(5, 2),
    calculation_basis ENUM('fixed', 'percentage') DEFAULT 'fixed',
    is_mandatory BOOLEAN DEFAULT FALSE,
    max_deduction DECIMAL(12, 2),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES compensation_plans(id) ON DELETE CASCADE,
    INDEX idx_plan_id (plan_id),
    INDEX idx_deduction_type (deduction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Plan Assignment
CREATE TABLE IF NOT EXISTS employee_compensation_assignments (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    plan_id VARCHAR(20) NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    approved_by VARCHAR(20),
    approved_date DATETIME,
    notes TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (plan_id) REFERENCES compensation_plans(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_effective_date (effective_date),
    UNIQUE KEY unique_employee_plan (employee_id, plan_id, effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. SALARY ADJUSTMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS salary_adjustments (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    adjustment_type ENUM('increase', 'decrease', 'promotion', 'demotion', 'cola', 'merit_increase', 'other') NOT NULL,
    current_salary DECIMAL(12, 2) NOT NULL,
    new_salary DECIMAL(12, 2) NOT NULL,
    amount_adjusted DECIMAL(12, 2) NOT NULL,
    percentage_change DECIMAL(5, 2),
    effective_date DATE NOT NULL,
    reason TEXT,
    requested_by VARCHAR(20),
    approval_status ENUM('pending', 'hr_approved', 'finance_approved', 'rejected') DEFAULT 'pending',
    approved_by_hr VARCHAR(20),
    hr_approval_date DATETIME,
    approved_by_finance VARCHAR(20),
    finance_approval_date DATETIME,
    final_approved_by VARCHAR(20),
    final_approval_date DATETIME,
    rejection_reason TEXT,
    payroll_impact_preview JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by_hr) REFERENCES users(id),
    FOREIGN KEY (approved_by_finance) REFERENCES users(id),
    FOREIGN KEY (final_approved_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_adjustment_type (adjustment_type),
    INDEX idx_effective_date (effective_date),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Salary Adjustment History (Audit Trail)
CREATE TABLE IF NOT EXISTS salary_adjustment_history (
    id VARCHAR(20) PRIMARY KEY,
    adjustment_id VARCHAR(20) NOT NULL,
    event_type ENUM('created', 'updated', 'approved', 'rejected', 'implemented') NOT NULL,
    changed_by VARCHAR(20),
    old_values JSON,
    new_values JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adjustment_id) REFERENCES salary_adjustments(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_adjustment_id (adjustment_id),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. INCENTIVES
-- ==========================================

CREATE TABLE IF NOT EXISTS incentive_types (
    id VARCHAR(20) PRIMARY KEY,
    incentive_code VARCHAR(50) NOT NULL UNIQUE,
    incentive_name VARCHAR(100) NOT NULL,
    category ENUM('performance_bonus', 'holiday_pay', 'hazard_incentive', 'loyalty_bonus', 'attendance_bonus', 'productivity_bonus', 'other') NOT NULL,
    description TEXT,
    is_taxable BOOLEAN DEFAULT TRUE,
    basis_type ENUM('fixed', 'percentage', 'tiered', 'metric_based') DEFAULT 'fixed',
    frequency ENUM('monthly', 'quarterly', 'annual', 'one_time', 'ad_hoc') DEFAULT 'annual',
    requires_approval BOOLEAN DEFAULT TRUE,
    applicable_employee_types JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_incentive_code (incentive_code),
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Incentive Issuance
CREATE TABLE IF NOT EXISTS incentive_issuances (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    incentive_type_id VARCHAR(20) NOT NULL,
    issuance_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    period_covered_start DATE,
    period_covered_end DATE,
    basis_metric TEXT,
    approval_status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
    approved_by VARCHAR(20),
    approval_date DATETIME,
    rejection_reason TEXT,
    deduction_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (incentive_type_id) REFERENCES incentive_types(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_incentive_type_id (incentive_type_id),
    INDEX idx_issuance_date (issuance_date),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. PAY BONDS
-- ==========================================

CREATE TABLE IF NOT EXISTS pay_bonds (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    bond_type ENUM('training_bond', 'scholarship_bond', 'contractual_bond', 'relocation_bond', 'other') NOT NULL,
    bond_amount DECIMAL(12, 2) NOT NULL,
    currency ENUM('PHP', 'USD') DEFAULT 'PHP',
    bond_start_date DATE NOT NULL,
    bond_end_date DATE NOT NULL,
    remaining_duration_months INT,
    monthly_deduction DECIMAL(12, 2),
    total_deducted DECIMAL(12, 2) DEFAULT 0,
    remaining_balance DECIMAL(12, 2),
    early_termination_penalty DECIMAL(12, 2),
    deduction_schedule ENUM('monthly', 'bi_weekly', 'per_payroll') DEFAULT 'monthly',
    reason TEXT,
    issued_by VARCHAR(20),
    approval_status ENUM('pending', 'approved', 'rejected', 'active', 'completed', 'terminated') DEFAULT 'pending',
    approved_date DATETIME,
    status ENUM('active', 'completed', 'terminated', 'defaulted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (issued_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_bond_type (bond_type),
    INDEX idx_bond_end_date (bond_end_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pay Bond Deduction Schedule
CREATE TABLE IF NOT EXISTS pay_bond_deductions (
    id VARCHAR(20) PRIMARY KEY,
    bond_id VARCHAR(20) NOT NULL,
    payroll_period_date DATE NOT NULL,
    scheduled_deduction DECIMAL(12, 2),
    actual_deduction DECIMAL(12, 2),
    balance_after_deduction DECIMAL(12, 2),
    deduction_status ENUM('pending', 'deducted', 'waived', 'failed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bond_id) REFERENCES pay_bonds(id) ON DELETE CASCADE,
    INDEX idx_bond_id (bond_id),
    INDEX idx_payroll_period_date (payroll_period_date),
    INDEX idx_deduction_status (deduction_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- COMPENSATION AUDIT & TRACKING
-- ==========================================

CREATE TABLE IF NOT EXISTS compensation_audit_log (
    id VARCHAR(20) PRIMARY KEY,
    action_type ENUM('plan_created', 'plan_updated', 'plan_deleted', 'employee_assigned', 'salary_adjusted', 'incentive_issued', 'bond_created', 'bond_deducted') NOT NULL,
    entity_type ENUM('plan', 'assignment', 'adjustment', 'incentive', 'bond') NOT NULL,
    entity_id VARCHAR(20),
    employee_id VARCHAR(20),
    changed_by VARCHAR(20),
    old_values JSON,
    new_values JSON,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SAMPLE DATA - Compensation Plans
-- ==========================================

INSERT INTO compensation_plans (id, plan_code, plan_name, description, salary_grade_id, employment_type, base_salary, daily_rate, hourly_rate, effective_date, status, created_at, updated_at)
VALUES 
('COMP001', 'RN-REGULAR-2026', 'Registered Nurse - Regular', 'Standard compensation for regular RN', NULL, 'regular', 50000, 1666.67, 208.33, '2026-01-01', 'active', NOW(), NOW()),
('COMP002', 'DR-ATTENDING', 'Doctor - Attending Physician', 'Compensation for attending doctors', NULL, 'regular', 120000, 4000, 500, '2026-01-01', 'active', NOW(), NOW()),
('COMP003', 'ADMIN-EO', 'Administrative Officer', 'Standard admin staff compensation', NULL, 'regular', 32000, 1066.67, 133.33, '2026-01-01', 'active', NOW(), NOW());

INSERT INTO compensation_plan_allowances (id, plan_id, allowance_name, allowance_type, amount, percentage, calculation_basis, frequency, is_taxable, status, created_at, updated_at)
VALUES 
('ALLOW001', 'COMP001', 'Hazard Pay', 'hazard_pay', NULL, 10, 'percentage', 'monthly', TRUE, 'active', NOW(), NOW()),
('ALLOW002', 'COMP001', 'Meal Allowance', 'meal', 4000, NULL, 'fixed', 'monthly', FALSE, 'active', NOW(), NOW()),
('ALLOW003', 'COMP001', 'Transportation', 'transportation', 3000, NULL, 'fixed', 'monthly', FALSE, 'active', NOW(), NOW()),
('ALLOW004', 'COMP002', 'On-Call Allowance', 'on_call', 5000, NULL, 'fixed', 'monthly', TRUE, 'active', NOW(), NOW()),
('ALLOW005', 'COMP003', 'Rice Subsidy', 'rice_subsidy', 2000, NULL, 'fixed', 'monthly', FALSE, 'active', NOW(), NOW());

INSERT INTO incentive_types (id, incentive_code, incentive_name, category, description, is_taxable, basis_type, frequency, requires_approval, status, created_at, updated_at)
VALUES 
('INC001', 'PERF-BONUS', 'Performance Bonus', 'performance_bonus', 'Monthly performance incentive', TRUE, 'metric_based', 'monthly', TRUE, 'active', NOW(), NOW()),
('INC002', 'HAZARD-BONUS', 'Hazard Incentive', 'hazard_incentive', 'Additional incentive for hazardous duties', TRUE, 'fixed', 'quarterly', TRUE, 'active', NOW(), NOW()),
('INC003', 'LOYALTY-BONUS', 'Loyalty Bonus', 'loyalty_bonus', 'Annual loyalty incentive', TRUE, 'tiered', 'annual', TRUE, 'active', NOW(), NOW()),
('INC004', 'ATTEND-BONUS', 'Perfect Attendance Bonus', 'attendance_bonus', 'Monthly bonus for perfect attendance', FALSE, 'fixed', 'monthly', FALSE, 'active', NOW(), NOW());
