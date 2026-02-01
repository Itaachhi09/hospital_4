# HR4 Hospital HR Management System - Complete Database Design Document

**System:** HR4 Hospital Management System (Philippines)  
**Scale:** Hospital-wide production deployment  
**Database:** MySQL 8.0+  
**Architecture:** Normalized relational database with REST API integration  
**Date:** January 2026

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Module Architecture](#module-architecture)
3. [Complete Table Structure](#complete-table-structure)
4. [Relationship Model](#relationship-model)
5. [Indexing Strategy](#indexing-strategy)
6. [Integration Rules](#integration-rules)
7. [Data Flow](#data-flow)
8. [Production Readiness](#production-readiness)

---

## System Overview

### Database Objectives
- Single unified database supporting all HR4 modules
- Full relational integrity with foreign keys
- Production-ready for hospital scale deployment (500-5000 employees)
- REST API integration ready
- Philippine Labor Law compliance built-in
- Audit trail for all transactions
- Approval workflow support

### Core Principles
- **Normalization**: 3NF with carefully denormalized views for performance
- **Referential Integrity**: All relationships enforced via foreign keys
- **Audit Trail**: All tables track created_at, updated_at, and user responsible
- **Effective Dating**: Support for salary history, allowance changes, leave balances
- **Approval Workflow**: Status tracking for all operational changes
- **Access Control**: RBAC integrated via user_roles and permissions

---

## Module Architecture

### 1. HR Core Module
**Purpose:** Master data management for all employees and organizational structure  
**Tables:** 14 tables  
**Primary Link:** Employee ID (employee.id)

```
Core Hierarchy:
  Organization
    ├─ Departments
    │   ├─ Positions
    │   └─ Cost Centers
    └─ Employees
        ├─ Employment Details
        ├─ Salary Grades
        ├─ Manager Relationships
        └─ Employment Status History
```

### 2. Compensation Module
**Purpose:** Salary structure, allowances, deductions, and payroll inputs  
**Tables:** 15 tables  
**Primary Dependencies:** HR Core (employee.id), Salary Grades

```
Compensation Hierarchy:
  Salary Structure
    ├─ Salary Grades (7 levels)
    ├─ Compensation Templates (by position)
    └─ Employee Compensation (individual)
  
  Earnings
    ├─ Allowance Components (8 types)
    └─ Employee Allowances
  
  Deductions
    ├─ Deduction Components (7 types)
    ├─ Statutory Contributions (SSS/PhilHealth/Pag-IBIG)
    ├─ Withholding Tax Brackets
    └─ Employee Deductions
  
  Tracking
    ├─ Gross Pay Computation
    ├─ Overtime Records
    ├─ HMO Plan Assignments
    ├─ Compensation History (Audit)
    └─ Compensation Approvals
```

### 3. Time & Attendance Module
**Purpose:** Track employee presence, shifts, late/undertime, overtime  
**Tables:** 8 tables  
**Primary Dependencies:** HR Core (employee.id), Compensation (overtime_rates)

```
Attendance Hierarchy:
  Schedule Management
    ├─ Shift Definitions
    ├─ Shift Templates
    └─ Employee Shift Assignments
  
  Daily Tracking
    ├─ Attendance Logs (time in/out)
    ├─ Shift Schedules (daily)
    ├─ Late & Undertime Records
    └─ Attendance Summary (monthly)
  
  Special Cases
    └─ Night Differential Tracking
```

### 4. Leave Management Module
**Purpose:** Leave types, balances, applications, and approvals  
**Tables:** 6 tables  
**Primary Dependencies:** HR Core (employee.id), Payroll impact

```
Leave Hierarchy:
  Configuration
    ├─ Leave Types (14 types per Labor Code)
    ├─ Leave Policies (by company, department)
    └─ Leave Credits Configuration
  
  Tracking
    ├─ Leave Balances (per employee, year)
    ├─ Leave Applications
    ├─ Leave Approvals
    └─ Leave Utilization (history)
```

### 5. Overtime Management Module
**Purpose:** Overtime requests, approvals, and rate tracking  
**Tables:** 2 tables (integrated with Compensation)  
**Primary Dependencies:** Compensation (overtime_records), Attendance

```
Overtime Hierarchy:
  Request & Approval
    ├─ Overtime Requests
    └─ Overtime Approvals (multi-level)
  
  Rate Management
    └─ Overtime Rate Multipliers (1.25x, 1.50x, 2.0x per Labor Code)
```

### 6. Payroll Module
**Purpose:** Payroll processing, computations, and payment records  
**Tables:** 12 tables  
**Primary Dependencies:** Compensation, Attendance, Leave, HMO

```
Payroll Hierarchy:
  Master Records
    ├─ Payroll Runs (monthly, 13th month, special)
    └─ Payroll Headers (per employee per run)
  
  Computation
    ├─ Payroll Line Items (earnings breakdown)
    ├─ Payroll Deductions (standard + statutory)
    ├─ Government Contributions (SSS, PhilHealth, Pag-IBIG)
    ├─ 13th Month Computations
    └─ Net Pay Computation Storage
  
  Output
    ├─ Payslips (employee payment summary)
    └─ Tax Returns Summary
  
  Approvals & Status
    └─ Payroll Approvals (multi-stage: computed, reviewed, approved, paid)
```

### 7. HMO Module
**Purpose:** Health Maintenance Organization enrollment and benefits  
**Tables:** 7 tables (integrated with Payroll deductions)  
**Primary Dependencies:** Compensation (hmo_plan_assignments), Payroll (deductions)

```
HMO Hierarchy:
  Provider Management
    ├─ HMO Providers
    ├─ HMO Plans (per provider)
    └─ Plan Coverage Details
  
  Employee Enrollment
    ├─ HMO Enrollments
    ├─ Dependent Records
    └─ Enrollment History
  
  Claims & Usage
    ├─ HMO Claims
    └─ Claims Approvals
  
  Payroll Integration
    └─ HMO Deduction Mapping (to payroll deductions)
```

### 8. Analytics & Reporting Module
**Purpose:** Data warehouse and reporting snapshots  
**Tables:** 8 tables  
**Primary Dependencies:** All transactional modules (read-only)

```
Analytics Hierarchy:
  Snapshots (monthly capture)
    ├─ Payroll Cost Summary (per department, employee)
    ├─ Attendance Summary (monthly metrics)
    ├─ Leave Usage Summary
    ├─ Overtime Cost Analysis
    └─ Compensation Analysis
  
  Aggregations
    ├─ Department Payroll Metrics
    ├─ Employee Compensation Metrics
    └─ Operational Metrics (turnover, absences, etc.)
```

### 9. Supporting Modules
**Purpose:** Workflow, audit, and communication support  
**Tables:** 7 tables  
**Primary Dependencies:** All modules

```
Supporting Infrastructure:
  Workflow & Audit
    ├─ Approval Workflows (configurable)
    ├─ Audit Logs (all changes)
    └─ Status Audit Trail
  
  Communication
    ├─ Notifications (user inbox)
    └─ Notification Templates
  
  Configuration
    └─ System Parameters
```

---

## Complete Table Structure

### HR CORE MODULE (14 Tables)

#### 1. users
```sql
Purpose: User authentication and access control
Scope: System-level user accounts
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - name (VARCHAR 255)
  - email (VARCHAR 255) UNIQUE
  - password_hash (VARCHAR 255)
  - role (ENUM: admin, hr_manager, payroll_officer, finance_officer, employee)
  - status (ENUM: active, inactive, suspended)
  - last_login (DATETIME)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - email (UNIQUE)
  - role (for role-based queries)
  - status (for active user filtering)
```

#### 2. departments
```sql
Purpose: Organizational department structure
Scope: Hospital departments and divisions
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - name (VARCHAR 255) UNIQUE
  - description (TEXT)
  - manager_id (VARCHAR 20) FK → users.id
  - budget (DECIMAL 12,2)
  - cost_center_code (VARCHAR 20) UNIQUE
  - parent_department_id (VARCHAR 20) FK → departments.id (self-referencing for hierarchy)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - name
  - manager_id
  - parent_department_id (for hierarchy queries)
  - status
```

#### 3. positions
```sql
Purpose: Job positions and role definitions
Scope: All hospital positions
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - position_code (VARCHAR 50) UNIQUE
  - position_name (VARCHAR 255) UNIQUE
  - department_id (VARCHAR 20) FK → departments.id
  - job_grade_id (VARCHAR 20) FK → salary_grades.id
  - reports_to_position_id (VARCHAR 20) FK → positions.id (self-referencing)
  - min_qualification (TEXT)
  - responsibilities (TEXT)
  - key_competencies (JSON)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - position_code
  - department_id
  - job_grade_id
  - status
```

#### 4. employees
```sql
Purpose: Employee master records
Scope: All current and historical employees
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - user_id (VARCHAR 20) FK → users.id UNIQUE
  - employee_code (VARCHAR 20) UNIQUE
  - first_name (VARCHAR 100)
  - last_name (VARCHAR 100)
  - middle_name (VARCHAR 100)
  - email (VARCHAR 255) UNIQUE
  - phone (VARCHAR 20)
  - date_of_birth (DATE)
  - gender (ENUM: male, female, other)
  - civil_status (ENUM: single, married, widowed, separated, divorced)
  - nationality (VARCHAR 50)
  - tin (VARCHAR 20) UNIQUE
  - philhealth_id (VARCHAR 50)
  - sss_id (VARCHAR 20)
  - pagibig_id (VARCHAR 20)
  - position_id (VARCHAR 20) FK → positions.id
  - department_id (VARCHAR 20) FK → departments.id
  - hire_date (DATE) NOT NULL
  - employment_type (ENUM: full-time, part-time, contract, casual, job_order)
  - manager_id (VARCHAR 20) FK → employees.id
  - base_salary (DECIMAL 12,2)
  - status (ENUM: active, on_leave, terminated, resigned, retired)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_code
  - email
  - department_id
  - position_id
  - manager_id
  - status
  - hire_date
```

#### 5. employment_status_history
```sql
Purpose: Track employment status changes over time
Scope: Audit trail of status transitions
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - previous_status (ENUM: active, on_leave, terminated, resigned, retired)
  - new_status (ENUM: active, on_leave, terminated, resigned, retired)
  - effective_date (DATE)
  - reason (TEXT)
  - changed_by (VARCHAR 20) FK → users.id
  - created_at (TIMESTAMP)
Indexes:
  - employee_id
  - effective_date
```

#### 6. employment_history
```sql
Purpose: Track employment changes (promotion, demotion, transfer)
Scope: Career progression audit trail
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - change_type (ENUM: hire, promotion, demotion, lateral_transfer, role_change)
  - previous_position_id (VARCHAR 20) FK → positions.id
  - new_position_id (VARCHAR 20) FK → positions.id
  - previous_department_id (VARCHAR 20) FK → departments.id
  - new_department_id (VARCHAR 20) FK → departments.id
  - previous_salary (DECIMAL 12,2)
  - new_salary (DECIMAL 12,2)
  - effective_date (DATE)
  - reason (TEXT)
  - approved_by (VARCHAR 20) FK → users.id
  - approval_date (DATETIME)
  - created_by (VARCHAR 20) FK → users.id
  - created_at (TIMESTAMP)
Indexes:
  - employee_id
  - effective_date
  - change_type
```

#### 7. salary_grades
```sql
Purpose: Philippine salary grade classification system
Scope: Hospital grade framework (7 levels)
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - grade_level (INT) UNIQUE 1-7
  - grade_name (VARCHAR 100) (e.g., "Executive", "Senior Management", "Professional")
  - min_salary (DECIMAL 12,2)
  - midpoint_salary (DECIMAL 12,2)
  - max_salary (DECIMAL 12,2)
  - description (TEXT)
  - applicable_positions (JSON array)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - grade_level
  - status
Reference: SG001-SG007 (Executive to Job Order)
```

#### 8. cost_centers
```sql
Purpose: Financial cost center mapping
Scope: Budget and cost tracking units
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - cost_center_code (VARCHAR 20) UNIQUE
  - cost_center_name (VARCHAR 255)
  - department_id (VARCHAR 20) FK → departments.id
  - manager_id (VARCHAR 20) FK → employees.id
  - budget_amount (DECIMAL 15,2)
  - budget_year (INT)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - cost_center_code
  - department_id
  - budget_year
```

#### 9. benefits (Non-cash Benefits)
```sql
Purpose: Company benefits offering (non-salary)
Scope: Health, life, insurance, retirement benefits
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - benefit_name (VARCHAR 255)
  - benefit_type (ENUM: health_insurance, life_insurance, disability, dental, vision, retirement, other)
  - coverage (VARCHAR 255)
  - employee_cost (DECIMAL 12,2)
  - employer_cost (DECIMAL 12,2)
  - description (TEXT)
  - applicable_employee_types (JSON)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - benefit_type
  - status
```

#### 10. documents
```sql
Purpose: Employee document storage tracking
Scope: Required documents (TIN, PhilHealth ID, etc.)
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - document_type (ENUM: tin, sss, philhealth, pagibig, birth_certificate, marriage_cert, passport, etc.)
  - document_number (VARCHAR 100)
  - issue_date (DATE)
  - expiry_date (DATE)
  - file_path (VARCHAR 255)
  - status (ENUM: valid, expired, missing)
  - verified_by (VARCHAR 20) FK → users.id
  - verified_date (DATETIME)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - document_type
  - status
```

#### 11. skills
```sql
Purpose: Employee skills and competencies
Scope: Skill inventory
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - skill_name (VARCHAR 255)
  - skill_level (ENUM: beginner, intermediate, advanced, expert)
  - proficiency_percentage (INT 0-100)
  - certification_number (VARCHAR 100)
  - certification_valid_from (DATE)
  - certification_valid_to (DATE)
  - verified (BOOLEAN)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - skill_name
```

#### 12. user_roles
```sql
Purpose: Role-based access control mapping
Scope: User roles and permissions
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - user_id (VARCHAR 20) FK → users.id
  - role (ENUM: admin, hr_manager, payroll_officer, finance_officer, employee)
  - permissions (JSON array)
  - department_id (VARCHAR 20) FK → departments.id (if role is department-scoped)
  - effective_date (DATE)
  - end_date (DATE)
  - granted_by (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - user_id
  - role
  - department_id
```

#### 13. manager_relationships
```sql
Purpose: Reporting structure and manager-subordinate relationships
Scope: Organization hierarchy
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - manager_id (VARCHAR 20) FK → employees.id
  - subordinate_id (VARCHAR 20) FK → employees.id
  - relationship_type (ENUM: direct_manager, skip_level_manager, dotted_line)
  - effective_date (DATE)
  - end_date (DATE)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - manager_id
  - subordinate_id
  - effective_date
```

#### 14. organization_parameters
```sql
Purpose: Global organization configuration
Scope: Company-wide settings
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - param_key (VARCHAR 100) UNIQUE
  - param_value (TEXT)
  - data_type (ENUM: string, number, boolean, json)
  - description (TEXT)
  - last_updated_by (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
```

---

### COMPENSATION MODULE (15 Tables)

#### 15. compensation_templates
```sql
Purpose: Pre-defined salary structures by position
Scope: Template for compensation assignments
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - position_id (VARCHAR 20) FK → positions.id
  - grade_id (VARCHAR 20) FK → salary_grades.id
  - employee_type (ENUM: doctor, nurse, medical_tech, allied_health, admin, support, contractual, job_order)
  - grade_step (INT)
  - monthly_rate (DECIMAL 12,2)
  - daily_rate (DECIMAL 12,2)
  - hourly_rate (DECIMAL 10,2)
  - effective_date (DATE)
  - expiration_date (DATE)
  - description (TEXT)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - position_id
  - grade_id
  - employee_type
  - effective_date
```

#### 16. employee_compensation
```sql
Purpose: Individual employee compensation assignment
Scope: Active salary record per employee
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - template_id (VARCHAR 20) FK → compensation_templates.id
  - monthly_salary (DECIMAL 12,2)
  - daily_rate (DECIMAL 12,2)
  - hourly_rate (DECIMAL 10,2)
  - effective_date (DATE)
  - end_date (DATE)
  - approval_status (ENUM: pending, approved, rejected)
  - approved_by (VARCHAR 20) FK → users.id
  - approved_date (DATETIME)
  - reason_for_change (VARCHAR 255)
  - status (ENUM: active, inactive)
  - created_by (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - effective_date
  - approval_status
```

#### 17. allowance_components
```sql
Purpose: Hospital-specific allowances catalog
Scope: Allowance types and rates
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - component_code (VARCHAR 20) UNIQUE
  - component_name (VARCHAR 100)
  - allowance_type (ENUM: hazard_pay, shift_diff, on_call, meal, uniform, transport, rice_subsidy, other)
  - amount (DECIMAL 12,2)
  - percentage_of_salary (DECIMAL 5,2)
  - calculation_basis (ENUM: fixed, percentage, daily_rate, hourly_rate)
  - frequency (ENUM: monthly, daily, per_shift, one_time)
  - applicable_employee_types (JSON)
  - applicable_grades (JSON)
  - min_hours_required (DECIMAL 5,2)
  - tax_treatment (ENUM: taxable, non_taxable)
  - shift_type_applicable (VARCHAR 50)
  - description (TEXT)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - component_code
  - allowance_type
  - status
```

#### 18. employee_allowances
```sql
Purpose: Individual allowance assignments
Scope: Allowance per employee
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - allowance_component_id (VARCHAR 20) FK → allowance_components.id
  - assigned_amount (DECIMAL 12,2)
  - assigned_percentage (DECIMAL 5,2)
  - effective_date (DATE)
  - end_date (DATE)
  - reason (VARCHAR 255)
  - approval_status (ENUM: pending, approved, rejected)
  - approved_by (VARCHAR 20) FK → users.id
  - approved_date (DATETIME)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - allowance_component_id
  - effective_date
  - approval_status
```

#### 19. deduction_components
```sql
Purpose: Statutory and non-statutory deductions catalog
Scope: All deduction types
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - component_code (VARCHAR 20) UNIQUE
  - component_name (VARCHAR 100)
  - deduction_type (ENUM: sss, philhealth, pag_ibig, tax_withholding, loan, insurance, union, other)
  - amount (DECIMAL 12,2)
  - percentage_of_salary (DECIMAL 5,2)
  - calculation_basis (ENUM: fixed, percentage, tax_table)
  - frequency (ENUM: monthly, per_period, one_time)
  - is_mandatory (BOOLEAN)
  - max_monthly_deduction (DECIMAL 12,2)
  - employer_share (BOOLEAN)
  - employer_percentage (DECIMAL 5,2)
  - description (TEXT)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - component_code
  - deduction_type
  - is_mandatory
```

#### 20. employee_deductions
```sql
Purpose: Individual deduction assignments
Scope: Deduction per employee
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - deduction_component_id (VARCHAR 20) FK → deduction_components.id
  - deduction_amount (DECIMAL 12,2)
  - deduction_percentage (DECIMAL 5,2)
  - effective_date (DATE)
  - end_date (DATE)
  - reference_number (VARCHAR 100)
  - loan_duration_months (INT)
  - remaining_balance (DECIMAL 12,2)
  - status (ENUM: active, inactive, completed)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - deduction_component_id
  - effective_date
```

#### 21. statutory_contributions
```sql
Purpose: Government contribution rates (SSS, PhilHealth, Pag-IBIG)
Scope: Philippine statutory rates by year
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - contribution_type (ENUM: sss, philhealth, pag_ibig)
  - effective_date (DATE)
  - end_date (DATE)
  - employee_rate (DECIMAL 5,2)
  - employer_rate (DECIMAL 5,2)
  - min_salary (DECIMAL 12,2)
  - max_salary (DECIMAL 12,2)
  - max_contribution (DECIMAL 12,2)
  - status (ENUM: active, inactive)
  - remarks (TEXT)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - contribution_type
  - effective_date
```

#### 22. withholding_tax_brackets
```sql
Purpose: BIR withholding tax computation tables
Scope: 2025 Philippine tax brackets
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - tax_year (INT)
  - salary_min (DECIMAL 12,2)
  - salary_max (DECIMAL 12,2)
  - tax_percentage (DECIMAL 5,2)
  - excess_amount (DECIMAL 12,2)
  - annual_exemption (DECIMAL 12,2)
  - monthly_exemption (DECIMAL 12,2)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - tax_year
  - salary_min
  - salary_max
```

#### 23. overtime_records
```sql
Purpose: Track overtime hours and approvals
Scope: Overtime log
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - overtime_date (DATE)
  - hours (DECIMAL 5,2)
  - overtime_type (ENUM: regular, holiday, night, special)
  - rate_multiplier (DECIMAL 3,2) (1.25, 1.50, 2.00)
  - computed_amount (DECIMAL 12,2)
  - approval_status (ENUM: pending, approved, rejected)
  - approved_by (VARCHAR 20) FK → users.id
  - approved_date (DATETIME)
  - included_in_payroll_id (VARCHAR 20) FK → payroll_runs.id
  - remarks (TEXT)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - overtime_date
  - approval_status
  - included_in_payroll_id
```

#### 24. gross_pay_computation
```sql
Purpose: Monthly gross pay calculation records
Scope: Gross pay computation storage
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - payroll_id (VARCHAR 20) FK → payroll_runs.id
  - period_start_date (DATE)
  - period_end_date (DATE)
  - base_salary (DECIMAL 12,2)
  - daily_rate (DECIMAL 12,2)
  - hourly_rate (DECIMAL 10,2)
  - working_days (INT)
  - actual_days_worked (INT)
  - prorated_salary (DECIMAL 12,2)
  - allowances_total (DECIMAL 12,2)
  - overtime_hours (DECIMAL 5,2)
  - overtime_amount (DECIMAL 12,2)
  - night_differential (DECIMAL 12,2)
  - holiday_pay (DECIMAL 12,2)
  - special_pay (DECIMAL 12,2)
  - gross_pay (DECIMAL 12,2)
  - is_prorated (BOOLEAN)
  - is_new_hire (BOOLEAN)
  - is_separation (BOOLEAN)
  - remarks (TEXT)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - payroll_id
  - period_start_date
```

#### 25. compensation_history
```sql
Purpose: Audit trail for compensation changes
Scope: All salary and allowance modifications
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - change_type (ENUM: salary_increase, salary_decrease, allowance_add, allowance_remove, deduction_add, deduction_remove, promotion)
  - entity_type (VARCHAR 50) (allowance, deduction, etc.)
  - previous_value (DECIMAL 12,2)
  - new_value (DECIMAL 12,2)
  - effective_date (DATE)
  - changed_by (VARCHAR 20) FK → users.id
  - reason (TEXT)
  - approval_id (VARCHAR 20) FK → compensation_approvals.id
  - created_at (TIMESTAMP)
Indexes:
  - employee_id
  - change_type
  - effective_date
```

#### 26. compensation_approvals
```sql
Purpose: Approval workflow for compensation changes
Scope: Multi-level approvals
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - approval_type (ENUM: salary_change, allowance_assignment, deduction_setup, overtime_approval)
  - request_details (JSON)
  - requested_by (VARCHAR 20) FK → users.id
  - requested_date (DATETIME)
  - approval_level (INT)
  - approver_id (VARCHAR 20) FK → users.id
  - approval_status (ENUM: pending, approved, rejected, recalled)
  - approval_date (DATETIME)
  - approval_remarks (TEXT)
  - next_approver_id (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - approval_type
  - approval_status
  - requested_date
```

#### 27. hmo_plan_assignments
```sql
Purpose: Employee HMO plan enrollment and premium tracking
Scope: HMO per employee
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - plan_id (VARCHAR 20) FK → hmo_plans.id
  - assignment_date (DATE)
  - termination_date (DATE)
  - employee_contribution (DECIMAL 12,2)
  - employer_contribution (DECIMAL 12,2)
  - dependent_count (INT)
  - dependent_contribution (DECIMAL 12,2)
  - total_monthly_premium (DECIMAL 12,2)
  - eligibility_status (ENUM: eligible, not_eligible, pending)
  - approval_status (ENUM: pending, approved, rejected)
  - approved_by (VARCHAR 20) FK → users.id
  - approved_date (DATETIME)
  - deduction_component_id (VARCHAR 20) FK → deduction_components.id
  - status (ENUM: active, suspended, terminated)
  - remarks (TEXT)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - plan_id
  - assignment_date
  - status
```

---

### TIME & ATTENDANCE MODULE (8 Tables)

#### 28. shift_definitions
```sql
Purpose: Define shift patterns (Day, Night, Rotating)
Scope: Shift master data
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - shift_code (VARCHAR 20) UNIQUE
  - shift_name (VARCHAR 100)
  - shift_type (ENUM: day, night, rotating, flexible, on_call)
  - start_time (TIME)
  - end_time (TIME)
  - duration_hours (DECIMAL 5,2)
  - break_hours (DECIMAL 5,2)
  - min_hours_per_day (DECIMAL 5,2)
  - applicable_days (JSON) ('["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]')
  - night_shift_hours_start (TIME)
  - night_shift_hours_end (TIME)
  - shift_differential_applicable (BOOLEAN)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - shift_code
  - shift_type
  - status
```

#### 29. shift_templates
```sql
Purpose: Weekly shift schedule templates
Scope: Recurring shift patterns
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - template_name (VARCHAR 100) UNIQUE
  - template_code (VARCHAR 20) UNIQUE
  - department_id (VARCHAR 20) FK → departments.id
  - description (TEXT)
  - template_pattern (JSON) 
    {
      "Monday": "shift_01",
      "Tuesday": "shift_01",
      ...
      "Sunday": "REST"
    }
  - rest_days_per_week (INT)
  - applicable_employee_types (JSON)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - template_code
  - department_id
  - status
```

#### 30. employee_shift_assignments
```sql
Purpose: Assign shifts to employees
Scope: Employee shift scheduling
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - shift_id (VARCHAR 20) FK → shift_definitions.id
  - template_id (VARCHAR 20) FK → shift_templates.id
  - effective_date (DATE)
  - end_date (DATE)
  - assigned_by (VARCHAR 20) FK → users.id
  - approval_status (ENUM: pending, approved, rejected)
  - approved_by (VARCHAR 20) FK → users.id
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - shift_id
  - effective_date
```

#### 31. attendance_logs
```sql
Purpose: Daily time in and time out records
Scope: Employee presence tracking
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - attendance_date (DATE)
  - shift_id (VARCHAR 20) FK → shift_definitions.id
  - time_in (DATETIME)
  - time_out (DATETIME)
  - hours_worked (DECIMAL 5,2)
  - break_duration_minutes (INT)
  - status (ENUM: present, absent, late, undertime, overtime, leave)
  - reason_if_absent (VARCHAR 255)
  - leave_type_id (VARCHAR 20) FK → leave_types.id (if absent due to leave)
  - approved_by (VARCHAR 20) FK → users.id
  - approved_date (DATETIME)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - attendance_date
  - status
```

#### 32. late_and_undertime_records
```sql
Purpose: Track tardiness and undertime incidents
Scope: Performance monitoring
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - record_date (DATE)
  - incident_type (ENUM: late, undertime, both)
  - minutes_late (INT)
  - minutes_undertime (INT)
  - reason (VARCHAR 255)
  - document_proof (VARCHAR 255) (file path)
  - action_taken (ENUM: warning, memo, deduction, none)
  - deduction_amount (DECIMAL 12,2)
  - approved_by (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - record_date
```

#### 33. night_differential_tracking
```sql
Purpose: Track night shift hours for differential pay
Scope: Night differential calculation basis
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - work_date (DATE)
  - night_hours (DECIMAL 5,2)
  - shift_id (VARCHAR 20) FK → shift_definitions.id
  - night_shift_rate (DECIMAL 10,2)
  - differential_amount (DECIMAL 12,2)
  - included_in_payroll_id (VARCHAR 20) FK → payroll_runs.id
  - verified_by (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - work_date
  - included_in_payroll_id
```

#### 34. shift_swap_requests
```sql
Purpose: Track shift exchange requests between employees
Scope: Shift management flexibility
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - requesting_employee_id (VARCHAR 20) FK → employees.id
  - target_employee_id (VARCHAR 20) FK → employees.id
  - requested_shift_date (DATE)
  - target_shift_date (DATE)
  - reason (TEXT)
  - approval_status (ENUM: pending, approved, rejected)
  - approved_by (VARCHAR 20) FK → users.id
  - approval_date (DATETIME)
  - status (ENUM: pending, approved, completed, cancelled)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - requesting_employee_id
  - target_employee_id
  - approval_status
```

#### 35. attendance_summary_monthly
```sql
Purpose: Monthly attendance snapshot
Scope: Monthly aggregation for payroll
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - year_month (CHAR 7) YYYY-MM
  - total_days_worked (INT)
  - total_absent_days (INT)
  - total_late_incidents (INT)
  - total_minutes_late (INT)
  - total_undertime_minutes (INT)
  - total_overtime_hours (DECIMAL 5,2)
  - total_night_differential_hours (DECIMAL 5,2)
  - leave_days_used (INT)
  - computed_by (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - year_month
```

---

### LEAVE MANAGEMENT MODULE (6 Tables)

#### 36. leave_types
```sql
Purpose: Philippine Labor Code leave types
Scope: All leave classifications
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - leave_code (VARCHAR 20) UNIQUE
  - leave_name (VARCHAR 100)
  - leave_type (ENUM: vacation, sick, maternal, paternal, bereavement, emergency, offsetting, unpaid, special, hazard_duty, study, rehabilitation)
  - max_days_per_year (INT)
  - requires_attachment (BOOLEAN)
  - requires_approval (BOOLEAN)
  - affects_payroll (BOOLEAN)
  - deduction_type (VARCHAR 50) (if applicable)
  - applicable_employee_types (JSON)
  - applicable_gender (ENUM: all, male, female)
  - carryover_allowed (BOOLEAN)
  - carryover_limit (INT)
  - description (TEXT)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - leave_code
  - leave_type
  - status
```

#### 37. leave_policies
```sql
Purpose: Leave policies per company/department
Scope: Policy configuration
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - policy_name (VARCHAR 100)
  - policy_level (ENUM: company, department)
  - applicable_department_id (VARCHAR 20) FK → departments.id (if department-level)
  - leave_type_id (VARCHAR 20) FK → leave_types.id
  - days_allowed (INT)
  - accrual_method (ENUM: fixed, prorated, monthly_accumulation)
  - prorated_days_per_month (DECIMAL 5,2)
  - min_months_to_accrue (INT)
  - effective_date (DATE)
  - end_date (DATE)
  - remarks (TEXT)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - leave_type_id
  - applicable_department_id
  - effective_date
```

#### 38. leave_balances
```sql
Purpose: Track leave balance per employee per year
Scope: Accumulation and usage tracking
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - leave_type_id (VARCHAR 20) FK → leave_types.id
  - calendar_year (INT)
  - opening_balance (DECIMAL 5,2)
  - days_accrued (DECIMAL 5,2)
  - days_used (DECIMAL 5,2)
  - days_cancelled (DECIMAL 5,2)
  - days_forfeited (DECIMAL 5,2)
  - closing_balance (DECIMAL 5,2)
  - carryover_from_previous_year (DECIMAL 5,2)
  - last_updated_date (DATE)
  - computed_by (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - leave_type_id
  - calendar_year (UNIQUE constraint: employee_id, leave_type_id, calendar_year)
```

#### 39. leave_applications
```sql
Purpose: Leave request submissions
Scope: Employee leave applications
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - leave_type_id (VARCHAR 20) FK → leave_types.id
  - application_date (DATE)
  - leave_start_date (DATE)
  - leave_end_date (DATE)
  - total_leave_days (DECIMAL 5,2)
  - reason (TEXT)
  - attachment_path (VARCHAR 255)
  - approval_status (ENUM: pending, approved, rejected, cancelled)
  - remarks (TEXT)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - leave_type_id
  - application_date
  - approval_status
```

#### 40. leave_approvals
```sql
Purpose: Multi-level leave approval workflow
Scope: Leave approval tracking
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - leave_application_id (VARCHAR 20) FK → leave_applications.id
  - approval_level (INT)
  - approver_id (VARCHAR 20) FK → users.id
  - approval_status (ENUM: pending, approved, rejected)
  - approval_date (DATETIME)
  - approval_remarks (TEXT)
  - next_approver_id (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - leave_application_id
  - approver_id
  - approval_status
```

#### 41. leave_utilization_history
```sql
Purpose: Audit trail of leave usage
Scope: Leave consumption history
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - leave_type_id (VARCHAR 20) FK → leave_types.id
  - leave_date (DATE)
  - days_used (DECIMAL 5,2)
  - leave_application_id (VARCHAR 20) FK → leave_applications.id
  - calendar_year (INT)
  - processed_by (VARCHAR 20) FK → users.id
  - processed_date (DATETIME)
  - created_at (TIMESTAMP)
Indexes:
  - employee_id
  - leave_type_id
  - calendar_year
  - leave_date
```

---

### PAYROLL MODULE (12 Tables)

#### 42. payroll_runs
```sql
Purpose: Monthly payroll execution header
Scope: Payroll period grouping
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - payroll_run_code (VARCHAR 50) UNIQUE
  - payroll_period (VARCHAR 10) YYYY-MM
  - payroll_type (ENUM: monthly, 13th_month, special, adjustment)
  - period_start_date (DATE)
  - period_end_date (DATE)
  - cutoff_date (DATE)
  - payment_date (DATE)
  - total_employees (INT)
  - total_gross_salary (DECIMAL 15,2)
  - total_deductions (DECIMAL 15,2)
  - total_net_salary (DECIMAL 15,2)
  - total_employer_contribution (DECIMAL 15,2)
  - approval_status (ENUM: draft, computed, reviewed, approved, released, paid)
  - created_by (VARCHAR 20) FK → users.id
  - reviewed_by (VARCHAR 20) FK → users.id
  - approved_by (VARCHAR 20) FK → users.id
  - released_date (DATETIME)
  - paid_date (DATETIME)
  - remarks (TEXT)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - payroll_run_code
  - payroll_period
  - approval_status
  - payment_date
```

#### 43. payroll_headers
```sql
Purpose: Per-employee payroll record
Scope: Employee record per payroll run
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - payroll_run_id (VARCHAR 20) FK → payroll_runs.id
  - employee_id (VARCHAR 20) FK → employees.id
  - gross_pay (DECIMAL 12,2)
  - total_earnings (DECIMAL 12,2)
  - total_deductions (DECIMAL 12,2)
  - net_pay (DECIMAL 12,2)
  - employer_contribution (DECIMAL 12,2)
  - total_cost (DECIMAL 12,2)
  - approval_status (ENUM: computed, reviewed, approved)
  - computed_by (VARCHAR 20) FK → users.id
  - computed_date (DATETIME)
  - reviewed_by (VARCHAR 20) FK → users.id
  - approved_date (DATETIME)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - payroll_run_id
  - employee_id
  - approval_status
  - UNIQUE(payroll_run_id, employee_id)
```

#### 44. payroll_line_items
```sql
Purpose: Detailed earnings breakdown per payroll
Scope: Earnings components
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - payroll_header_id (VARCHAR 20) FK → payroll_headers.id
  - line_item_type (ENUM: base_salary, allowance, overtime, holiday_pay, night_differential, special_pay, other)
  - component_id (VARCHAR 20) (FK to allowance_components or other sources)
  - component_name (VARCHAR 100)
  - amount (DECIMAL 12,2)
  - quantity (DECIMAL 5,2)
  - rate (DECIMAL 10,2)
  - remarks (TEXT)
  - created_at (TIMESTAMP)
Indexes:
  - payroll_header_id
  - line_item_type
```

#### 45. payroll_deductions
```sql
Purpose: Detailed deductions breakdown per payroll
Scope: Deduction components
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - payroll_header_id (VARCHAR 20) FK → payroll_headers.id
  - deduction_type (ENUM: sss, philhealth, pag_ibig, tax_withholding, loan, insurance, union, hmo, other)
  - component_id (VARCHAR 20) FK → deduction_components.id
  - component_name (VARCHAR 100)
  - employee_share (DECIMAL 12,2)
  - employer_share (DECIMAL 12,2)
  - total_deduction (DECIMAL 12,2)
  - reference_number (VARCHAR 100)
  - remarks (TEXT)
  - created_at (TIMESTAMP)
Indexes:
  - payroll_header_id
  - deduction_type
```

#### 46. government_contributions
```sql
Purpose: SSS, PhilHealth, Pag-IBIG contribution records
Scope: Statutory contribution tracking
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - payroll_run_id (VARCHAR 20) FK → payroll_runs.id
  - employee_id (VARCHAR 20) FK → employees.id
  - contribution_type (ENUM: sss, philhealth, pag_ibig)
  - employee_contribution (DECIMAL 12,2)
  - employer_contribution (DECIMAL 12,2)
  - total_contribution (DECIMAL 12,2)
  - contribution_month (DATE)
  - status (ENUM: computed, transmitted, paid)
  - transmitted_to_agency_date (DATE)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - payroll_run_id
  - employee_id
  - contribution_type
  - contribution_month
```

#### 47. payslips
```sql
Purpose: Employee payslip generation
Scope: Payslip records
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - payroll_header_id (VARCHAR 20) FK → payroll_headers.id
  - employee_id (VARCHAR 20) FK → employees.id
  - payroll_period (VARCHAR 10)
  - period_start_date (DATE)
  - period_end_date (DATE)
  - gross_salary (DECIMAL 12,2)
  - total_deductions (DECIMAL 12,2)
  - net_salary (DECIMAL 12,2)
  - status (ENUM: generated, sent, viewed, downloaded)
  - generated_date (DATETIME)
  - sent_date (DATETIME)
  - viewed_date (DATETIME)
  - file_path (VARCHAR 255)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - payroll_period
  - status
```

#### 48. thirteenth_month_computation
```sql
Purpose: 13th month pay calculation
Scope: Annual bonus computation
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - calendar_year (INT)
  - january_to_june_gross (DECIMAL 12,2)
  - july_to_december_gross (DECIMAL 12,2)
  - average_gross_monthly (DECIMAL 12,2)
  - thirteenth_month_pay (DECIMAL 12,2)
  - less_advances_received (DECIMAL 12,2)
  - net_thirteenth_month (DECIMAL 12,2)
  - approval_status (ENUM: computed, approved)
  - approved_by (VARCHAR 20) FK → users.id
  - payment_date (DATE)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - calendar_year
  - UNIQUE(employee_id, calendar_year)
```

#### 49. net_pay_computation
```sql
Purpose: Detailed net pay calculation storage
Scope: Computation audit trail
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - payroll_header_id (VARCHAR 20) FK → payroll_headers.id
  - employee_id (VARCHAR 20) FK → employees.id
  - gross_pay (DECIMAL 12,2)
  - total_allowances (DECIMAL 12,2)
  - total_mandatory_deductions (DECIMAL 12,2)
  - total_optional_deductions (DECIMAL 12,2)
  - net_pay_before_tax (DECIMAL 12,2)
  - withholding_tax (DECIMAL 12,2)
  - net_pay_after_tax (DECIMAL 12,2)
  - total_employer_cost (DECIMAL 12,2)
  - computation_method (VARCHAR 100)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - payroll_header_id
  - employee_id
```

#### 50. tax_returns_summary
```sql
Purpose: Tax reporting aggregation
Scope: Annual tax records
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - tax_year (INT)
  - employee_id (VARCHAR 20) FK → employees.id
  - gross_compensation (DECIMAL 15,2)
  - taxable_income (DECIMAL 15,2)
  - total_withholding_tax (DECIMAL 15,2)
  - annual_exemption (DECIMAL 15,2)
  - sss_contribution (DECIMAL 15,2)
  - philhealth_contribution (DECIMAL 15,2)
  - pag_ibig_contribution (DECIMAL 15,2)
  - tax_return_filed_date (DATE)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - tax_year
  - employee_id
  - UNIQUE(tax_year, employee_id)
```

#### 51. payroll_approvals
```sql
Purpose: Multi-stage payroll approval workflow
Scope: Approval tracking
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - payroll_run_id (VARCHAR 20) FK → payroll_runs.id
  - approval_stage (INT) (1=Computed, 2=Reviewed, 3=Approved, 4=Released, 5=Paid)
  - approval_stage_name (VARCHAR 50)
  - approver_id (VARCHAR 20) FK → users.id
  - approval_status (ENUM: pending, approved, rejected)
  - approval_date (DATETIME)
  - approval_remarks (TEXT)
  - next_approver_id (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - payroll_run_id
  - approval_stage
  - approver_id
```

#### 52. payroll_audit_log
```sql
Purpose: Payroll modification audit trail
Scope: All payroll changes
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - payroll_header_id (VARCHAR 20) FK → payroll_headers.id
  - change_type (ENUM: computation_change, line_item_add, line_item_remove, deduction_change, approval_change)
  - previous_value (DECIMAL 12,2)
  - new_value (DECIMAL 12,2)
  - changed_by (VARCHAR 20) FK → users.id
  - change_reason (TEXT)
  - created_at (TIMESTAMP)
Indexes:
  - payroll_header_id
  - changed_by
  - change_type
```

---

### HMO MODULE (7 Tables)

#### 53. hmo_providers
```sql
Purpose: HMO Insurance Provider master
Scope: Accredited HMO companies
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - provider_code (VARCHAR 50) UNIQUE
  - provider_name (VARCHAR 255) UNIQUE
  - contact_number (VARCHAR 20)
  - email (VARCHAR 255)
  - address (TEXT)
  - contact_person (VARCHAR 255)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - provider_code
  - provider_name
  - status
```

#### 54. hmo_plans
```sql
Purpose: HMO plan offerings
Scope: Insurance plan catalog
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - provider_id (VARCHAR 20) FK → hmo_providers.id
  - plan_code (VARCHAR 50) UNIQUE
  - plan_name (VARCHAR 255)
  - plan_type (ENUM: basic, standard, premium, executive)
  - coverage_amount (DECIMAL 15,2)
  - annual_limit (DECIMAL 15,2)
  - monthly_premium_employee (DECIMAL 12,2)
  - monthly_premium_employer (DECIMAL 12,2)
  - dependent_premium (DECIMAL 12,2)
  - max_dependents (INT)
  - coverage_details (JSON)
  - description (TEXT)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - provider_id
  - plan_code
  - status
```

#### 55. hmo_enrollments
```sql
Purpose: Employee HMO enrollments
Scope: Active HMO subscriptions
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - plan_id (VARCHAR 20) FK → hmo_plans.id
  - enrollment_date (DATE)
  - termination_date (DATE)
  - dependent_count (INT)
  - status (ENUM: active, terminated, suspended)
  - effective_date (DATE)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - plan_id
  - enrollment_date
```

#### 56. hmo_dependents
```sql
Purpose: HMO dependent records
Scope: Covered dependents per employee
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - enrollment_id (VARCHAR 20) FK → hmo_enrollments.id
  - dependent_name (VARCHAR 255)
  - relationship (ENUM: spouse, child, parent, sibling)
  - date_of_birth (DATE)
  - id_type (VARCHAR 50)
  - id_number (VARCHAR 100)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - enrollment_id
  - relationship
```

#### 57. hmo_claims
```sql
Purpose: HMO insurance claims
Scope: Claim tracking
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - employee_id (VARCHAR 20) FK → employees.id
  - enrollment_id (VARCHAR 20) FK → hmo_enrollments.id
  - claim_date (DATE)
  - claim_amount (DECIMAL 12,2)
  - service_provider (VARCHAR 255)
  - description (TEXT)
  - attachment_path (VARCHAR 255)
  - status (ENUM: pending, approved, rejected, paid)
  - approved_amount (DECIMAL 12,2)
  - approval_date (DATETIME)
  - remarks (TEXT)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - employee_id
  - enrollment_id
  - claim_date
  - status
```

#### 58. hmo_deduction_mapping
```sql
Purpose: Link HMO premiums to payroll deductions
Scope: Integration point
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - plan_assignment_id (VARCHAR 20) FK → hmo_plan_assignments.id
  - deduction_component_id (VARCHAR 20) FK → deduction_components.id
  - employee_share (DECIMAL 12,2)
  - employer_share (DECIMAL 12,2)
  - dependent_share (DECIMAL 12,2)
  - total_premium (DECIMAL 12,2)
  - deduction_frequency (ENUM: monthly, per_payroll)
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - plan_assignment_id
  - deduction_component_id
```

#### 59. hmo_provider_contracts
```sql
Purpose: HMO service agreements with hospital
Scope: Contract management
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - provider_id (VARCHAR 20) FK → hmo_providers.id
  - contract_start_date (DATE)
  - contract_end_date (DATE)
  - service_level (TEXT)
  - discount_rate (DECIMAL 5,2)
  - renewal_terms (TEXT)
  - status (ENUM: active, expired, terminated)
  - created_at, updated_at (TIMESTAMP)
Indexes:
  - provider_id
  - contract_start_date
```

---

### ANALYTICS MODULE (8 Tables)

#### 60. payroll_cost_summary_monthly
```sql
Purpose: Monthly payroll cost aggregation
Scope: Monthly snapshot
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - year_month (CHAR 7) YYYY-MM
  - department_id (VARCHAR 20) FK → departments.id
  - employee_count (INT)
  - total_gross_salary (DECIMAL 15,2)
  - total_allowances (DECIMAL 15,2)
  - total_deductions (DECIMAL 15,2)
  - total_net_salary (DECIMAL 15,2)
  - total_employer_contribution (DECIMAL 15,2)
  - total_payroll_cost (DECIMAL 15,2)
  - average_salary_per_employee (DECIMAL 12,2)
  - computed_by (VARCHAR 20) FK → users.id
  - created_at (TIMESTAMP)
Indexes:
  - year_month
  - department_id
  - UNIQUE(year_month, department_id)
```

#### 61. attendance_summary_analytics
```sql
Purpose: Monthly attendance metrics
Scope: Attendance analysis
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - year_month (CHAR 7) YYYY-MM
  - department_id (VARCHAR 20) FK → departments.id
  - employee_count (INT)
  - total_present_days (INT)
  - total_absent_days (INT)
  - total_late_incidents (INT)
  - avg_tardiness_minutes (DECIMAL 5,2)
  - total_overtime_hours (DECIMAL 10,2)
  - total_night_hours (DECIMAL 10,2)
  - attendance_rate_percentage (DECIMAL 5,2)
  - created_at (TIMESTAMP)
Indexes:
  - year_month
  - department_id
```

#### 62. leave_usage_summary
```sql
Purpose: Monthly leave consumption analytics
Scope: Leave analysis
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - calendar_year (INT)
  - month (INT)
  - department_id (VARCHAR 20) FK → departments.id
  - leave_type_id (VARCHAR 20) FK → leave_types.id
  - employee_count_used (INT)
  - total_days_used (DECIMAL 5,2)
  - avg_days_per_employee (DECIMAL 5,2)
  - total_balance_used (DECIMAL 5,2)
  - created_at (TIMESTAMP)
Indexes:
  - calendar_year
  - month
  - department_id
  - leave_type_id
```

#### 63. overtime_cost_analysis
```sql
Purpose: Overtime spending analysis
Scope: Overtime metrics
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - year_month (CHAR 7) YYYY-MM
  - department_id (VARCHAR 20) FK → departments.id
  - total_overtime_hours (DECIMAL 10,2)
  - total_overtime_cost (DECIMAL 15,2)
  - avg_overtime_per_employee (DECIMAL 10,2)
  - employees_with_overtime (INT)
  - top_overtime_earner_id (VARCHAR 20) FK → employees.id
  - created_at (TIMESTAMP)
Indexes:
  - year_month
  - department_id
```

#### 64. compensation_analysis
```sql
Purpose: Compensation breakdown analytics
Scope: Salary structure analysis
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - year_month (CHAR 7) YYYY-MM
  - department_id (VARCHAR 20) FK → departments.id
  - salary_grade_id (VARCHAR 20) FK → salary_grades.id
  - employee_count (INT)
  - total_base_salary (DECIMAL 15,2)
  - total_allowances (DECIMAL 15,2)
  - avg_salary (DECIMAL 12,2)
  - min_salary (DECIMAL 12,2)
  - max_salary (DECIMAL 12,2)
  - salary_range (DECIMAL 12,2)
  - created_at (TIMESTAMP)
Indexes:
  - year_month
  - department_id
  - salary_grade_id
```

#### 65. employee_metrics_snapshot
```sql
Purpose: Monthly employee metrics
Scope: Per-employee analytics
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - year_month (CHAR 7) YYYY-MM
  - employee_id (VARCHAR 20) FK → employees.id
  - gross_pay (DECIMAL 12,2)
  - net_pay (DECIMAL 12,2)
  - total_deductions (DECIMAL 12,2)
  - attendance_rate (DECIMAL 5,2)
  - days_absent (INT)
  - overtime_hours (DECIMAL 5,2)
  - leave_days_used (INT)
  - on_time_rate (DECIMAL 5,2)
  - created_at (TIMESTAMP)
Indexes:
  - year_month
  - employee_id
```

#### 66. department_metrics_dashboard
```sql
Purpose: Department KPI dashboard data
Scope: Department analytics
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - year_month (CHAR 7) YYYY-MM
  - department_id (VARCHAR 20) FK → departments.id
  - total_employees (INT)
  - headcount_change (INT)
  - total_payroll_budget (DECIMAL 15,2)
  - actual_payroll_cost (DECIMAL 15,2)
  - budget_variance (DECIMAL 15,2)
  - avg_attendance_rate (DECIMAL 5,2)
  - avg_leave_usage (DECIMAL 5,2)
  - employee_turnover_rate (DECIMAL 5,2)
  - created_at (TIMESTAMP)
Indexes:
  - year_month
  - department_id
```

#### 67. compliance_metrics
```sql
Purpose: Compliance tracking (tax, statutory)
Scope: Compliance analytics
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - year (INT)
  - month (INT)
  - total_employees (INT)
  - sss_contribution_status (ENUM: compliant, pending, non_compliant)
  - philhealth_status (ENUM: compliant, pending, non_compliant)
  - pag_ibig_status (ENUM: compliant, pending, non_compliant)
  - tax_return_filed (BOOLEAN)
  - tax_withholding_amount (DECIMAL 15,2)
  - outstanding_amount (DECIMAL 15,2)
  - last_compliance_check (DATE)
  - created_at (TIMESTAMP)
Indexes:
  - year
  - month
```

---

### SUPPORTING MODULES (7 Tables)

#### 68. notifications
```sql
Purpose: User notification system
Scope: In-app messaging
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - user_id (VARCHAR 20) FK → users.id
  - title (VARCHAR 255)
  - message (TEXT)
  - notification_type (ENUM: leave_approved, leave_rejected, payroll_ready, attendance_warning, system_alert, reminder)
  - related_entity_type (VARCHAR 50)
  - related_entity_id (VARCHAR 20)
  - is_read (BOOLEAN) DEFAULT FALSE
  - read_at (DATETIME)
  - created_at (TIMESTAMP)
  - expires_at (DATETIME)
Indexes:
  - user_id
  - is_read
  - created_at
```

#### 69. notification_templates
```sql
Purpose: Templates for notifications
Scope: Message templates
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - template_name (VARCHAR 100)
  - template_type (ENUM: leave_approval, payroll_ready, attendance_alert, general_alert)
  - subject (VARCHAR 255)
  - message_template (TEXT) (with {placeholder} support)
  - created_at, updated_at (TIMESTAMP)
```

#### 70. approval_workflows
```sql
Purpose: Configurable approval workflows
Scope: Workflow definitions
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - workflow_name (VARCHAR 100)
  - workflow_type (ENUM: leave_approval, salary_change, overtime_approval, payroll_approval)
  - levels (INT)
  - level_config (JSON)
    {
      "1": {"role": "direct_manager", "action": "review"},
      "2": {"role": "hr_manager", "action": "approve"},
      "3": {"role": "finance_officer", "action": "final_approval"}
    }
  - status (ENUM: active, inactive)
  - created_at, updated_at (TIMESTAMP)
```

#### 71. audit_logs
```sql
Purpose: System-wide audit trail
Scope: All user actions
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - user_id (VARCHAR 20) FK → users.id
  - action (VARCHAR 100) (e.g., 'salary_adjustment', 'leave_approved', 'payroll_run')
  - table_name (VARCHAR 50)
  - record_id (VARCHAR 20)
  - old_values (JSON)
  - new_values (JSON)
  - ip_address (VARCHAR 45)
  - user_agent (VARCHAR 255)
  - created_at (TIMESTAMP)
Indexes:
  - user_id
  - action
  - table_name
  - created_at
```

#### 72. status_audit_trail
```sql
Purpose: Track status changes for records
Scope: Status history
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - entity_type (VARCHAR 50) (e.g., 'payroll_run', 'leave_application')
  - entity_id (VARCHAR 20)
  - previous_status (VARCHAR 50)
  - new_status (VARCHAR 50)
  - changed_by (VARCHAR 20) FK → users.id
  - change_reason (TEXT)
  - created_at (TIMESTAMP)
Indexes:
  - entity_type
  - entity_id
  - created_at
```

#### 73. system_parameters
```sql
Purpose: Global system configuration
Scope: Settings
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - param_key (VARCHAR 100) UNIQUE
  - param_value (TEXT)
  - data_type (ENUM: string, number, boolean, json)
  - module (VARCHAR 50)
  - description (TEXT)
  - last_updated_by (VARCHAR 20) FK → users.id
  - created_at, updated_at (TIMESTAMP)
```

#### 74. data_import_logs
```sql
Purpose: Track bulk data imports
Scope: Import history
Fields:
  - id (VARCHAR 20) PRIMARY KEY
  - import_type (VARCHAR 100)
  - file_name (VARCHAR 255)
  - import_date (DATETIME)
  - imported_by (VARCHAR 20) FK → users.id
  - total_records (INT)
  - successful_records (INT)
  - failed_records (INT)
  - error_details (TEXT)
  - status (ENUM: success, partial_success, failed)
  - created_at (TIMESTAMP)
```

---

## Relationship Model

### Core Relationships

```
Employee Master (Hub)
  ├─ users (1:1) → user account authentication
  ├─ positions (1:M) → job assignments
  ├─ departments (1:M) → organizational assignment
  ├─ manager_relationships (1:M) → reporting structure
  └─ employment_history (1:M) → career tracking

Compensation (Feeds Payroll)
  ├─ salary_grades → classification
  ├─ compensation_templates → structure templates
  ├─ employee_compensation → individual salary
  ├─ allowance_components → earnings components
  ├─ deduction_components → deduction components
  └─ statutory_contributions → government rates

Attendance (Feeds Payroll)
  ├─ shift_definitions → shift master
  ├─ shift_assignments → employee shifts
  ├─ attendance_logs → daily tracking
  ├─ late_and_undertime → tracking
  └─ night_differential_tracking → differential pay

Leave (Feeds Payroll)
  ├─ leave_types → leave catalog
  ├─ leave_policies → policies
  ├─ leave_balances → accumulation
  ├─ leave_applications → requests
  └─ leave_approvals → approval workflow

Payroll (Integration Hub)
  ├─ payroll_runs → monthly batches
  ├─ payroll_headers → per-employee records
  ├─ payroll_line_items → earnings detail
  ├─ payroll_deductions → deduction detail
  ├─ government_contributions → statutory tracking
  ├─ payslips → employee slips
  └─ payroll_approvals → approval workflow

HMO (Deduction Integration)
  ├─ hmo_providers → insurance providers
  ├─ hmo_plans → plan offerings
  ├─ hmo_enrollments → employee enrollment
  ├─ hmo_claims → claims tracking
  └─ hmo_deduction_mapping → payroll integration
```

### Data Flow for Monthly Payroll

```
1. ATTENDANCE CAPTURE
   attendance_logs → attendance_summary_monthly
   ↓ (feeds)

2. LEAVE PROCESSING
   leave_applications → leave_approvals → leave_utilization_history
   ↓ (feeds)

3. OVERTIME APPROVAL
   overtime_records → approval → overtime_cost_analysis
   ↓ (feeds)

4. COMPENSATION AGGREGATION
   employee_compensation
   allowance_components → employee_allowances
   deduction_components → employee_deductions
   ↓ (feeds)

5. PAYROLL COMPUTATION
   compensation + attendance + leave + overtime
   ↓ compute via gross_pay_computation
   ↓ net_pay_computation
   
6. PAYROLL APPROVAL
   payroll_headers (draft)
   → payroll_approvals (reviewed)
   → payroll_approvals (approved)
   → payroll_approvals (released)
   → payroll_approvals (paid)

7. PAYROLL OUTPUT
   payslips → employees
   government_contributions → agencies
   tax_returns_summary → BIR

8. ANALYTICS CAPTURE
   All above → monthly snapshots
   payroll_cost_summary_monthly
   attendance_summary_analytics
   compensation_analysis
   employee_metrics_snapshot
```

---

## Indexing Strategy

### Primary Key Indexes (Automatic)
All tables use PRIMARY KEY on `id` column

### Foreign Key Indexes (Automatic)
All FOREIGN KEY relationships automatically indexed

### Performance Indexes

#### Critical Query Paths

1. **Employee Lookup (< 100ms)**
   ```
   employees: email, employee_code, department_id, manager_id, status
   users: email, role, status
   ```

2. **Payroll Processing (< 5s for 1000 employees)**
   ```
   payroll_headers: payroll_run_id, employee_id (UNIQUE composite)
   payroll_line_items: payroll_header_id
   payroll_deductions: payroll_header_id
   attendance_logs: employee_id, attendance_date
   leave_balances: employee_id, calendar_year (UNIQUE composite)
   ```

3. **Leave Management (< 200ms)**
   ```
   leave_applications: employee_id, application_date, approval_status
   leave_approvals: leave_application_id, approval_status
   leave_utilization_history: employee_id, calendar_year
   ```

4. **Overtime Tracking (< 200ms)**
   ```
   overtime_records: employee_id, overtime_date, approval_status
   ```

5. **Attendance Tracking (< 1s for monthly report)**
   ```
   attendance_logs: employee_id, attendance_date, status
   attendance_summary_monthly: employee_id, year_month
   ```

6. **Analytics Queries (< 2s)**
   ```
   payroll_cost_summary_monthly: year_month, department_id
   compensation_analysis: year_month, salary_grade_id
   employee_metrics_snapshot: year_month, employee_id
   ```

### Recommended Additional Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_employee_department_status 
  ON employees(department_id, status);

CREATE INDEX idx_payroll_run_approval_status 
  ON payroll_runs(payroll_period, approval_status);

CREATE INDEX idx_leave_app_employee_status 
  ON leave_applications(employee_id, approval_status);

CREATE INDEX idx_attendance_date_employee 
  ON attendance_logs(attendance_date, employee_id);

CREATE INDEX idx_payroll_cost_dept_month 
  ON payroll_cost_summary_monthly(year_month, department_id);
```

---

## Integration Rules

### Rule 1: Employee ID is Universal Link
```
Every module links to employees.id
No cross-module queries without employee.id reference
```

### Rule 2: Payroll Composition
```
Gross Pay = Base Salary + Allowances + Overtime + Night Diff + Special Pay
Deductions = SSS + PhilHealth + Pag-IBIG + Tax + HMO + Other
Net Pay = Gross Pay - Deductions
Total Cost = Gross Pay + Employer Contributions
```

### Rule 3: Attendance Impact
```
Attendance affects:
  - Gross pay (prorated if absent)
  - Late deduction (per policy)
  - Undertime deduction
  - Overtime computation
  - Night differential
```

### Rule 4: Leave Impact
```
Leave affects:
  - Payroll deduction (if unpaid leave)
  - Leave balance reduction
  - Attendance mark (leave/absent distinction)
  - Overtime eligibility
```

### Rule 5: HMO Deduction Integration
```
HMO premiums map to deduction_components
HMO plan_assignment → hmo_deduction_mapping → deduction_components
Deduction appears in payroll_deductions
Employee and employer shares tracked separately
```

### Rule 6: Approval Workflow
```
Multi-stage approvals:
  1. Leave Applications → L1 Manager → L2 HR → Approved/Rejected
  2. Overtime → Direct Manager → HR → Approved/Rejected
  3. Salary Change → Requestor → HR Manager → Finance Officer → Approved/Rejected
  4. Payroll → Computed → Reviewed → Approved → Released → Paid
```

### Rule 7: Audit Trail
```
All tables track:
  - created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
  - updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE)
  - created_by or changed_by (user_id reference)
  
Critical operations logged in audit_logs table:
  - Salary changes
  - Leave approvals
  - Payroll approvals
  - Deduction modifications
```

### Rule 8: Effective Dating
```
Compensation changes support effective dating:
  - effective_date: When change takes effect
  - end_date: When change expires
  - approval_date: When approved
  - implementation: Always use effective_date for payroll queries
```

### Rule 9: Status Workflows
```
Payroll: draft → computed → reviewed → approved → released → paid
Leave: pending → approved/rejected
Overtime: pending → approved/rejected
Salary Change: pending → approved/rejected
Deduction: active → inactive/completed
```

### Rule 10: Data Access Control
```
user_roles define:
  - admin: Full system access
  - hr_manager: HR-scoped operations
  - payroll_officer: Payroll processing
  - finance_officer: Financial reporting
  - employee: Own record access only
```

---

## Production Readiness

### Database Configuration

```sql
-- Recommended settings for production
SET GLOBAL max_connections = 1000;
SET GLOBAL table_open_cache = 4000;
SET GLOBAL innodb_buffer_pool_size = '25G' (50-75% of RAM);
SET GLOBAL innodb_log_file_size = '512M';
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 2;
SET GLOBAL log_bin = ON (for replication backup);
```

### Backup Strategy

```
- Full backup: Daily at 2 AM
- Incremental backup: Every 4 hours
- Binary logs: Retained for 7 days
- Off-site replication: Real-time to backup server
- Recovery time objective (RTO): < 1 hour
- Recovery point objective (RPO): < 15 minutes
```

### Performance Tuning

```
1. Query Optimization
   - Use payroll_headers with (payroll_run_id, employee_id) index
   - Batch employee updates by department
   - Archive old audit_logs quarterly
   
2. Connection Pooling
   - Maintain 50-100 persistent connections
   - Use connection pooling middleware (e.g., ProxySQL)
   
3. Query Caching
   - Cache employee master data (1 hour TTL)
   - Cache salary grades (2 hour TTL)
   - Cache system_parameters (4 hour TTL)
   
4. Report Optimization
   - Use analytics snapshot tables (monthly aggregates)
   - Avoid joining raw transaction tables for reports
```

### Security Implementation

```sql
-- Row-level security
- Users see only own department/subordinate data
- Finance sees all payroll
- HR sees all employee records
- Employees see own records only

-- Column-level encryption (recommended)
- SSS ID: Encrypted
- PhilHealth ID: Encrypted
- TIN: Encrypted
- Bank Account: Encrypted (if stored)

-- Audit requirements
- Track all salary-related changes
- Track all approval actions
- Track all payroll releases
- Log all data access for reports
```

### Compliance Features Built-In

```
1. Philippine Labor Code
   - 7 salary grades (SG001-SG007)
   - Overtime rates: 1.25x-2.0x per code
   - Night differential: 10%
   - 13th month bonus support
   - Statutory contributions: SSS, PhilHealth, Pag-IBIG

2. Tax Compliance
   - BIR withholding tax brackets
   - Annual exemption support
   - Tax return generation
   - Monthly contribution transmission tracking

3. Social Security
   - SSS computation with employee+employer shares
   - PhilHealth contribution tracking
   - Pag-IBIG contribution tracking

4. Leave Compliance
   - 14 leave types per Labor Code
   - Accrual calculation methods
   - Leave balance tracking
   - Carryover limits

5. HMO Compliance
   - Premium tracking (employee + employer + dependent shares)
   - Claims approval workflow
   - Deduction integration with payroll
```

---

## Conclusion

This unified database schema supports:

✅ **Complete HR Life Cycle**: From hire to payroll to analytics  
✅ **Full Payroll Integration**: Compensation + Attendance + Leave + Deductions  
✅ **Philippine Labor Code Compliance**: 7-grade system, statutory contributions, tax tables  
✅ **Multi-level Approvals**: Flexible workflow for all transactional changes  
✅ **Complete Audit Trail**: All changes tracked for compliance and debugging  
✅ **Analytics Ready**: Snapshot tables for fast reporting  
✅ **Production Scalable**: Optimized for 500-5000 employee hospitals  
✅ **REST API Ready**: Clear, normalized structure for API endpoints  

**Total Tables: 74**  
**Total Relationships: 150+**  
**Estimated Storage (1000 employees, 3 years): 5-10 GB**

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Database Version:** MySQL 8.0+  
**Environment:** Production-Ready Hospital Deployment
