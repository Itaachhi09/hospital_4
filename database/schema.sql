-- HR4 Hospital HR Management System Database Schema
-- MySQL 5.7+

-- Create database
CREATE DATABASE IF NOT EXISTS hr4_hospital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr4_hospital;

-- Users Table
CREATE TABLE users (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'hr_manager', 'payroll_officer', 'finance_officer', 'employee') DEFAULT 'employee',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departments Table
CREATE TABLE departments (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    manager_id VARCHAR(20),
    budget DECIMAL(12, 2),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_manager (manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employees Table
CREATE TABLE employees (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL UNIQUE,
    department_id VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    position VARCHAR(100),
    hire_date DATE NOT NULL,
    employment_type ENUM('full-time', 'part-time', 'contract') DEFAULT 'full-time',
    manager_id VARCHAR(20),
    status ENUM('active', 'on_leave', 'terminated') DEFAULT 'active',
    base_salary DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (manager_id) REFERENCES employees(id),
    INDEX idx_department (department_id),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_hire_date (hire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Salaries Table
CREATE TABLE salaries (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    base_salary DECIMAL(12, 2) NOT NULL,
    allowances DECIMAL(12, 2),
    deductions DECIMAL(12, 2),
    net_salary DECIMAL(12, 2),
    effective_date DATE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_employee (employee_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Runs Table
CREATE TABLE payroll_runs (
    id VARCHAR(20) PRIMARY KEY,
    period VARCHAR(10) NOT NULL,
    total_employees INT,
    gross_salary DECIMAL(15, 2),
    deductions DECIMAL(15, 2),
    net_salary DECIMAL(15, 2),
    status ENUM('draft', 'processed', 'paid') DEFAULT 'draft',
    processed_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_period (period),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payslips Table
CREATE TABLE payslips (
    id VARCHAR(20) PRIMARY KEY,
    payroll_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    period VARCHAR(10),
    gross_salary DECIMAL(12, 2),
    allowances DECIMAL(12, 2),
    deductions DECIMAL(12, 2),
    net_salary DECIMAL(12, 2),
    status ENUM('generated', 'sent', 'viewed') DEFAULT 'generated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_id) REFERENCES payroll_runs(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_employee (employee_id),
    INDEX idx_period (period),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Benefits Table
CREATE TABLE benefits (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    coverage VARCHAR(255),
    cost_employer DECIMAL(12, 2),
    cost_employee DECIMAL(12, 2),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Allowances Table
CREATE TABLE allowances (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    frequency ENUM('monthly', 'annual', 'one-time') DEFAULT 'monthly',
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Providers Table
CREATE TABLE hmo_providers (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Plans Table
CREATE TABLE hmo_plans (
    id VARCHAR(20) PRIMARY KEY,
    provider_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    coverage_limit DECIMAL(15, 2),
    monthly_premium DECIMAL(12, 2),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES hmo_providers(id),
    INDEX idx_provider (provider_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Enrollments Table
CREATE TABLE hmo_enrollments (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    plan_id VARCHAR(20) NOT NULL,
    enrollment_date DATE NOT NULL,
    termination_date DATE,
    dependents INT DEFAULT 0,
    status ENUM('active', 'terminated', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (plan_id) REFERENCES hmo_plans(id),
    INDEX idx_employee (employee_id),
    INDEX idx_plan (plan_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Claims Table
CREATE TABLE hmo_claims (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    enrollment_id VARCHAR(20),
    claim_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
    approved_amount DECIMAL(12, 2),
    approval_date DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (enrollment_id) REFERENCES hmo_enrollments(id),
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_claim_date (claim_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table
CREATE TABLE notifications (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Log Table
CREATE TABLE audit_logs (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20),
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id VARCHAR(20),
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- COMPENSATION AND BENEFITS TABLES
-- ==========================================

-- Salary Grades Table (Philippines-based classification)
CREATE TABLE salary_grades (
    id VARCHAR(20) PRIMARY KEY,
    grade_level INT NOT NULL UNIQUE,
    grade_name VARCHAR(100) NOT NULL,
    min_salary DECIMAL(12, 2) NOT NULL,
    midpoint_salary DECIMAL(12, 2) NOT NULL,
    max_salary DECIMAL(12, 2) NOT NULL,
    description TEXT,
    applicable_positions JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_grade_level (grade_level),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compensation Templates Table (Salary structure by position/grade)
CREATE TABLE compensation_templates (
    id VARCHAR(20) PRIMARY KEY,
    position VARCHAR(100) NOT NULL,
    grade_id VARCHAR(20),
    employee_type ENUM('doctor', 'nurse', 'medical_tech', 'allied_health', 'admin', 'support', 'contractual', 'job_order') NOT NULL,
    salary_grade_step INT DEFAULT 1,
    monthly_rate DECIMAL(12, 2) NOT NULL,
    daily_rate DECIMAL(12, 2),
    hourly_rate DECIMAL(10, 2),
    effective_date DATE NOT NULL,
    expiration_date DATE,
    description TEXT,
    hospital_type ENUM('public', 'private', 'both') DEFAULT 'both',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_id) REFERENCES salary_grades(id),
    INDEX idx_position (position),
    INDEX idx_employee_type (employee_type),
    INDEX idx_grade (grade_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Compensation Table (Individual compensation records)
CREATE TABLE employee_compensation (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    template_id VARCHAR(20),
    position VARCHAR(100),
    grade_id VARCHAR(20),
    salary_grade_step INT DEFAULT 1,
    monthly_salary DECIMAL(12, 2) NOT NULL,
    daily_rate DECIMAL(12, 2),
    hourly_rate DECIMAL(10, 2),
    effective_date DATE NOT NULL,
    end_date DATE,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(20),
    approved_date DATETIME,
    created_by VARCHAR(20),
    reason_for_change VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (template_id) REFERENCES compensation_templates(id),
    FOREIGN KEY (grade_id) REFERENCES salary_grades(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_employee (employee_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_approval_status (approval_status),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Allowance Components Table (Hospital-specific allowances)
CREATE TABLE allowance_components (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    component_code VARCHAR(20) NOT NULL UNIQUE,
    allowance_type ENUM('hazard_pay', 'shift_differential', 'on_call', 'meal', 'uniform', 'transportation', 'rice_subsidy', 'other') NOT NULL,
    amount DECIMAL(12, 2),
    percentage_of_salary DECIMAL(5, 2),
    calculation_basis ENUM('fixed', 'percentage', 'daily_rate', 'hourly_rate') DEFAULT 'fixed',
    frequency ENUM('monthly', 'daily', 'per_shift', 'one_time') DEFAULT 'monthly',
    applicable_employee_types JSON,
    applicable_grades JSON,
    min_hours_required DECIMAL(5, 2),
    requires_approval BOOLEAN DEFAULT FALSE,
    tax_treatment ENUM('taxable', 'non_taxable') DEFAULT 'taxable',
    requires_shift_type VARCHAR(50),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_component_code (component_code),
    INDEX idx_allowance_type (allowance_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Allowances Table (Individual allowance assignments)
CREATE TABLE employee_allowances (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    allowance_component_id VARCHAR(20) NOT NULL,
    assigned_amount DECIMAL(12, 2),
    assigned_percentage DECIMAL(5, 2),
    effective_date DATE NOT NULL,
    end_date DATE,
    reason VARCHAR(255),
    requires_documentation BOOLEAN DEFAULT FALSE,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(20),
    approved_date DATETIME,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (allowance_component_id) REFERENCES allowance_components(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee (employee_id),
    INDEX idx_allowance_component (allowance_component_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_approval_status (approval_status),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deduction Components Table (Statutory and non-statutory deductions)
CREATE TABLE deduction_components (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    component_code VARCHAR(20) NOT NULL UNIQUE,
    deduction_type ENUM('sss', 'philhealth', 'pag_ibig', 'tax_withholding', 'loan', 'insurance', 'union', 'other') NOT NULL,
    amount DECIMAL(12, 2),
    percentage_of_salary DECIMAL(5, 2),
    calculation_basis ENUM('fixed', 'percentage', 'tax_table', 'bracket') DEFAULT 'fixed',
    frequency ENUM('monthly', 'per_period', 'one_time') DEFAULT 'monthly',
    is_mandatory BOOLEAN DEFAULT FALSE,
    max_monthly_deduction DECIMAL(12, 2),
    employer_share BOOLEAN DEFAULT FALSE,
    employer_percentage DECIMAL(5, 2),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_component_code (component_code),
    INDEX idx_deduction_type (deduction_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Deductions Table (Individual deduction records)
CREATE TABLE employee_deductions (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    deduction_component_id VARCHAR(20) NOT NULL,
    deduction_amount DECIMAL(12, 2),
    deduction_percentage DECIMAL(5, 2),
    effective_date DATE NOT NULL,
    end_date DATE,
    reference_number VARCHAR(100),
    loan_duration_months INT,
    remaining_balance DECIMAL(12, 2),
    status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (deduction_component_id) REFERENCES deduction_components(id),
    INDEX idx_employee (employee_id),
    INDEX idx_deduction_component (deduction_component_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Statutory Contributions Table (SSS/PhilHealth/Pag-Ibig rates)
CREATE TABLE statutory_contributions (
    id VARCHAR(20) PRIMARY KEY,
    contribution_type ENUM('sss', 'philhealth', 'pag_ibig') NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    employee_rate DECIMAL(5, 2) NOT NULL,
    employer_rate DECIMAL(5, 2) NOT NULL,
    base_salary_min DECIMAL(12, 2),
    base_salary_max DECIMAL(12, 2),
    status ENUM('active', 'inactive') DEFAULT 'active',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_contribution_type (contribution_type),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Withholding Tax Brackets Table (BIR tax tables - annual update support)
CREATE TABLE withholding_tax_brackets (
    id VARCHAR(20) PRIMARY KEY,
    tax_year INT NOT NULL,
    salary_min DECIMAL(12, 2) NOT NULL,
    salary_max DECIMAL(12, 2) NOT NULL,
    tax_percentage DECIMAL(5, 2) NOT NULL,
    excess_amount DECIMAL(12, 2),
    monthly_exemption DECIMAL(12, 2),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tax_year (tax_year),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Overtime Records Table (Overtime tracking and approval)
CREATE TABLE overtime_records (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    overtime_date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    overtime_type ENUM('regular_ot', 'holiday_ot', 'night_ot', 'special_ot') DEFAULT 'regular_ot',
    rate_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.25,
    computed_amount DECIMAL(12, 2),
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(20),
    approved_date DATETIME,
    included_in_payroll_id VARCHAR(20),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (included_in_payroll_id) REFERENCES payroll_runs(id),
    INDEX idx_employee (employee_id),
    INDEX idx_overtime_date (overtime_date),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gross Pay Computation Table (Monthly gross pay calculation records)
CREATE TABLE gross_pay_computation (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    payroll_id VARCHAR(20),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    base_salary DECIMAL(12, 2) NOT NULL,
    daily_rate DECIMAL(12, 2),
    hourly_rate DECIMAL(10, 2),
    working_days INT,
    actual_days_worked INT,
    prorated_salary DECIMAL(12, 2),
    allowances_total DECIMAL(12, 2),
    overtime_hours DECIMAL(5, 2),
    overtime_amount DECIMAL(12, 2),
    night_differential DECIMAL(12, 2),
    holiday_pay DECIMAL(12, 2),
    special_pay DECIMAL(12, 2),
    gross_pay DECIMAL(12, 2) NOT NULL,
    is_prorated BOOLEAN DEFAULT FALSE,
    is_new_hire BOOLEAN DEFAULT FALSE,
    is_separation BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (payroll_id) REFERENCES payroll_runs(id),
    INDEX idx_employee (employee_id),
    INDEX idx_payroll (payroll_id),
    INDEX idx_period (period_start_date, period_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compensation History Table (Audit trail for all compensation changes)
CREATE TABLE compensation_history (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    change_type ENUM('salary_adjustment', 'allowance_add', 'allowance_remove', 'deduction_add', 'deduction_remove', 'promotion', 'demotion') NOT NULL,
    previous_value DECIMAL(12, 2),
    new_value DECIMAL(12, 2),
    effective_date DATE NOT NULL,
    changed_by VARCHAR(20),
    reason TEXT,
    approval_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_employee (employee_id),
    INDEX idx_change_type (change_type),
    INDEX idx_effective_date (effective_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compensation Approvals Table (Approval workflow tracking)
CREATE TABLE compensation_approvals (
    id VARCHAR(20) PRIMARY KEY,
    compensation_id VARCHAR(20),
    approval_type ENUM('salary_change', 'allowance_assignment', 'deduction_setup', 'overtime_approval') NOT NULL,
    request_details JSON NOT NULL,
    requested_by VARCHAR(20) NOT NULL,
    requested_date DATETIME NOT NULL,
    approval_level INT DEFAULT 1,
    approver_id VARCHAR(20),
    approval_status ENUM('pending', 'approved', 'rejected', 'recalled') DEFAULT 'pending',
    approval_date DATETIME,
    approval_remarks TEXT,
    next_approver_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approver_id) REFERENCES users(id),
    FOREIGN KEY (next_approver_id) REFERENCES users(id),
    INDEX idx_approval_type (approval_type),
    INDEX idx_approval_status (approval_status),
    INDEX idx_requested_date (requested_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Plan Assignments Table (Employee HMO plan/premium tracking)
CREATE TABLE hmo_plan_assignments (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    plan_id VARCHAR(20) NOT NULL,
    assignment_date DATE NOT NULL,
    termination_date DATE,
    employee_contribution DECIMAL(12, 2) NOT NULL,
    employer_contribution DECIMAL(12, 2) NOT NULL,
    dependent_count INT DEFAULT 0,
    dependent_contribution DECIMAL(12, 2),
    total_monthly_premium DECIMAL(12, 2),
    eligibility_status ENUM('eligible', 'not_eligible', 'pending') DEFAULT 'pending',
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(20),
    approved_date DATETIME,
    deduction_component_id VARCHAR(20),
    status ENUM('active', 'suspended', 'terminated') DEFAULT 'active',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (plan_id) REFERENCES hmo_plans(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (deduction_component_id) REFERENCES deduction_components(id),
    INDEX idx_employee (employee_id),
    INDEX idx_plan (plan_id),
    INDEX idx_assignment_date (assignment_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Data

-- Sample Users
INSERT INTO users VALUES
('USR001', 'Dexter', 'admin@hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'admin', 'active', NOW(), NOW(), NOW()),
('USR002', 'Sarah Manager', 'hr@hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'hr_manager', 'active', NOW(), NOW(), NOW()),
('USR003', 'John Payroll', 'payroll@hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'payroll_officer', 'active', NOW(), NOW(), NOW());

-- Sample Departments
INSERT INTO departments VALUES
('DEPT001', 'Human Resources', 'HR Department', 'USR001', 500000, 'active', NOW(), NOW()),
('DEPT002', 'Finance', 'Finance Department', 'USR002', 800000, 'active', NOW(), NOW()),
('DEPT003', 'Information Technology', 'IT Department', 'USR003', 1000000, 'active', NOW(), NOW());

-- Sample Employees
INSERT INTO employees VALUES
('EMP001', 'USR001', 'DEPT001', 'John', 'Doe', 'john.doe@hospital.com', '09012345678', '1985-05-15', 'male', 'HR Manager', '2020-01-15', 'full-time', NULL, 'active', 65000, NOW(), NOW()),
('EMP002', 'USR002', 'DEPT002', 'Jane', 'Smith', 'jane.smith@hospital.com', '09087654321', '1990-03-22', 'female', 'Financial Analyst', '2021-03-20', 'full-time', 'EMP001', 'active', 55000, NOW(), NOW()),
('EMP003', 'USR003', 'DEPT003', 'Michael', 'Johnson', 'michael.j@hospital.com', '09045678901', '1988-07-10', 'male', 'System Administrator', '2019-07-10', 'full-time', 'EMP001', 'active', 60000, NOW(), NOW());

-- Sample Salaries
INSERT INTO salaries VALUES
('SAL001', 'EMP001', 60000, 5000, 8000, 57000, '2025-01-01', 'active', NOW(), NOW()),
('SAL002', 'EMP002', 55000, 4000, 7000, 52000, '2025-02-01', 'active', NOW(), NOW()),
('SAL003', 'EMP003', 60000, 4500, 7500, 57000, '2025-01-15', 'active', NOW(), NOW());

-- Sample HMO Providers
INSERT INTO hmo_providers VALUES
('HMO001', 'MediCare Plus', '08012345678', 'contact@medicare.com', '123 Health Street', 'active', NOW(), NOW()),
('HMO002', 'HealthGuard Insurance', '08087654321', 'info@healthguard.com', '456 Wellness Avenue', 'active', NOW(), NOW());

-- Sample HMO Plans
INSERT INTO hmo_plans VALUES
('PLAN001', 'HMO001', 'Basic Health', 500000, 3500, 'Basic health coverage plan', 'active', NOW(), NOW()),
('PLAN002', 'HMO001', 'Premium Health', 1000000, 7000, 'Premium health coverage plan', 'active', NOW(), NOW());

-- Sample Benefits
INSERT INTO benefits VALUES
('BEN001', 'Health Insurance', 'insurance', 'Employee + Family', 15000, 2000, 'Comprehensive health insurance', 'active', NOW()),
('BEN002', 'Life Insurance', 'insurance', '3x Salary', 500, 100, 'Life insurance coverage', 'active', NOW());

-- Sample Allowances
INSERT INTO allowances VALUES
('ALW001', 'Housing Allowance', 8000, 'monthly', 'Monthly housing allowance', 'active', NOW()),
('ALW002', 'Transportation Allowance', 3000, 'monthly', 'Monthly transportation allowance', 'active', NOW()),
('ALW003', 'Meal Allowance', 2000, 'monthly', 'Monthly meal allowance', 'active', NOW());

-- ==========================================
-- COMPENSATION MODULE SAMPLE DATA
-- ==========================================

-- Sample Salary Grades (Philippine-based)
INSERT INTO salary_grades VALUES
('SG001', 1, 'Executive Management', 150000, 180000, 210000, 'Hospital Directors, Chief Officers', '["Hospital Director", "Chief Medical Officer", "Chief Operating Officer"]', 'active', NOW(), NOW()),
('SG002', 2, 'Senior Management', 100000, 120000, 140000, 'Department Heads, Senior Specialists', '["Department Head", "Senior Doctor", "Senior Manager"]', 'active', NOW(), NOW()),
('SG003', 3, 'Middle Management', 65000, 78000, 90000, 'Supervisors, Senior Nurses', '["Supervisor", "Head Nurse", "Senior Coordinator"]', 'active', NOW(), NOW()),
('SG004', 4, 'Professional Staff', 45000, 52000, 60000, 'Nurses, Medical Technologists', '["Registered Nurse", "Medical Technologist", "Pharmacist"]', 'active', NOW(), NOW()),
('SG005', 5, 'Administrative Staff', 30000, 35000, 42000, 'Admin Officers, Clerks', '["Administrative Officer", "Accounting Clerk", "Data Entry"]', 'active', NOW(), NOW()),
('SG006', 6, 'Support Staff', 20000, 23000, 28000, 'Maintenance, Security, Housekeeping', '["Security Guard", "Maintenance", "Housekeeping"]', 'active', NOW(), NOW()),
('SG007', 7, 'Contractual / Job Order', 18000, 20000, 24000, 'Part-time, Contract, Job Order', '["Casual Staff", "Relief Staff", "Job Order"]', 'active', NOW(), NOW());

-- Sample Compensation Templates
INSERT INTO compensation_templates VALUES
('CT001', 'Doctor - Resident', 'SG003', 'doctor', 1, 75000, 2500, 312.50, '2025-01-01', NULL, 'Monthly rate for resident doctors', 'both', 'active', NOW(), NOW()),
('CT002', 'Doctor - Attending', 'SG002', 'doctor', 1, 120000, 4000, 500, '2025-01-01', NULL, 'Monthly rate for attending physicians', 'both', 'active', NOW(), NOW()),
('CT003', 'Nurse - RN Grade 1', 'SG004', 'nurse', 1, 48000, 1600, 200, '2025-01-01', NULL, 'Registered nurse entry level', 'both', 'active', NOW(), NOW()),
('CT004', 'Medical Technologist', 'SG004', 'medical_tech', 1, 45000, 1500, 187.50, '2025-01-01', NULL, 'Medical/Clinical Laboratory Technologist', 'both', 'active', NOW(), NOW()),
('CT005', 'HR Manager', 'SG003', 'admin', 1, 65000, 2166.67, 270, '2025-01-01', NULL, 'Human Resources Manager', 'both', 'active', NOW(), NOW()),
('CT006', 'Administrative Officer', 'SG005', 'admin', 1, 32000, 1066.67, 133.33, '2025-01-01', NULL, 'Administrative support staff', 'both', 'active', NOW(), NOW()),
('CT007', 'Security Guard', 'SG006', 'support', 1, 22000, 733.33, 91.67, '2025-01-01', NULL, 'Security and safety personnel', 'both', 'active', NOW(), NOW()),
('CT008', 'Relief Nurse', 'SG007', 'job_order', 1, 20000, NULL, 250, '2025-01-01', NULL, 'Hourly rate for relief/casual staff', 'both', 'active', NOW(), NOW());

-- Sample Allowance Components (Hospital-specific)
INSERT INTO allowance_components VALUES
('AC001', 'Hazard Pay', 'HAZ_PAY', 'hazard_pay', NULL, 10, 'percentage', 'monthly', '["doctor", "nurse", "medical_tech", "allied_health"]', '["SG002", "SG003", "SG004"]', 0, FALSE, 'taxable', NULL, 'Hazard allowance for health risk exposure', 'active', NOW(), NOW()),
('AC002', 'Night Differential', 'NIGHT_DIFF', 'shift_differential', NULL, 10, 'percentage', 'daily_rate', '["nurse", "medical_tech", "support"]', '["SG004", "SG005", "SG006"]', 8, FALSE, 'taxable', 'Night', 'Night shift differential per Labor Code', 'active', NOW(), NOW()),
('AC003', 'On-Call Allowance', 'ON_CALL', 'on_call', 5000, NULL, 'fixed', 'monthly', '["doctor", "nurse"]', '["SG002", "SG003", "SG004"]', 0, TRUE, 'taxable', NULL, 'On-call duty allowance for physicians', 'active', NOW(), NOW()),
('AC004', 'Meal Allowance', 'MEAL_ALW', 'meal', 4000, NULL, 'fixed', 'monthly', '["doctor", "nurse", "medical_tech", "admin", "support"]', NULL, 0, FALSE, 'non_taxable', NULL, 'Daily meal provided or meal allowance', 'active', NOW(), NOW()),
('AC005', 'Uniform Allowance', 'UNIFORM', 'uniform', 3000, NULL, 'fixed', 'monthly', '["nurse", "medical_tech", "support"]', NULL, 0, FALSE, 'non_taxable', NULL, 'Uniform and protective equipment allowance', 'active', NOW(), NOW()),
('AC006', 'Transportation Allowance', 'TRANS_ALW', 'transportation', 3000, NULL, 'fixed', 'monthly', NULL, NULL, 0, FALSE, 'non_taxable', NULL, 'Monthly transportation allowance', 'active', NOW(), NOW()),
('AC007', 'Rice Subsidy', 'RICE_SUB', 'rice_subsidy', 2000, NULL, 'fixed', 'monthly', NULL, NULL, 0, FALSE, 'non_taxable', NULL, 'Monthly rice subsidy for all employees', 'active', NOW(), NOW()),
('AC008', 'Shift Allowance (Day)', 'SHIFT_DAY', 'shift_differential', 2000, NULL, 'fixed', 'daily_rate', '["nurse", "medical_tech"]', '["SG004", "SG005"]', 0, FALSE, 'taxable', 'Day', 'Day shift premium allowance', 'active', NOW(), NOW());

-- Sample Deduction Components
INSERT INTO deduction_components VALUES
('DC001', 'SSS Contribution', 'SSS', 'sss', NULL, 3.63, 'percentage', 'monthly', TRUE, NULL, FALSE, 7.375, 'Social Security System employee contribution', 'active', NOW(), NOW()),
('DC002', 'PhilHealth Contribution', 'PHILHEALTH', 'philhealth', NULL, 2.75, 'percentage', 'monthly', TRUE, NULL, FALSE, 2.75, 'Philippine Health Insurance Corporation', 'active', NOW(), NOW()),
('DC003', 'Pag-IBIG Contribution', 'PAGIBIG', 'pag_ibig', NULL, 1.0, 'percentage', 'monthly', TRUE, 300, FALSE, 2.0, 'Home Development Mutual Fund (max contribution)', 'active', NOW(), NOW()),
('DC004', 'Withholding Tax', 'WHT', 'tax_withholding', NULL, NULL, 'tax_table', 'monthly', FALSE, NULL, FALSE, NULL, 'BIR Withholding Tax - computed from tax tables', 'active', NOW(), NOW()),
('DC005', 'Salary Loan Deduction', 'SAL_LOAN', 'loan', NULL, NULL, 'fixed', 'per_period', FALSE, 50, FALSE, NULL, 'Salary loan amortization (max 50% gross)', 'active', NOW(), NOW()),
('DC006', 'Provident Fund', 'PROV_FUND', 'insurance', NULL, 1.0, 'percentage', 'monthly', FALSE, NULL, FALSE, 1.0, 'Company provident fund contribution', 'active', NOW(), NOW()),
('DC007', 'Union Dues', 'UNION', 'union', NULL, 0.5, 'percentage', 'monthly', FALSE, NULL, FALSE, NULL, 'Union membership dues', 'active', NOW(), NOW());

-- Sample Statutory Contributions (as of Jan 2026 - Philippines)
INSERT INTO statutory_contributions VALUES
('SC001', 'sss', '2025-01-01', '2025-12-31', 3.63, 7.375, 0, 99999, 'active', 'SSS rates for 2025', NOW(), NOW()),
('SC002', 'philhealth', '2025-01-01', '2025-12-31', 2.75, 2.75, 0, 99999, 'active', 'PhilHealth rates for 2025', NOW(), NOW()),
('SC003', 'pag_ibig', '2025-01-01', '2025-12-31', 1.0, 2.0, 0, 99999, 'active', 'Pag-IBIG rates for 2025 - max contribution 300', NOW(), NOW());

-- Sample Withholding Tax Brackets (2025 - Philippines)
INSERT INTO withholding_tax_brackets VALUES
('WTB001', 2025, 0, 20832, 0, 0, 0, 'active', NOW(), NOW()),
('WTB002', 2025, 20833, 33332, 15, 0, 3125, 'active', NOW(), NOW()),
('WTB003', 2025, 33333, 66664, 20, 0, 9333, 'active', NOW(), NOW()),
('WTB004', 2025, 66665, 166664, 25, 0, 23333, 'active', NOW(), NOW()),
('WTB005', 2025, 166665, 666664, 30, 0, 93333, 'active', NOW(), NOW()),
('WTB006', 2025, 666665, 999999, 32, 0, 143333, 'active', NOW(), NOW()),
('WTB007', 2025, 1000000, 99999999, 35, 0, 263333, 'active', NOW(), NOW());

-- Sample Employee Compensation (linked to existing employees)
INSERT INTO employee_compensation VALUES
('COMP001', 'EMP001', 'CT005', 'HR Manager', 'SG003', 1, 65000, 2166.67, 270, '2025-01-01', NULL, 'approved', 'USR001', NOW(), 'USR001', 'Initial compensation setup', 'active', NOW(), NOW()),
('COMP002', 'EMP002', 'CT006', 'Administrative Officer', 'SG005', 1, 32000, 1066.67, 133.33, '2025-01-01', NULL, 'approved', 'USR001', NOW(), 'USR001', 'Initial compensation setup', 'active', NOW(), NOW()),
('COMP003', 'EMP003', 'CT006', 'Administrative Officer', 'SG005', 1, 32000, 1066.67, 133.33, '2025-01-01', NULL, 'approved', 'USR001', NOW(), 'USR001', 'Initial compensation setup', 'active', NOW(), NOW());

-- Sample Employee Allowances
INSERT INTO employee_allowances VALUES
('EAL001', 'EMP001', 'AC006', 3000, NULL, '2025-01-01', NULL, 'Monthly transportation', 'approved', 'USR001', NOW(), 'active', NOW(), NOW()),
('EAL002', 'EMP001', 'AC007', 2000, NULL, '2025-01-01', NULL, 'Monthly rice subsidy', 'approved', 'USR001', NOW(), 'active', NOW(), NOW()),
('EAL003', 'EMP002', 'AC004', 4000, NULL, '2025-01-01', NULL, 'Meal allowance', 'approved', 'USR001', NOW(), 'active', NOW(), NOW()),
('EAL004', 'EMP002', 'AC006', 3000, NULL, '2025-01-01', NULL, 'Monthly transportation', 'approved', 'USR001', NOW(), 'active', NOW(), NOW()),
('EAL005', 'EMP003', 'AC006', 3000, NULL, '2025-01-01', NULL, 'Monthly transportation', 'approved', 'USR001', NOW(), 'active', NOW(), NOW());

-- Sample Employee Deductions
INSERT INTO employee_deductions VALUES
('EDUC001', 'EMP001', 'DC001', NULL, 3.63, '2025-01-01', NULL, 'SSS-EMP001-2025', NULL, NULL, 'active', NOW(), NOW()),
('EDUC002', 'EMP001', 'DC002', NULL, 2.75, '2025-01-01', NULL, 'PHIL-EMP001-2025', NULL, NULL, 'active', NOW(), NOW()),
('EDUC003', 'EMP001', 'DC003', 300, NULL, '2025-01-01', NULL, 'PAGIBIG-EMP001-2025', NULL, NULL, 'active', NOW(), NOW()),
('EDUC004', 'EMP002', 'DC001', NULL, 3.63, '2025-01-01', NULL, 'SSS-EMP002-2025', NULL, NULL, 'active', NOW(), NOW()),
('EDUC005', 'EMP002', 'DC002', NULL, 2.75, '2025-01-01', NULL, 'PHIL-EMP002-2025', NULL, NULL, 'active', NOW(), NOW()),
('EDUC006', 'EMP002', 'DC003', 300, NULL, '2025-01-01', NULL, 'PAGIBIG-EMP002-2025', NULL, NULL, 'active', NOW(), NOW()),
('EDUC007', 'EMP003', 'DC001', NULL, 3.63, '2025-01-01', NULL, 'SSS-EMP003-2025', NULL, NULL, 'active', NOW(), NOW()),
('EDUC008', 'EMP003', 'DC002', NULL, 2.75, '2025-01-01', NULL, 'PHIL-EMP003-2025', NULL, NULL, 'active', NOW(), NOW()),
('EDUC009', 'EMP003', 'DC003', 300, NULL, '2025-01-01', NULL, 'PAGIBIG-EMP003-2025', NULL, NULL, 'active', NOW(), NOW());

-- Sample Gross Pay Computation
INSERT INTO gross_pay_computation VALUES
('GPC001', 'EMP001', 'PR001', '2025-01-01', '2025-01-31', 65000, 2166.67, 270, 22, 22, 65000, 5000, 0, 0, 0, 0, 0, 70000, FALSE, FALSE, FALSE, 'Regular January 2025 payroll', NOW(), NOW()),
('GPC002', 'EMP002', 'PR001', '2025-01-01', '2025-01-31', 32000, 1066.67, 133.33, 22, 22, 32000, 7000, 0, 0, 0, 0, 0, 39000, FALSE, FALSE, FALSE, 'Regular January 2025 payroll', NOW(), NOW()),
('GPC003', 'EMP003', 'PR001', '2025-01-01', '2025-01-31', 32000, 1066.67, 133.33, 22, 22, 32000, 7000, 0, 0, 0, 0, 0, 39000, FALSE, FALSE, FALSE, 'Regular January 2025 payroll', NOW(), NOW());

-- Sample HMO Plan Assignments
INSERT INTO hmo_plan_assignments VALUES
('HPA001', 'EMP001', 'PLAN001', '2025-01-01', NULL, 1500, 2500, 2, 800, 4800, 'eligible', 'approved', 'USR001', NOW(), 'EDUC010', 'active', 'Active HMO coverage with dependents', NOW(), NOW()),
('HPA002', 'EMP002', 'PLAN001', '2025-01-01', NULL, 1500, 2500, 0, 0, 4000, 'eligible', 'approved', 'USR001', NOW(), 'EDUC011', 'active', 'Active HMO coverage for employee only', NOW(), NOW()),
('HPA003', 'EMP003', 'PLAN002', '2025-01-15', NULL, 2500, 3500, 1, 500, 6500, 'eligible', 'approved', 'USR001', NOW(), 'EDUC012', 'active', 'Premium HMO plan with 1 dependent', NOW(), NOW());

-- Compensation History (audit trail)
INSERT INTO compensation_history VALUES
('CH001', 'EMP001', 'salary_adjustment', NULL, 65000, '2025-01-01', 'USR001', 'Initial compensation setup - HR Manager position', 'COMP001', NOW()),
('CH002', 'EMP002', 'salary_adjustment', NULL, 32000, '2025-01-01', 'USR001', 'Initial compensation setup - Administrative Officer', 'COMP002', NOW()),
('CH003', 'EMP003', 'salary_adjustment', NULL, 32000, '2025-01-01', 'USR001', 'Initial compensation setup - Administrative Officer', 'COMP003', NOW());

-- ================== COMPREHENSIVE PAYROLL TABLES ==================

-- Attendance & Timekeeping Table
CREATE TABLE attendance_records (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    attendance_date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    total_hours DECIMAL(5, 2),
    is_overtime BOOLEAN DEFAULT FALSE,
    overtime_hours DECIMAL(5, 2),
    is_holiday BOOLEAN DEFAULT FALSE,
    is_special_holiday BOOLEAN DEFAULT FALSE,
    is_night_shift BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    status ENUM('present', 'absent', 'late', 'leave') DEFAULT 'present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_employee_date (employee_id, attendance_date),
    INDEX idx_date (attendance_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Salary Grades Table (for Philippine hospital salary structures)
CREATE TABLE salary_grades (
    id VARCHAR(20) PRIMARY KEY,
    grade_level INT NOT NULL UNIQUE,
    grade_name VARCHAR(100) NOT NULL,
    min_salary DECIMAL(12, 2),
    max_salary DECIMAL(12, 2),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_grade_level (grade_level),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shift Templates Table
CREATE TABLE shift_templates (
    id VARCHAR(20) PRIMARY KEY,
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(5, 2) NOT NULL,
    shift_allowance DECIMAL(12, 2),
    is_night_shift BOOLEAN DEFAULT FALSE,
    night_differential_percentage DECIMAL(5, 2),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Shifts Assignment
CREATE TABLE employee_shift_assignments (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    shift_id VARCHAR(20) NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (shift_id) REFERENCES shift_templates(id),
    INDEX idx_employee (employee_id),
    INDEX idx_shift (shift_id),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Overtime Records Table
CREATE TABLE overtime_records (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    overtime_date DATE NOT NULL,
    overtime_hours DECIMAL(5, 2) NOT NULL,
    overtime_rate ENUM('regular', 'holiday', 'special_holiday') DEFAULT 'regular',
    computed_amount DECIMAL(12, 2),
    remarks TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(20),
    approved_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee_date (employee_id, overtime_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Holiday Calendar Table (Philippine holidays)
CREATE TABLE holiday_calendar (
    id VARCHAR(20) PRIMARY KEY,
    holiday_date DATE NOT NULL UNIQUE,
    holiday_name VARCHAR(100) NOT NULL,
    holiday_type ENUM('regular', 'special', 'local') DEFAULT 'regular',
    pay_multiplier DECIMAL(3, 2),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (holiday_date),
    INDEX idx_type (holiday_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Philippine Contribution Rates Table
CREATE TABLE contribution_rates (
    id VARCHAR(20) PRIMARY KEY,
    contribution_type ENUM('SSS', 'PHILHEALTH', 'PAGIBIG', 'BIR') NOT NULL,
    effective_date DATE NOT NULL,
    employee_rate DECIMAL(6, 4),
    employer_rate DECIMAL(6, 4),
    salary_ceiling DECIMAL(12, 2),
    salary_floor DECIMAL(12, 2),
    fixed_amount DECIMAL(12, 2),
    remarks TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_date (contribution_type, effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BIR Tax Brackets Table
CREATE TABLE bir_tax_brackets (
    id VARCHAR(20) PRIMARY KEY,
    effective_year INT NOT NULL,
    bracket_min DECIMAL(12, 2),
    bracket_max DECIMAL(12, 2),
    base_tax DECIMAL(12, 2),
    excess_rate DECIMAL(6, 4),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_year (effective_year),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Deduction Types Table
CREATE TABLE payroll_deduction_types (
    id VARCHAR(20) PRIMARY KEY,
    deduction_name VARCHAR(100) NOT NULL,
    deduction_type ENUM('statutory', 'voluntary', 'loan', 'insurance', 'other') DEFAULT 'voluntary',
    is_fixed BOOLEAN DEFAULT FALSE,
    fixed_amount DECIMAL(12, 2),
    percentage_of_salary DECIMAL(6, 4),
    salary_ceiling DECIMAL(12, 2),
    salary_floor DECIMAL(12, 2),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (deduction_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Allowance Types Table
CREATE TABLE payroll_allowance_types (
    id VARCHAR(20) PRIMARY KEY,
    allowance_name VARCHAR(100) NOT NULL,
    allowance_type ENUM('hazard', 'night_differential', 'shift', 'meal', 'transportation', 'housing', 'other') DEFAULT 'other',
    is_fixed BOOLEAN DEFAULT FALSE,
    fixed_amount DECIMAL(12, 2),
    percentage_of_salary DECIMAL(6, 4),
    description TEXT,
    taxable BOOLEAN DEFAULT TRUE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (allowance_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Computation Details Table (stores detailed payroll calculations)
CREATE TABLE payroll_computation_details (
    id VARCHAR(20) PRIMARY KEY,
    payroll_run_id VARCHAR(20),
    payslip_id VARCHAR(20),
    employee_id VARCHAR(20) NOT NULL,
    computation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    pay_period_start DATE,
    pay_period_end DATE,
    total_days DECIMAL(5, 2),
    present_days DECIMAL(5, 2),
    absent_days DECIMAL(5, 2),
    leave_days DECIMAL(5, 2),
    working_hours DECIMAL(8, 2),
    overtime_hours DECIMAL(8, 2),
    overtime_amount DECIMAL(12, 2),
    night_differential_hours DECIMAL(8, 2),
    night_differential_amount DECIMAL(12, 2),
    holiday_pay_regular DECIMAL(12, 2),
    holiday_pay_special DECIMAL(12, 2),
    hazard_pay DECIMAL(12, 2),
    other_allowances DECIMAL(12, 2),
    gross_pay DECIMAL(12, 2),
    sss_contribution DECIMAL(12, 2),
    philhealth_contribution DECIMAL(12, 2),
    pagibig_contribution DECIMAL(12, 2),
    bir_tax DECIMAL(12, 2),
    other_deductions DECIMAL(12, 2),
    total_deductions DECIMAL(12, 2),
    net_pay DECIMAL(12, 2),
    remarks TEXT,
    status ENUM('draft', 'calculated', 'approved', 'paid') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
    FOREIGN KEY (payslip_id) REFERENCES payslips(id),
    INDEX idx_employee_period (employee_id, pay_period_start),
    INDEX idx_payroll_run (payroll_run_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BIR Forms Table
CREATE TABLE bir_forms (
    id VARCHAR(20) PRIMARY KEY,
    form_type VARCHAR(20) NOT NULL,
    reporting_year INT NOT NULL,
    employee_id VARCHAR(20),
    tin VARCHAR(20),
    gross_income DECIMAL(15, 2),
    total_tax_due DECIMAL(15, 2),
    total_tax_withheld DECIMAL(15, 2),
    tax_due_or_refund DECIMAL(15, 2),
    form_status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
    generated_date DATETIME,
    submitted_date DATETIME,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_year_type (reporting_year, form_type),
    INDEX idx_employee (employee_id),
    INDEX idx_status (form_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Audit Log Table
CREATE TABLE payroll_audit_log (
    id VARCHAR(20) PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    payroll_run_id VARCHAR(20),
    payslip_id VARCHAR(20),
    employee_id VARCHAR(20),
    performed_by VARCHAR(20),
    old_values JSON,
    new_values JSON,
    reason TEXT,
    action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
    FOREIGN KEY (payslip_id) REFERENCES payslips(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (performed_by) REFERENCES users(id),
    INDEX idx_action_type (action_type),
    INDEX idx_action_date (action_date),
    INDEX idx_payroll_run (payroll_run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hospital Payroll Policies Configuration Table
CREATE TABLE payroll_policies (
    id VARCHAR(20) PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL,
    policy_category ENUM('salary_computation', 'deductions', 'allowances', 'holidays', 'overtime') DEFAULT 'salary_computation',
    policy_key VARCHAR(100) NOT NULL UNIQUE,
    policy_value VARCHAR(255),
    policy_description TEXT,
    data_type ENUM('string', 'number', 'percentage', 'boolean', 'enum') DEFAULT 'string',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (policy_category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Monthly Payroll Summary Table (for faster reporting)
CREATE TABLE monthly_payroll_summary (
    id VARCHAR(20) PRIMARY KEY,
    payroll_year INT NOT NULL,
    payroll_month INT NOT NULL,
    department_id VARCHAR(20),
    total_employees INT,
    total_gross_pay DECIMAL(15, 2),
    total_overtime_pay DECIMAL(15, 2),
    total_sss DECIMAL(15, 2),
    total_philhealth DECIMAL(15, 2),
    total_pagibig DECIMAL(15, 2),
    total_bir_tax DECIMAL(15, 2),
    total_deductions DECIMAL(15, 2),
    total_net_pay DECIMAL(15, 2),
    summary_status ENUM('draft', 'finalized', 'submitted') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_year_month (payroll_year, payroll_month),
    INDEX idx_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================ SAMPLE DATA FOR NEW TABLES ================

-- Salary Grades (Philippine Hospital Standards)
INSERT INTO salary_grades (id, grade_level, grade_name, min_salary, max_salary, description, status) VALUES
('SG001', 1, 'Grade 1 - Entry Level', 18000, 22000, 'Entry level positions - Administrative Support', 'active'),
('SG002', 2, 'Grade 2 - Junior Staff', 22000, 28000, 'Junior staff positions - Nursing Aides, Clerks', 'active'),
('SG003', 3, 'Grade 3 - Senior Staff', 28000, 35000, 'Senior staff - Nurses, Technicians', 'active'),
('SG004', 4, 'Grade 4 - Specialist', 35000, 45000, 'Specialist positions - Senior Nurses, Lab Techs', 'active'),
('SG005', 5, 'Grade 5 - Professional', 45000, 60000, 'Professional positions - Doctors, Department Heads', 'active'),
('SG006', 6, 'Grade 6 - Senior Professional', 60000, 80000, 'Senior management - Senior Doctors, Directors', 'active'),
('SG007', 7, 'Grade 7 - Executive', 80000, 120000, 'Executive level - Hospital Executives', 'active');

-- Shift Templates
INSERT INTO shift_templates (id, shift_name, start_time, end_time, total_hours, shift_allowance, is_night_shift, night_differential_percentage, description, status) VALUES
('SH001', 'Day Shift', '07:00:00', '15:00:00', 8, 0, FALSE, 0, 'Standard day shift (7 AM - 3 PM)', 'active'),
('SH002', 'Evening Shift', '15:00:00', '23:00:00', 8, 100, FALSE, 0, 'Standard evening shift (3 PM - 11 PM)', 'active'),
('SH003', 'Night Shift', '23:00:00', '07:00:00', 8, 200, TRUE, 10, 'Graveyard shift (11 PM - 7 AM) with 10% night differential', 'active'),
('SH004', 'Extended Day', '07:00:00', '16:00:00', 9, 150, FALSE, 0, 'Extended day shift (7 AM - 4 PM) for medical staff', 'active');

-- Philippine Contribution Rates (as of 2026)
INSERT INTO contribution_rates (id, contribution_type, effective_date, employee_rate, employer_rate, salary_ceiling, salary_floor, fixed_amount, remarks, status) VALUES
('CR001', 'SSS', '2025-01-01', 3.63, 5.45, 29750, 3000, NULL, 'SSS employee and employer contribution rates', 'active'),
('CR002', 'PHILHEALTH', '2025-01-01', 2.75, 2.75, 100000, NULL, NULL, 'PhilHealth member contribution rate 2.75%', 'active'),
('CR003', 'PAGIBIG', '2025-01-01', 1, 2, 5000, NULL, NULL, 'Pag-IBIG Fund contribution 1-2%', 'active'),
('CR004', 'BIR', '2025-01-01', NULL, NULL, NULL, NULL, NULL, 'BIR withholding tax (calculated via brackets)', 'active');

-- BIR Tax Brackets for 2026 (Philippine Individual Income Tax)
INSERT INTO bir_tax_brackets (id, effective_year, bracket_min, bracket_max, base_tax, excess_rate, status) VALUES
('BT001', 2026, 0, 250000, 0, 0, 'active'),
('BT002', 2026, 250000, 400000, 0, 0.05, 'active'),
('BT003', 2026, 400000, 800000, 7500, 0.10, 'active'),
('BT004', 2026, 800000, 2000000, 47500, 0.15, 'active'),
('BT005', 2026, 2000000, 8000000, 227500, 0.20, 'active'),
('BT006', 2026, 8000000, NULL, 1427500, 0.25, 'active');

-- Payroll Deduction Types
INSERT INTO payroll_deduction_types (id, deduction_name, deduction_type, is_fixed, percentage_of_salary, description, status) VALUES
('PDT001', 'SSS Contribution', 'statutory', FALSE, 3.63, 'Social Security System employee contribution', 'active'),
('PDT002', 'PhilHealth Contribution', 'statutory', FALSE, 2.75, 'PhilHealth member contribution', 'active'),
('PDT003', 'Pag-IBIG Contribution', 'statutory', FALSE, 1, 'Pag-IBIG Fund contribution', 'active'),
('PDT004', 'BIR Withholding Tax', 'statutory', FALSE, NULL, 'Bureau of Internal Revenue tax withheld', 'active'),
('PDT005', 'Life Insurance', 'insurance', FALSE, NULL, 'Optional life insurance premium', 'active'),
('PDT006', 'SSS Loan', 'loan', FALSE, NULL, 'SSS salary loan amortization', 'active');

-- Payroll Allowance Types
INSERT INTO payroll_allowance_types (id, allowance_name, allowance_type, is_fixed, percentage_of_salary, description, taxable, status) VALUES
('PAT001', 'Hazard Pay', 'hazard', FALSE, 10, 'Medical staff hazard pay - 10% of base salary', TRUE, 'active'),
('PAT002', 'Night Differential', 'night_differential', FALSE, 10, 'Night shift differential - 10% of hourly rate', TRUE, 'active'),
('PAT003', 'Shift Allowance', 'shift', TRUE, NULL, 'Shift differential allowance', FALSE, 'active'),
('PAT004', 'Meal Allowance', 'meal', TRUE, NULL, 'Daily meal allowance', FALSE, 'active'),
('PAT005', 'Transportation Allowance', 'transportation', TRUE, NULL, 'Monthly transportation allowance', FALSE, 'active'),
('PAT006', 'Housing Allowance', 'housing', TRUE, NULL, 'Monthly housing allowance', TRUE, 'active'),
('PAT007', 'On-Call Allowance', 'other', TRUE, NULL, 'On-call duty allowance', TRUE, 'active');

-- Philippine Holiday Calendar 2026
INSERT INTO holiday_calendar (id, holiday_date, holiday_name, holiday_type, pay_multiplier, description, status) VALUES
('HC001', '2026-01-01', 'New Year\'s Day', 'regular', 1, 'Regular holiday', 'active'),
('HC002', '2026-02-10', 'EDSA Revolution Anniversary', 'special', 1.3, 'Special non-working holiday', 'active'),
('HC003', '2026-02-12', 'Chinese New Year', 'special', 1.3, 'Special non-working holiday', 'active'),
('HC004', '2026-04-09', 'Day of Valor', 'regular', 1, 'Regular holiday', 'active'),
('HC005', '2026-04-16', 'Maundy Thursday', 'regular', 1, 'Regular holiday - Holy Week', 'active'),
('HC006', '2026-04-17', 'Good Friday', 'regular', 1, 'Regular holiday - Holy Week', 'active'),
('HC007', '2026-04-18', 'Black Saturday', 'special', 1.3, 'Special non-working holiday - Holy Week', 'active'),
('HC008', '2026-04-19', 'Easter Sunday', 'special', 1.3, 'Special non-working holiday', 'active'),
('HC009', '2026-06-12', 'Independence Day', 'regular', 1, 'Regular holiday', 'active'),
('HC010', '2026-06-24', 'Feast of St. John Baptist', 'special', 1.3, 'Special non-working holiday', 'active'),
('HC011', '2026-08-21', 'Ninoy Aquino Day', 'regular', 1, 'Regular holiday', 'active'),
('HC012', '2026-11-01', 'All Saints\' Day', 'regular', 1, 'Regular holiday', 'active'),
('HC013', '2026-11-30', 'Bonifacio Day', 'regular', 1, 'Regular holiday', 'active'),
('HC014', '2026-12-08', 'Feast of the Immaculate Conception', 'regular', 1, 'Regular holiday', 'active'),
('HC015', '2026-12-25', 'Christmas Day', 'regular', 1, 'Regular holiday', 'active'),
('HC016', '2026-12-30', 'Rizal Day', 'regular', 1, 'Regular holiday', 'active'),
('HC017', '2026-12-31', 'New Year\'s Eve', 'special', 1.3, 'Special non-working holiday', 'active');

-- Hospital Payroll Policies Configuration
INSERT INTO payroll_policies (id, policy_name, policy_category, policy_key, policy_value, policy_description, data_type, status) VALUES
('PP001', 'Overtime Rate - Regular Day', 'salary_computation', 'overtime_rate_regular', '1.25', 'Overtime rate multiplier for regular days (1.25x hourly)', 'number', 'active'),
('PP002', 'Overtime Rate - Holiday', 'salary_computation', 'overtime_rate_holiday', '1.69', 'Overtime rate multiplier for holidays (1.69x hourly)', 'number', 'active'),
('PP003', 'Overtime Rate - Special Holiday', 'salary_computation', 'overtime_rate_special_holiday', '1.95', 'Overtime rate multiplier for special holidays (1.95x hourly)', 'number', 'active'),
('PP004', 'Night Differential Percentage', 'allowances', 'night_differential_percent', '10', 'Night shift differential percentage of hourly rate', 'percentage', 'active'),
('PP005', 'Holiday Pay Multiplier - Regular Holiday', 'allowances', 'holiday_pay_regular', '1', 'Holiday pay multiplier for regular holidays', 'number', 'active'),
('PP006', 'Holiday Pay Multiplier - Special Holiday', 'allowances', 'holiday_pay_special', '1.3', 'Holiday pay multiplier for special holidays', 'number', 'active'),
('PP007', 'Hazard Pay Percentage', 'allowances', 'hazard_pay_percent', '10', 'Medical staff hazard pay as % of base salary', 'percentage', 'active'),
('PP008', 'De Minimis Benefits - Non-Taxable', 'deductions', 'de_minimis_limit', '90000', 'Annual de minimis benefits limit (non-taxable)', 'number', 'active'),
('PP009', 'Absent Deduction Type', 'deductions', 'absent_deduction_type', 'daily_rate', 'How absences are deducted (daily_rate or hourly)', 'enum', 'active'),
('PP010', 'Enable Tax Computation', 'salary_computation', 'enable_tax', 'true', 'Enable automatic BIR tax computation', 'boolean', 'active');

-- Sample Shift Assignments
INSERT INTO employee_shift_assignments (id, employee_id, shift_id, effective_date, end_date, status) VALUES
('ESA001', 'EMP001', 'SH001', '2025-01-01', NULL, 'active'),
('ESA002', 'EMP002', 'SH001', '2025-01-01', NULL, 'active'),
('ESA003', 'EMP003', 'SH003', '2025-01-01', NULL, 'active');

-- Sample Attendance Records
INSERT INTO attendance_records (id, employee_id, attendance_date, time_in, time_out, total_hours, is_overtime, overtime_hours, is_holiday, is_special_holiday, is_night_shift, status) VALUES
('ATT001', 'EMP001', '2025-01-02', '07:00:00', '15:00:00', 8, FALSE, 0, FALSE, FALSE, FALSE, 'present'),
('ATT002', 'EMP001', '2025-01-03', '07:00:00', '15:00:00', 8, FALSE, 0, FALSE, FALSE, FALSE, 'present'),
('ATT003', 'EMP002', '2025-01-02', '07:00:00', '15:00:00', 8, FALSE, 0, FALSE, FALSE, FALSE, 'present'),
('ATT004', 'EMP003', '2025-01-02', '23:00:00', '07:00:00', 8, FALSE, 0, FALSE, FALSE, TRUE, 'present'),
('ATT005', 'EMP003', '2025-01-03', '23:00:00', '07:00:00', 8, FALSE, 0, FALSE, FALSE, TRUE, 'present');
