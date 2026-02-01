-- HR4 Hospital HR Management System - Extended Database Schema
-- Complete production-ready schema for hospital scale deployment (Philippines)
-- MySQL 8.0+
-- All modules: HR Core, Compensation, Payroll, Time & Attendance, Leave, HMO, Analytics

CREATE DATABASE IF NOT EXISTS hr4_hospital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr4_hospital;

-- ==========================================
-- HR CORE MODULE
-- ==========================================

-- Users Table (Authentication)
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
    cost_center_code VARCHAR(20) UNIQUE,
    parent_department_id VARCHAR(20),
    budget DECIMAL(15, 2),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id),
    FOREIGN KEY (parent_department_id) REFERENCES departments(id),
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_parent_dept (parent_department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Salary Grades Table (Philippine classification)
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

-- Positions Table
CREATE TABLE positions (
    id VARCHAR(20) PRIMARY KEY,
    position_code VARCHAR(50) NOT NULL UNIQUE,
    position_name VARCHAR(255) NOT NULL UNIQUE,
    department_id VARCHAR(20),
    job_grade_id VARCHAR(20),
    reports_to_position_id VARCHAR(20),
    min_qualification TEXT,
    responsibilities TEXT,
    key_competencies JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (job_grade_id) REFERENCES salary_grades(id),
    FOREIGN KEY (reports_to_position_id) REFERENCES positions(id),
    INDEX idx_position_code (position_code),
    INDEX idx_department_id (department_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employees Table (Master Employee Record)
CREATE TABLE employees (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL UNIQUE,
    employee_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    civil_status ENUM('single', 'married', 'widowed', 'separated', 'divorced'),
    nationality VARCHAR(50),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20),
    tin VARCHAR(20) UNIQUE,
    philhealth_id VARCHAR(50),
    sss_id VARCHAR(20),
    pagibig_id VARCHAR(20),
    position_id VARCHAR(20),
    department_id VARCHAR(20),
    hire_date DATE NOT NULL,
    employment_type ENUM('full-time', 'part-time', 'contract', 'casual', 'job_order', 'regular', 'contractual', 'probationary') DEFAULT 'full-time',
    salary_grade_id VARCHAR(20),
    manager_id VARCHAR(20),
    base_salary DECIMAL(12, 2),
    status ENUM('active', 'inactive', 'on_leave', 'terminated', 'resigned', 'retired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (salary_grade_id) REFERENCES salary_grades(id),
    FOREIGN KEY (manager_id) REFERENCES employees(id),
    INDEX idx_employee_code (employee_code),
    INDEX idx_email (email),
    INDEX idx_department_id (department_id),
    INDEX idx_status (status),
    INDEX idx_hire_date (hire_date),
    INDEX idx_manager_id (manager_id),
    INDEX idx_salary_grade_id (salary_grade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employment Status History
CREATE TABLE employment_status_history (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    previous_status ENUM('active', 'on_leave', 'terminated', 'resigned', 'retired'),
    new_status ENUM('active', 'on_leave', 'terminated', 'resigned', 'retired'),
    effective_date DATE NOT NULL,
    reason TEXT,
    changed_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employment History (Promotions, Transfers, etc.)
CREATE TABLE employment_history (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    change_type ENUM('hire', 'promotion', 'demotion', 'lateral_transfer', 'role_change') NOT NULL,
    previous_position_id VARCHAR(20),
    new_position_id VARCHAR(20),
    previous_department_id VARCHAR(20),
    new_department_id VARCHAR(20),
    previous_salary DECIMAL(12, 2),
    new_salary DECIMAL(12, 2),
    effective_date DATE NOT NULL,
    reason TEXT,
    approved_by VARCHAR(20),
    approval_date DATETIME,
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (previous_position_id) REFERENCES positions(id),
    FOREIGN KEY (new_position_id) REFERENCES positions(id),
    FOREIGN KEY (previous_department_id) REFERENCES departments(id),
    FOREIGN KEY (new_department_id) REFERENCES departments(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_change_type (change_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cost Centers
CREATE TABLE cost_centers (
    id VARCHAR(20) PRIMARY KEY,
    cost_center_code VARCHAR(20) NOT NULL UNIQUE,
    cost_center_name VARCHAR(255) NOT NULL,
    department_id VARCHAR(20),
    manager_id VARCHAR(20),
    budget_amount DECIMAL(15, 2),
    budget_year INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (manager_id) REFERENCES employees(id),
    INDEX idx_cost_center_code (cost_center_code),
    INDEX idx_department_id (department_id),
    INDEX idx_budget_year (budget_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Benefits (Non-cash)
CREATE TABLE benefits (
    id VARCHAR(20) PRIMARY KEY,
    benefit_name VARCHAR(255) NOT NULL,
    benefit_type ENUM('health_insurance', 'life_insurance', 'disability', 'dental', 'vision', 'retirement', 'other') NOT NULL,
    coverage VARCHAR(255),
    employee_cost DECIMAL(12, 2),
    employer_cost DECIMAL(12, 2),
    description TEXT,
    applicable_employee_types JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_benefit_type (benefit_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Categories Table
CREATE TABLE document_categories (
    id VARCHAR(20) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Types Table
CREATE TABLE document_types (
    id VARCHAR(20) PRIMARY KEY,
    category_id VARCHAR(20) NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    requires_expiry BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES document_categories(id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Documents Table (Enhanced)
CREATE TABLE employee_documents (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    document_type_id VARCHAR(20) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    file_type VARCHAR(50),
    issue_date DATE,
    expiry_date DATE,
    status ENUM('valid', 'expired', 'missing', 'pending') DEFAULT 'valid',
    uploaded_by VARCHAR(20),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by VARCHAR(20),
    verified_date DATETIME,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (document_type_id) REFERENCES document_types(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_document_type_id (document_type_id),
    INDEX idx_status (status),
    INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Legacy documents table (keeping for backward compatibility, can be migrated later)
CREATE TABLE documents (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    document_type ENUM('tin', 'sss', 'philhealth', 'pagibig', 'birth_certificate', 'marriage_cert', 'passport', 'license', 'medical_clearance', 'other') NOT NULL,
    document_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    file_path VARCHAR(255),
    status ENUM('valid', 'expired', 'missing') DEFAULT 'valid',
    verified_by VARCHAR(20),
    verified_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_document_type (document_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Skills
CREATE TABLE skills (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    skill_level ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL,
    proficiency_percentage INT CHECK (proficiency_percentage >= 0 AND proficiency_percentage <= 100),
    certification_number VARCHAR(100),
    certification_valid_from DATE,
    certification_valid_to DATE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_skill_name (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Roles (RBAC)
CREATE TABLE user_roles (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    role ENUM('admin', 'hr_manager', 'payroll_officer', 'finance_officer', 'employee') NOT NULL,
    permissions JSON,
    department_id VARCHAR(20),
    effective_date DATE,
    end_date DATE,
    granted_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (granted_by) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_role (role),
    INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Manager Relationships
CREATE TABLE manager_relationships (
    id VARCHAR(20) PRIMARY KEY,
    manager_id VARCHAR(20) NOT NULL,
    subordinate_id VARCHAR(20) NOT NULL,
    relationship_type ENUM('direct_manager', 'skip_level_manager', 'dotted_line') DEFAULT 'direct_manager',
    effective_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES employees(id),
    FOREIGN KEY (subordinate_id) REFERENCES employees(id),
    INDEX idx_manager_id (manager_id),
    INDEX idx_subordinate_id (subordinate_id),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Organization Parameters
CREATE TABLE organization_parameters (
    id VARCHAR(20) PRIMARY KEY,
    param_key VARCHAR(100) NOT NULL UNIQUE,
    param_value TEXT,
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    last_updated_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (last_updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- COMPENSATION MODULE
-- ==========================================

-- Compensation Templates
CREATE TABLE compensation_templates (
    id VARCHAR(20) PRIMARY KEY,
    position_id VARCHAR(20),
    grade_id VARCHAR(20),
    employee_type ENUM('doctor', 'nurse', 'medical_tech', 'allied_health', 'admin', 'support', 'contractual', 'job_order') NOT NULL,
    grade_step INT DEFAULT 1,
    monthly_rate DECIMAL(12, 2) NOT NULL,
    daily_rate DECIMAL(12, 2),
    hourly_rate DECIMAL(10, 2),
    effective_date DATE NOT NULL,
    expiration_date DATE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (grade_id) REFERENCES salary_grades(id),
    INDEX idx_position_id (position_id),
    INDEX idx_grade_id (grade_id),
    INDEX idx_employee_type (employee_type),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Compensation
CREATE TABLE employee_compensation (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    template_id VARCHAR(20),
    monthly_salary DECIMAL(12, 2) NOT NULL,
    daily_rate DECIMAL(12, 2),
    hourly_rate DECIMAL(10, 2),
    effective_date DATE NOT NULL,
    end_date DATE,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(20),
    approved_date DATETIME,
    reason_for_change VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (template_id) REFERENCES compensation_templates(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_approval_status (approval_status),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Allowance Components
CREATE TABLE allowance_components (
    id VARCHAR(20) PRIMARY KEY,
    component_code VARCHAR(20) NOT NULL UNIQUE,
    component_name VARCHAR(100) NOT NULL,
    allowance_type ENUM('hazard_pay', 'shift_differential', 'on_call', 'meal', 'uniform', 'transportation', 'rice_subsidy', 'other') NOT NULL,
    amount DECIMAL(12, 2),
    percentage_of_salary DECIMAL(5, 2),
    calculation_basis ENUM('fixed', 'percentage', 'daily_rate', 'hourly_rate') DEFAULT 'fixed',
    frequency ENUM('monthly', 'daily', 'per_shift', 'one_time') DEFAULT 'monthly',
    applicable_employee_types JSON,
    applicable_grades JSON,
    min_hours_required DECIMAL(5, 2),
    tax_treatment ENUM('taxable', 'non_taxable') DEFAULT 'taxable',
    shift_type_applicable VARCHAR(50),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_component_code (component_code),
    INDEX idx_allowance_type (allowance_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Allowances
CREATE TABLE employee_allowances (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    allowance_component_id VARCHAR(20) NOT NULL,
    assigned_amount DECIMAL(12, 2),
    assigned_percentage DECIMAL(5, 2),
    effective_date DATE NOT NULL,
    end_date DATE,
    reason VARCHAR(255),
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(20),
    approved_date DATETIME,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (allowance_component_id) REFERENCES allowance_components(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_allowance_component_id (allowance_component_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_approval_status (approval_status),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deduction Components
CREATE TABLE deduction_components (
    id VARCHAR(20) PRIMARY KEY,
    component_code VARCHAR(20) NOT NULL UNIQUE,
    component_name VARCHAR(100) NOT NULL,
    deduction_type ENUM('sss', 'philhealth', 'pag_ibig', 'tax_withholding', 'loan', 'insurance', 'union', 'other') NOT NULL,
    amount DECIMAL(12, 2),
    percentage_of_salary DECIMAL(5, 2),
    calculation_basis ENUM('fixed', 'percentage', 'tax_table') DEFAULT 'fixed',
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
    INDEX idx_is_mandatory (is_mandatory),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Deductions
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
    INDEX idx_employee_id (employee_id),
    INDEX idx_deduction_component_id (deduction_component_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Statutory Contributions (SSS, PhilHealth, Pag-IBIG)
CREATE TABLE statutory_contributions (
    id VARCHAR(20) PRIMARY KEY,
    contribution_type ENUM('sss', 'philhealth', 'pag_ibig') NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    employee_rate DECIMAL(5, 2) NOT NULL,
    employer_rate DECIMAL(5, 2) NOT NULL,
    min_salary DECIMAL(12, 2),
    max_salary DECIMAL(12, 2),
    max_contribution DECIMAL(12, 2),
    status ENUM('active', 'inactive') DEFAULT 'active',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_contribution_type (contribution_type),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Withholding Tax Brackets (BIR 2025)
CREATE TABLE withholding_tax_brackets (
    id VARCHAR(20) PRIMARY KEY,
    tax_year INT NOT NULL,
    salary_min DECIMAL(12, 2) NOT NULL,
    salary_max DECIMAL(12, 2) NOT NULL,
    tax_percentage DECIMAL(5, 2) NOT NULL,
    excess_amount DECIMAL(12, 2),
    annual_exemption DECIMAL(12, 2),
    monthly_exemption DECIMAL(12, 2),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tax_year (tax_year),
    INDEX idx_salary_range (salary_min, salary_max),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Overtime Records
CREATE TABLE overtime_records (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    overtime_date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    overtime_type ENUM('regular', 'holiday', 'night', 'special') DEFAULT 'regular',
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
    INDEX idx_employee_id (employee_id),
    INDEX idx_overtime_date (overtime_date),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gross Pay Computation
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
    INDEX idx_employee_id (employee_id),
    INDEX idx_period (period_start_date, period_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compensation History (Audit Trail)
CREATE TABLE compensation_history (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    change_type ENUM('salary_increase', 'salary_decrease', 'allowance_add', 'allowance_remove', 'deduction_add', 'deduction_remove', 'promotion') NOT NULL,
    entity_type VARCHAR(50),
    previous_value DECIMAL(12, 2),
    new_value DECIMAL(12, 2),
    effective_date DATE NOT NULL,
    changed_by VARCHAR(20),
    reason TEXT,
    approval_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_change_type (change_type),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compensation Approvals
CREATE TABLE compensation_approvals (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20),
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
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approver_id) REFERENCES users(id),
    FOREIGN KEY (next_approver_id) REFERENCES users(id),
    INDEX idx_approval_type (approval_type),
    INDEX idx_approval_status (approval_status),
    INDEX idx_requested_date (requested_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TIME & ATTENDANCE MODULE
-- ==========================================

-- Shift Definitions
CREATE TABLE shift_definitions (
    id VARCHAR(20) PRIMARY KEY,
    shift_code VARCHAR(20) NOT NULL UNIQUE,
    shift_name VARCHAR(100) NOT NULL,
    shift_type ENUM('day', 'night', 'rotating', 'flexible', 'on_call') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(5, 2),
    break_hours DECIMAL(5, 2),
    min_hours_per_day DECIMAL(5, 2),
    applicable_days JSON,
    night_shift_hours_start TIME,
    night_shift_hours_end TIME,
    shift_differential_applicable BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shift_code (shift_code),
    INDEX idx_shift_type (shift_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shift Templates
CREATE TABLE shift_templates (
    id VARCHAR(20) PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    template_code VARCHAR(20) NOT NULL UNIQUE,
    department_id VARCHAR(20),
    description TEXT,
    template_pattern JSON,
    rest_days_per_week INT,
    applicable_employee_types JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_template_code (template_code),
    INDEX idx_department_id (department_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Shift Assignments
CREATE TABLE employee_shift_assignments (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    shift_id VARCHAR(20),
    template_id VARCHAR(20),
    effective_date DATE NOT NULL,
    end_date DATE,
    assigned_by VARCHAR(20),
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (shift_id) REFERENCES shift_definitions(id),
    FOREIGN KEY (template_id) REFERENCES shift_templates(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Logs
CREATE TABLE attendance_logs (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    attendance_date DATE NOT NULL,
    shift_id VARCHAR(20),
    time_in DATETIME,
    time_out DATETIME,
    hours_worked DECIMAL(5, 2),
    break_duration_minutes INT DEFAULT 0,
    status ENUM('present', 'absent', 'late', 'undertime', 'overtime', 'leave') DEFAULT 'present',
    reason_if_absent VARCHAR(255),
    leave_type_id VARCHAR(20),
    approved_by VARCHAR(20),
    approved_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (shift_id) REFERENCES shift_definitions(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_status (status),
    UNIQUE KEY idx_unique_attendance (employee_id, attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Late and Undertime Records
CREATE TABLE late_and_undertime_records (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    record_date DATE NOT NULL,
    incident_type ENUM('late', 'undertime', 'both') NOT NULL,
    minutes_late INT,
    minutes_undertime INT,
    reason VARCHAR(255),
    document_proof VARCHAR(255),
    action_taken ENUM('warning', 'memo', 'deduction', 'none') DEFAULT 'none',
    deduction_amount DECIMAL(12, 2),
    approved_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_record_date (record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Night Differential Tracking
CREATE TABLE night_differential_tracking (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    work_date DATE NOT NULL,
    night_hours DECIMAL(5, 2) NOT NULL,
    shift_id VARCHAR(20),
    night_shift_rate DECIMAL(10, 2),
    differential_amount DECIMAL(12, 2),
    included_in_payroll_id VARCHAR(20),
    verified_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (shift_id) REFERENCES shift_definitions(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_work_date (work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shift Swap Requests
CREATE TABLE shift_swap_requests (
    id VARCHAR(20) PRIMARY KEY,
    requesting_employee_id VARCHAR(20) NOT NULL,
    target_employee_id VARCHAR(20) NOT NULL,
    requested_shift_date DATE NOT NULL,
    target_shift_date DATE NOT NULL,
    reason TEXT,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(20),
    approval_date DATETIME,
    status ENUM('pending', 'approved', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requesting_employee_id) REFERENCES employees(id),
    FOREIGN KEY (target_employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_requesting_employee (requesting_employee_id),
    INDEX idx_target_employee (target_employee_id),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Summary Monthly
CREATE TABLE attendance_summary_monthly (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    year_month CHAR(7) NOT NULL,
    total_days_worked INT,
    total_absent_days INT,
    total_late_incidents INT,
    total_minutes_late INT,
    total_undertime_minutes INT,
    total_overtime_hours DECIMAL(5, 2),
    total_night_differential_hours DECIMAL(5, 2),
    leave_days_used INT,
    computed_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (computed_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_year_month (year_month),
    UNIQUE KEY idx_unique_summary (employee_id, year_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- LEAVE MANAGEMENT MODULE
-- ==========================================

-- Leave Types
CREATE TABLE leave_types (
    id VARCHAR(20) PRIMARY KEY,
    leave_code VARCHAR(20) NOT NULL UNIQUE,
    leave_name VARCHAR(100) NOT NULL,
    leave_type ENUM('vacation', 'sick', 'maternal', 'paternal', 'bereavement', 'emergency', 'offsetting', 'unpaid', 'special', 'hazard_duty', 'study', 'rehabilitation') NOT NULL,
    max_days_per_year INT,
    requires_attachment BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    affects_payroll BOOLEAN DEFAULT TRUE,
    deduction_type VARCHAR(50),
    applicable_employee_types JSON,
    applicable_gender ENUM('all', 'male', 'female'),
    carryover_allowed BOOLEAN DEFAULT FALSE,
    carryover_limit INT,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_leave_code (leave_code),
    INDEX idx_leave_type (leave_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Policies
CREATE TABLE leave_policies (
    id VARCHAR(20) PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL,
    policy_level ENUM('company', 'department') DEFAULT 'company',
    applicable_department_id VARCHAR(20),
    leave_type_id VARCHAR(20) NOT NULL,
    days_allowed INT,
    accrual_method ENUM('fixed', 'prorated', 'monthly_accumulation') DEFAULT 'fixed',
    prorated_days_per_month DECIMAL(5, 2),
    min_months_to_accrue INT,
    effective_date DATE NOT NULL,
    end_date DATE,
    remarks TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (applicable_department_id) REFERENCES departments(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    INDEX idx_leave_type_id (leave_type_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Balances
CREATE TABLE leave_balances (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    leave_type_id VARCHAR(20) NOT NULL,
    calendar_year INT NOT NULL,
    opening_balance DECIMAL(5, 2),
    days_accrued DECIMAL(5, 2),
    days_used DECIMAL(5, 2),
    days_cancelled DECIMAL(5, 2),
    days_forfeited DECIMAL(5, 2),
    closing_balance DECIMAL(5, 2),
    carryover_from_previous_year DECIMAL(5, 2),
    last_updated_date DATE,
    computed_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (computed_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_leave_type_id (leave_type_id),
    UNIQUE KEY idx_unique_balance (employee_id, leave_type_id, calendar_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Applications
CREATE TABLE leave_applications (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    leave_type_id VARCHAR(20) NOT NULL,
    application_date DATE NOT NULL,
    leave_start_date DATE NOT NULL,
    leave_end_date DATE NOT NULL,
    total_leave_days DECIMAL(5, 2) NOT NULL,
    reason TEXT,
    attachment_path VARCHAR(255),
    approval_status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_leave_type_id (leave_type_id),
    INDEX idx_application_date (application_date),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Approvals
CREATE TABLE leave_approvals (
    id VARCHAR(20) PRIMARY KEY,
    leave_application_id VARCHAR(20) NOT NULL,
    approval_level INT NOT NULL,
    approver_id VARCHAR(20) NOT NULL,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approval_date DATETIME,
    approval_remarks TEXT,
    next_approver_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (leave_application_id) REFERENCES leave_applications(id),
    FOREIGN KEY (approver_id) REFERENCES users(id),
    FOREIGN KEY (next_approver_id) REFERENCES users(id),
    INDEX idx_leave_application_id (leave_application_id),
    INDEX idx_approver_id (approver_id),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Utilization History
CREATE TABLE leave_utilization_history (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    leave_type_id VARCHAR(20) NOT NULL,
    leave_date DATE NOT NULL,
    days_used DECIMAL(5, 2) NOT NULL,
    leave_application_id VARCHAR(20),
    calendar_year INT NOT NULL,
    processed_by VARCHAR(20),
    processed_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (leave_application_id) REFERENCES leave_applications(id),
    FOREIGN KEY (processed_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_leave_type_id (leave_type_id),
    INDEX idx_calendar_year (calendar_year),
    INDEX idx_leave_date (leave_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- PAYROLL MODULE
-- ==========================================

-- Payroll Runs
CREATE TABLE payroll_runs (
    id VARCHAR(20) PRIMARY KEY,
    payroll_run_code VARCHAR(50) NOT NULL UNIQUE,
    payroll_period VARCHAR(10) NOT NULL,
    payroll_type ENUM('monthly', '13th_month', 'special', 'adjustment') DEFAULT 'monthly',
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    cutoff_date DATE,
    payment_date DATE,
    total_employees INT,
    total_gross_salary DECIMAL(15, 2),
    total_deductions DECIMAL(15, 2),
    total_net_salary DECIMAL(15, 2),
    total_employer_contribution DECIMAL(15, 2),
    approval_status ENUM('draft', 'computed', 'reviewed', 'approved', 'released', 'paid') DEFAULT 'draft',
    created_by VARCHAR(20),
    reviewed_by VARCHAR(20),
    approved_by VARCHAR(20),
    released_date DATETIME,
    paid_date DATETIME,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_payroll_run_code (payroll_run_code),
    INDEX idx_payroll_period (payroll_period),
    INDEX idx_approval_status (approval_status),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Headers
CREATE TABLE payroll_headers (
    id VARCHAR(20) PRIMARY KEY,
    payroll_run_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    gross_pay DECIMAL(12, 2),
    total_earnings DECIMAL(12, 2),
    total_deductions DECIMAL(12, 2),
    net_pay DECIMAL(12, 2),
    employer_contribution DECIMAL(12, 2),
    total_cost DECIMAL(12, 2),
    approval_status ENUM('computed', 'reviewed', 'approved') DEFAULT 'computed',
    computed_by VARCHAR(20),
    computed_date DATETIME,
    reviewed_by VARCHAR(20),
    approved_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (computed_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_payroll_run_id (payroll_run_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_approval_status (approval_status),
    UNIQUE KEY idx_unique_payroll_header (payroll_run_id, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Line Items (Earnings)
CREATE TABLE payroll_line_items (
    id VARCHAR(20) PRIMARY KEY,
    payroll_header_id VARCHAR(20) NOT NULL,
    line_item_type ENUM('base_salary', 'allowance', 'overtime', 'holiday_pay', 'night_differential', 'special_pay', 'other') NOT NULL,
    component_id VARCHAR(20),
    component_name VARCHAR(100),
    amount DECIMAL(12, 2),
    quantity DECIMAL(5, 2),
    rate DECIMAL(10, 2),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_header_id) REFERENCES payroll_headers(id),
    INDEX idx_payroll_header_id (payroll_header_id),
    INDEX idx_line_item_type (line_item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Deductions
CREATE TABLE payroll_deductions (
    id VARCHAR(20) PRIMARY KEY,
    payroll_header_id VARCHAR(20) NOT NULL,
    deduction_type ENUM('sss', 'philhealth', 'pag_ibig', 'tax_withholding', 'loan', 'insurance', 'union', 'hmo', 'other') NOT NULL,
    component_id VARCHAR(20),
    component_name VARCHAR(100),
    employee_share DECIMAL(12, 2),
    employer_share DECIMAL(12, 2),
    total_deduction DECIMAL(12, 2),
    reference_number VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_header_id) REFERENCES payroll_headers(id),
    INDEX idx_payroll_header_id (payroll_header_id),
    INDEX idx_deduction_type (deduction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Government Contributions
CREATE TABLE government_contributions (
    id VARCHAR(20) PRIMARY KEY,
    payroll_run_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    contribution_type ENUM('sss', 'philhealth', 'pag_ibig') NOT NULL,
    employee_contribution DECIMAL(12, 2),
    employer_contribution DECIMAL(12, 2),
    total_contribution DECIMAL(12, 2),
    contribution_month DATE,
    status ENUM('computed', 'transmitted', 'paid') DEFAULT 'computed',
    transmitted_to_agency_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_payroll_run_id (payroll_run_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_contribution_type (contribution_type),
    INDEX idx_contribution_month (contribution_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payslips
CREATE TABLE payslips (
    id VARCHAR(20) PRIMARY KEY,
    payroll_header_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    payroll_period VARCHAR(10),
    period_start_date DATE,
    period_end_date DATE,
    gross_salary DECIMAL(12, 2),
    total_deductions DECIMAL(12, 2),
    net_salary DECIMAL(12, 2),
    status ENUM('generated', 'sent', 'viewed', 'downloaded') DEFAULT 'generated',
    generated_date DATETIME,
    sent_date DATETIME,
    viewed_date DATETIME,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_header_id) REFERENCES payroll_headers(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_payroll_period (payroll_period),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13th Month Computation
CREATE TABLE thirteenth_month_computation (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    calendar_year INT NOT NULL,
    january_to_june_gross DECIMAL(12, 2),
    july_to_december_gross DECIMAL(12, 2),
    average_gross_monthly DECIMAL(12, 2),
    thirteenth_month_pay DECIMAL(12, 2),
    less_advances_received DECIMAL(12, 2),
    net_thirteenth_month DECIMAL(12, 2),
    approval_status ENUM('computed', 'approved') DEFAULT 'computed',
    approved_by VARCHAR(20),
    payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee_id (employee_id),
    UNIQUE KEY idx_unique_13th (employee_id, calendar_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Net Pay Computation
CREATE TABLE net_pay_computation (
    id VARCHAR(20) PRIMARY KEY,
    payroll_header_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    gross_pay DECIMAL(12, 2),
    total_allowances DECIMAL(12, 2),
    total_mandatory_deductions DECIMAL(12, 2),
    total_optional_deductions DECIMAL(12, 2),
    net_pay_before_tax DECIMAL(12, 2),
    withholding_tax DECIMAL(12, 2),
    net_pay_after_tax DECIMAL(12, 2),
    total_employer_cost DECIMAL(12, 2),
    computation_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_header_id) REFERENCES payroll_headers(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_payroll_header_id (payroll_header_id),
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tax Returns Summary
CREATE TABLE tax_returns_summary (
    id VARCHAR(20) PRIMARY KEY,
    tax_year INT NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    gross_compensation DECIMAL(15, 2),
    taxable_income DECIMAL(15, 2),
    total_withholding_tax DECIMAL(15, 2),
    annual_exemption DECIMAL(15, 2),
    sss_contribution DECIMAL(15, 2),
    philhealth_contribution DECIMAL(15, 2),
    pag_ibig_contribution DECIMAL(15, 2),
    tax_return_filed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_tax_year (tax_year),
    UNIQUE KEY idx_unique_tax_summary (tax_year, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Approvals
CREATE TABLE payroll_approvals (
    id VARCHAR(20) PRIMARY KEY,
    payroll_run_id VARCHAR(20) NOT NULL,
    approval_stage INT NOT NULL,
    approval_stage_name VARCHAR(50),
    approver_id VARCHAR(20),
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approval_date DATETIME,
    approval_remarks TEXT,
    next_approver_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
    FOREIGN KEY (approver_id) REFERENCES users(id),
    FOREIGN KEY (next_approver_id) REFERENCES users(id),
    INDEX idx_payroll_run_id (payroll_run_id),
    INDEX idx_approval_stage (approval_stage),
    INDEX idx_approver_id (approver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Audit Log
CREATE TABLE payroll_audit_log (
    id VARCHAR(20) PRIMARY KEY,
    payroll_header_id VARCHAR(20),
    change_type ENUM('computation_change', 'line_item_add', 'line_item_remove', 'deduction_change', 'approval_change') NOT NULL,
    previous_value DECIMAL(12, 2),
    new_value DECIMAL(12, 2),
    changed_by VARCHAR(20),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_header_id) REFERENCES payroll_headers(id),
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_payroll_header_id (payroll_header_id),
    INDEX idx_changed_by (changed_by),
    INDEX idx_change_type (change_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- HMO MODULE
-- ==========================================

-- HMO Providers
CREATE TABLE hmo_providers (
    id VARCHAR(20) PRIMARY KEY,
    provider_code VARCHAR(50) NOT NULL UNIQUE,
    provider_name VARCHAR(255) NOT NULL UNIQUE,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    contact_person VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_provider_code (provider_code),
    INDEX idx_provider_name (provider_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Plans
CREATE TABLE hmo_plans (
    id VARCHAR(20) PRIMARY KEY,
    provider_id VARCHAR(20) NOT NULL,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    plan_name VARCHAR(255) NOT NULL,
    plan_type ENUM('basic', 'standard', 'premium', 'executive') DEFAULT 'basic',
    coverage_amount DECIMAL(15, 2),
    annual_limit DECIMAL(15, 2),
    monthly_premium_employee DECIMAL(12, 2),
    monthly_premium_employer DECIMAL(12, 2),
    dependent_premium DECIMAL(12, 2),
    max_dependents INT,
    coverage_details JSON,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES hmo_providers(id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_plan_code (plan_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Enrollments
CREATE TABLE hmo_enrollments (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    plan_id VARCHAR(20) NOT NULL,
    enrollment_date DATE NOT NULL,
    termination_date DATE,
    dependent_count INT,
    status ENUM('active', 'terminated', 'suspended') DEFAULT 'active',
    effective_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (plan_id) REFERENCES hmo_plans(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_enrollment_date (enrollment_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Dependents
CREATE TABLE hmo_dependents (
    id VARCHAR(20) PRIMARY KEY,
    enrollment_id VARCHAR(20) NOT NULL,
    dependent_name VARCHAR(255) NOT NULL,
    relationship ENUM('spouse', 'child', 'parent', 'sibling') NOT NULL,
    date_of_birth DATE,
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES hmo_enrollments(id),
    INDEX idx_enrollment_id (enrollment_id),
    INDEX idx_relationship (relationship)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Claims
CREATE TABLE hmo_claims (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    enrollment_id VARCHAR(20),
    claim_date DATE NOT NULL,
    claim_amount DECIMAL(12, 2) NOT NULL,
    service_provider VARCHAR(255),
    description TEXT,
    attachment_path VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
    approved_amount DECIMAL(12, 2),
    approval_date DATETIME,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (enrollment_id) REFERENCES hmo_enrollments(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_enrollment_id (enrollment_id),
    INDEX idx_claim_date (claim_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Deduction Mapping
CREATE TABLE hmo_deduction_mapping (
    id VARCHAR(20) PRIMARY KEY,
    plan_assignment_id VARCHAR(20),
    deduction_component_id VARCHAR(20),
    employee_share DECIMAL(12, 2),
    employer_share DECIMAL(12, 2),
    dependent_share DECIMAL(12, 2),
    total_premium DECIMAL(12, 2),
    deduction_frequency ENUM('monthly', 'per_payroll') DEFAULT 'monthly',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (deduction_component_id) REFERENCES deduction_components(id),
    INDEX idx_deduction_component_id (deduction_component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HMO Provider Contracts
CREATE TABLE hmo_provider_contracts (
    id VARCHAR(20) PRIMARY KEY,
    provider_id VARCHAR(20) NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE,
    service_level TEXT,
    discount_rate DECIMAL(5, 2),
    renewal_terms TEXT,
    status ENUM('active', 'expired', 'terminated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES hmo_providers(id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_contract_start_date (contract_start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- ANALYTICS & REPORTING MODULE
-- ==========================================

-- Payroll Cost Summary Monthly
CREATE TABLE payroll_cost_summary_monthly (
    id VARCHAR(20) PRIMARY KEY,
    year_month CHAR(7) NOT NULL,
    department_id VARCHAR(20),
    employee_count INT,
    total_gross_salary DECIMAL(15, 2),
    total_allowances DECIMAL(15, 2),
    total_deductions DECIMAL(15, 2),
    total_net_salary DECIMAL(15, 2),
    total_employer_contribution DECIMAL(15, 2),
    total_payroll_cost DECIMAL(15, 2),
    average_salary_per_employee DECIMAL(12, 2),
    computed_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (computed_by) REFERENCES users(id),
    INDEX idx_year_month (year_month),
    INDEX idx_department_id (department_id),
    UNIQUE KEY idx_unique_payroll_summary (year_month, department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Summary Analytics
CREATE TABLE attendance_summary_analytics (
    id VARCHAR(20) PRIMARY KEY,
    year_month CHAR(7) NOT NULL,
    department_id VARCHAR(20),
    employee_count INT,
    total_present_days INT,
    total_absent_days INT,
    total_late_incidents INT,
    avg_tardiness_minutes DECIMAL(5, 2),
    total_overtime_hours DECIMAL(10, 2),
    total_night_hours DECIMAL(10, 2),
    attendance_rate_percentage DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_year_month (year_month),
    INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Usage Summary
CREATE TABLE leave_usage_summary (
    id VARCHAR(20) PRIMARY KEY,
    calendar_year INT NOT NULL,
    month INT NOT NULL,
    department_id VARCHAR(20),
    leave_type_id VARCHAR(20),
    employee_count_used INT,
    total_days_used DECIMAL(5, 2),
    avg_days_per_employee DECIMAL(5, 2),
    total_balance_used DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    INDEX idx_calendar_year (calendar_year),
    INDEX idx_month (month),
    INDEX idx_department_id (department_id),
    INDEX idx_leave_type_id (leave_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Overtime Cost Analysis
CREATE TABLE overtime_cost_analysis (
    id VARCHAR(20) PRIMARY KEY,
    year_month CHAR(7) NOT NULL,
    department_id VARCHAR(20),
    total_overtime_hours DECIMAL(10, 2),
    total_overtime_cost DECIMAL(15, 2),
    avg_overtime_per_employee DECIMAL(10, 2),
    employees_with_overtime INT,
    top_overtime_earner_id VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (top_overtime_earner_id) REFERENCES employees(id),
    INDEX idx_year_month (year_month),
    INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compensation Analysis
CREATE TABLE compensation_analysis (
    id VARCHAR(20) PRIMARY KEY,
    year_month CHAR(7) NOT NULL,
    department_id VARCHAR(20),
    salary_grade_id VARCHAR(20),
    employee_count INT,
    total_base_salary DECIMAL(15, 2),
    total_allowances DECIMAL(15, 2),
    avg_salary DECIMAL(12, 2),
    min_salary DECIMAL(12, 2),
    max_salary DECIMAL(12, 2),
    salary_range DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (salary_grade_id) REFERENCES salary_grades(id),
    INDEX idx_year_month (year_month),
    INDEX idx_department_id (department_id),
    INDEX idx_salary_grade_id (salary_grade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Metrics Snapshot
CREATE TABLE employee_metrics_snapshot (
    id VARCHAR(20) PRIMARY KEY,
    year_month CHAR(7) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    gross_pay DECIMAL(12, 2),
    net_pay DECIMAL(12, 2),
    total_deductions DECIMAL(12, 2),
    attendance_rate DECIMAL(5, 2),
    days_absent INT,
    overtime_hours DECIMAL(5, 2),
    leave_days_used INT,
    on_time_rate DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_year_month (year_month),
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Department Metrics Dashboard
CREATE TABLE department_metrics_dashboard (
    id VARCHAR(20) PRIMARY KEY,
    year_month CHAR(7) NOT NULL,
    department_id VARCHAR(20) NOT NULL,
    total_employees INT,
    headcount_change INT,
    total_payroll_budget DECIMAL(15, 2),
    actual_payroll_cost DECIMAL(15, 2),
    budget_variance DECIMAL(15, 2),
    avg_attendance_rate DECIMAL(5, 2),
    avg_leave_usage DECIMAL(5, 2),
    employee_turnover_rate DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_year_month (year_month),
    INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compliance Metrics
CREATE TABLE compliance_metrics (
    id VARCHAR(20) PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    total_employees INT,
    sss_contribution_status ENUM('compliant', 'pending', 'non_compliant') DEFAULT 'pending',
    philhealth_status ENUM('compliant', 'pending', 'non_compliant') DEFAULT 'pending',
    pag_ibig_status ENUM('compliant', 'pending', 'non_compliant') DEFAULT 'pending',
    tax_return_filed BOOLEAN DEFAULT FALSE,
    tax_withholding_amount DECIMAL(15, 2),
    outstanding_amount DECIMAL(15, 2),
    last_compliance_check DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_year (year),
    INDEX idx_month (month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SUPPORTING MODULES (Notifications, Audit, etc.)
-- ==========================================

-- Notifications
CREATE TABLE notifications (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    notification_type ENUM('leave_approved', 'leave_rejected', 'payroll_ready', 'attendance_warning', 'system_alert', 'reminder') DEFAULT 'system_alert',
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(20),
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification Templates
CREATE TABLE notification_templates (
    id VARCHAR(20) PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    template_type ENUM('leave_approval', 'payroll_ready', 'attendance_alert', 'general_alert') NOT NULL,
    subject VARCHAR(255),
    message_template TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Approval Workflows
CREATE TABLE approval_workflows (
    id VARCHAR(20) PRIMARY KEY,
    workflow_name VARCHAR(100) NOT NULL,
    workflow_type ENUM('leave_approval', 'salary_change', 'overtime_approval', 'payroll_approval') NOT NULL,
    levels INT,
    level_config JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs
CREATE TABLE audit_logs (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20),
    action VARCHAR(100),
    table_name VARCHAR(50),
    record_id VARCHAR(20),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status Audit Trail
CREATE TABLE status_audit_trail (
    id VARCHAR(20) PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id VARCHAR(20),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(20),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Parameters
CREATE TABLE system_parameters (
    id VARCHAR(20) PRIMARY KEY,
    param_key VARCHAR(100) NOT NULL UNIQUE,
    param_value TEXT,
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    module VARCHAR(50),
    description TEXT,
    last_updated_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (last_updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data Import Logs
CREATE TABLE data_import_logs (
    id VARCHAR(20) PRIMARY KEY,
    import_type VARCHAR(100),
    file_name VARCHAR(255),
    import_date DATETIME,
    imported_by VARCHAR(20),
    total_records INT,
    successful_records INT,
    failed_records INT,
    error_details TEXT,
    status ENUM('success', 'partial_success', 'failed') DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (imported_by) REFERENCES users(id),
    INDEX idx_import_date (import_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SAMPLE DATA INSERTION
-- ==========================================

-- Core Users
INSERT INTO users VALUES
('USR001', 'Admin System', 'admin@hr4hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'admin', 'active', NOW(), NOW(), NOW()),
('USR002', 'Sarah Manager', 'sarah@hr4hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'hr_manager', 'active', NOW(), NOW(), NOW()),
('USR003', 'John Payroll', 'payroll@hr4hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'payroll_officer', 'active', NOW(), NOW(), NOW());

-- Core Departments
INSERT INTO departments VALUES
('DEPT001', 'Human Resources', 'HR Department', 'USR001', 'CC001', NULL, 500000, 'active', NOW(), NOW()),
('DEPT002', 'Finance', 'Finance Department', 'USR002', 'CC002', NULL, 800000, 'active', NOW(), NOW()),
('DEPT003', 'Medical Services', 'Medical Department', 'USR003', 'CC003', NULL, 1200000, 'active', NOW(), NOW());

-- Salary Grades (Philippine System)
INSERT INTO salary_grades VALUES
('SG001', 1, 'Executive Management', 150000, 180000, 210000, 'Hospital Directors and Chief Officers', '["Hospital Director", "Chief Medical Officer"]', 'active', NOW(), NOW()),
('SG002', 2, 'Senior Management', 100000, 120000, 140000, 'Department Heads and Senior Specialists', '["Department Head", "Senior Doctor"]', 'active', NOW(), NOW()),
('SG003', 3, 'Middle Management', 65000, 78000, 90000, 'Supervisors and Senior Nurses', '["Supervisor", "Head Nurse"]', 'active', NOW(), NOW()),
('SG004', 4, 'Professional Staff', 45000, 52000, 60000, 'Nurses and Medical Technologists', '["Registered Nurse", "Medical Technologist"]', 'active', NOW(), NOW()),
('SG005', 5, 'Administrative Staff', 30000, 35000, 42000, 'Admin Officers and Clerks', '["Administrative Officer", "Clerk"]', 'active', NOW(), NOW()),
('SG006', 6, 'Support Staff', 20000, 23000, 28000, 'Maintenance and Housekeeping', '["Maintenance", "Security"]', 'active', NOW(), NOW()),
('SG007', 7, 'Contractual Staff', 18000, 20000, 24000, 'Part-time and Job Order', '["Relief Staff", "Job Order"]', 'active', NOW(), NOW());

-- Positions
INSERT INTO positions VALUES
('POS001', 'HR001', 'HR Manager', 'DEPT001', 'SG003', NULL, 'Bachelor\'s Degree in HR', 'Manage HR operations and employee relations', '["Leadership", "Communication", "HR Expertise"]', 'active', NOW(), NOW()),
('POS002', 'MED001', 'Registered Nurse', 'DEPT003', 'SG004', NULL, 'RN License', 'Provide patient care and medical support', '["Patient Care", "Medical Knowledge", "Compassion"]', 'active', NOW(), NOW()),
('POS003', 'MED002', 'Medical Technologist', 'DEPT003', 'SG004', NULL, 'Medical Tech License', 'Conduct laboratory tests', '["Laboratory Skills", "Precision", "Accuracy"]', 'active', NOW(), NOW());

-- Core Employees
INSERT INTO employees VALUES
('EMP001', 'USR001', 'E00001', 'John', 'Doe', 'M', 'john.doe@hr4hospital.com', '09121234567', '1985-05-15', 'male', 'married', 'Filipino', '123 Main St, Quezon City', 'Maria Doe', 'Spouse', '09121234568', '123-456-789', 'PHIL123', 'SSS123', 'PIBIG123', 'POS001', 'DEPT001', '2020-01-15', 'regular', 'SG003', NULL, 65000, 'active', NOW(), NOW()),
('EMP002', 'USR002', 'E00002', 'Jane', 'Smith', 'M', 'jane.smith@hr4hospital.com', '09189876543', '1990-03-22', 'female', 'married', 'Filipino', '456 Oak Ave, Manila', 'John Smith', 'Spouse', '09189876544', '987-654-321', 'PHIL456', 'SSS456', 'PIBIG456', 'POS002', 'DEPT003', '2021-03-20', 'regular', 'SG004', 'EMP001', 48000, 'active', NOW(), NOW()),
('EMP003', 'USR003', 'E00003', 'Michael', 'Johnson', 'A', 'michael.j@hr4hospital.com', '09101112131', '1988-07-10', 'male', 'single', 'Filipino', '789 Pine Rd, Makati', 'Robert Johnson', 'Father', '09101112132', '555-666-777', 'PHIL789', 'SSS789', 'PIBIG789', 'POS003', 'DEPT003', '2019-07-10', 'regular', 'SG004', 'EMP001', 45000, 'active', NOW(), NOW());

-- Document Categories
INSERT INTO document_categories VALUES
('DOC_CAT001', 'Personal Documents', 'Personal identification and background documents', 'active', NOW(), NOW()),
('DOC_CAT002', 'Government & Legal Documents', 'Government-issued IDs and legal documents', 'active', NOW(), NOW()),
('DOC_CAT003', 'Employment Documents', 'Employment-related contracts and records', 'active', NOW(), NOW()),
('DOC_CAT004', 'Medical & Hospital Requirements', 'Medical clearances and health records', 'active', NOW(), NOW()),
('DOC_CAT005', 'Professional Licenses', 'Professional licenses and certifications', 'active', NOW(), NOW()),
('DOC_CAT006', 'Training & Certifications', 'Training certificates and continuing education', 'active', NOW(), NOW()),
('DOC_CAT007', 'Other Records', 'Miscellaneous documents and records', 'active', NOW(), NOW());

-- Document Types
INSERT INTO document_types VALUES
('DOC_TYPE001', 'DOC_CAT001', 'Resume / CV', 'Curriculum Vitae or Resume', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE002', 'DOC_CAT001', 'Birth Certificate (PSA)', 'Philippine Statistics Authority Birth Certificate', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE003', 'DOC_CAT001', 'Marriage Certificate', 'Marriage certificate from PSA', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE004', 'DOC_CAT002', 'TIN (BIR)', 'Tax Identification Number from BIR', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE005', 'DOC_CAT002', 'SSS Number', 'Social Security System ID', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE006', 'DOC_CAT002', 'PhilHealth Number', 'Philippine Health Insurance Corporation ID', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE007', 'DOC_CAT002', 'Pag-IBIG (HDMF) Number', 'Home Development Mutual Fund ID', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE008', 'DOC_CAT002', 'NBI Clearance', 'National Bureau of Investigation Clearance', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE009', 'DOC_CAT002', 'Police Clearance', 'Police Clearance Certificate', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE010', 'DOC_CAT002', 'Barangay Clearance', 'Barangay Clearance Certificate', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE011', 'DOC_CAT002', 'Government-issued ID', 'Valid ID (Driver\'s License, Passport, etc.)', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE012', 'DOC_CAT003', 'Employment Contract', 'Employment contract or agreement', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE013', 'DOC_CAT003', 'Job Offer Letter', 'Job offer letter from employer', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE014', 'DOC_CAT003', 'Certificate of Employment', 'Certificate of Employment from previous employer', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE015', 'DOC_CAT003', 'Application Form', 'Job application form', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE016', 'DOC_CAT004', 'Pre-employment Medical Exam Result', 'Pre-employment medical examination results', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE017', 'DOC_CAT004', 'Medical Certificate', 'Medical certificate or clearance', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE018', 'DOC_CAT004', 'Drug Test Result', 'Drug test results', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE019', 'DOC_CAT004', 'Vaccination Records', 'Vaccination records and certificates', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE020', 'DOC_CAT004', 'Health Clearance', 'Health clearance certificate', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE021', 'DOC_CAT005', 'PRC License', 'Professional Regulation Commission License', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE022', 'DOC_CAT005', 'Board Rating / Certificate of Registration', 'Board exam rating and certificate', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE023', 'DOC_CAT005', 'Professional ID', 'Professional identification card', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE024', 'DOC_CAT006', 'BLS/ACLS/PALS Certificates', 'Basic/Advanced/Pediatric Life Support certificates', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE025', 'DOC_CAT006', 'Infection Control Training', 'Infection control training certificate', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE026', 'DOC_CAT006', 'Safety Training Certificates', 'Safety training and certification', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE027', 'DOC_CAT006', 'Orientation Certificate', 'Hospital orientation completion certificate', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE028', 'DOC_CAT007', 'Other', 'Other documents not categorized', FALSE, 'active', NOW(), NOW());

-- Salary Grades
INSERT INTO salary_grades VALUES ('SG001', 1, 'Executive', 150000, 180000, 210000, 'Executive Level', NULL, 'active', NOW(), NOW());

-- Sample Leave Types
INSERT INTO leave_types VALUES
('LT001', 'VAC', 'Vacation Leave', 'vacation', 10, FALSE, TRUE, TRUE, NULL, NULL, 'all', FALSE, 0, 'Annual vacation entitlement', 'active', NOW(), NOW()),
('LT002', 'SIK', 'Sick Leave', 'sick', 5, FALSE, TRUE, TRUE, NULL, NULL, 'all', FALSE, 0, 'Sick leave for illness', 'active', NOW(), NOW()),
('LT003', 'MAT', 'Maternity Leave', 'maternal', 60, TRUE, TRUE, TRUE, NULL, '["female"]', 'female', FALSE, 0, 'Philippine maternity leave', 'active', NOW(), NOW());

INSERT INTO shift_definitions VALUES
('SFT001', 'DAY', 'Day Shift', 'day', '08:00:00', '17:00:00', 8, 1, 8, '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]', NULL, NULL, FALSE, 'active', NOW(), NOW()),
('SFT002', 'NIGHT', 'Night Shift', 'night', '20:00:00', '05:00:00', 8, 1, 8, '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]', '20:00:00', '05:00:00', TRUE, 'active', NOW(), NOW());

-- Sample statutory contributions (2025 Philippines)
INSERT INTO statutory_contributions VALUES
('SC001', 'sss', '2025-01-01', '2025-12-31', 3.63, 7.375, 0, 99999, NULL, 'active', 'SSS 2025 rates', NOW(), NOW()),
('SC002', 'philhealth', '2025-01-01', '2025-12-31', 2.75, 2.75, 0, 99999, NULL, 'active', 'PhilHealth 2025 rates', NOW(), NOW()),
('SC003', 'pag_ibig', '2025-01-01', '2025-12-31', 1.0, 2.0, 0, 99999, 300, 'active', 'Pag-IBIG 2025 rates', NOW(), NOW());

-- Sample withholding tax brackets (2025 BIR)
INSERT INTO withholding_tax_brackets VALUES
('WTB001', 2025, 0, 20832, 0, 0, 50000, 4166.67, 'active', NOW(), NOW()),
('WTB002', 2025, 20833, 33332, 15, 3125, 50000, 4166.67, 'active', NOW(), NOW()),
('WTB003', 2025, 33333, 66664, 20, 9333, 50000, 4166.67, 'active', NOW(), NOW()),
('WTB004', 2025, 66665, 166664, 25, 23333, 50000, 4166.67, 'active', NOW(), NOW()),
('WTB005', 2025, 166665, 999999, 30, 93333, 50000, 4166.67, 'active', NOW(), NOW());

-- Sample HMO Providers
INSERT INTO hmo_providers VALUES
('HMO001', 'MP001', 'MediCare Plus', '08012345678', 'contact@medicare.com', '123 Health Street', 'John Contact', 'active', NOW(), NOW()),
('HMO002', 'HG001', 'HealthGuard Insurance', '08087654321', 'info@healthguard.com', '456 Wellness Avenue', 'Mary Support', 'active', NOW(), NOW());

-- Sample HMO Plans
INSERT INTO hmo_plans VALUES
('PLAN001', 'HMO001', 'MP-BASIC', 'Basic Health', 'basic', 500000, 500000, 1500, 2500, 500, 3, '{"coverage": "basic"}', 'Basic HMO plan', 'active', NOW(), NOW()),
('PLAN002', 'HMO001', 'MP-PREM', 'Premium Health', 'premium', 1000000, 1000000, 3000, 5000, 1000, 5, '{"coverage": "comprehensive"}', 'Premium HMO plan', 'active', NOW(), NOW());

-- Sample Allowance Components
INSERT INTO allowance_components VALUES
('AC001', 'HAZARD', 'Hazard Pay', 'hazard_pay', NULL, 10, 'percentage', 'monthly', NULL, NULL, 0, FALSE, 'taxable', NULL, 'Hazard duty allowance per Labor Code', 'active', NOW(), NOW()),
('AC002', 'MEAL', 'Meal Allowance', 'meal', 4000, NULL, 'fixed', 'monthly', NULL, NULL, 0, FALSE, 'non_taxable', NULL, 'Daily meal subsidy', 'active', NOW(), NOW()),
('AC003', 'TRANS', 'Transportation', 'transportation', 3000, NULL, 'fixed', 'monthly', NULL, NULL, 0, FALSE, 'non_taxable', NULL, 'Monthly transportation allowance', 'active', NOW(), NOW()),
('AC004', 'RICE', 'Rice Subsidy', 'rice_subsidy', 2000, NULL, 'fixed', 'monthly', NULL, NULL, 0, FALSE, 'non_taxable', NULL, 'Monthly rice subsidy', 'active', NOW(), NOW());

-- Sample Deduction Components
INSERT INTO deduction_components VALUES
('DC001', 'SSS', 'SSS Contribution', 'sss', NULL, 3.63, 'percentage', 'monthly', TRUE, NULL, FALSE, 7.375, 'Social Security System', 'active', NOW(), NOW()),
('DC002', 'PHIL', 'PhilHealth Contribution', 'philhealth', NULL, 2.75, 'percentage', 'monthly', TRUE, NULL, FALSE, 2.75, 'Philippine Health Insurance', 'active', NOW(), NOW()),
('DC003', 'PIBIG', 'Pag-IBIG Contribution', 'pag_ibig', NULL, 1.0, 'percentage', 'monthly', TRUE, 300, FALSE, 2.0, 'Home Development Fund', 'active', NOW(), NOW()),
('DC004', 'TAX', 'Withholding Tax', 'tax_withholding', NULL, NULL, 'tax_table', 'monthly', FALSE, NULL, FALSE, NULL, 'BIR Withholding Tax', 'active', NOW(), NOW());

COMMIT;

