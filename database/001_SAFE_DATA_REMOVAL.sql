-- HR4 HOSPITAL DATABASE - SAFE DATA REMOVAL SCRIPTS
-- Complete data cleanup preserving schema integrity
-- MySQL 8.0+
-- WARNING: This script DELETES ALL DATA. Backup database before running.

-- ============================================================
-- PART 1: PRE-DELETION CHECKS & BACKUP
-- ============================================================

-- Create backup summary tables (optional - for audit trail)
-- Uncomment if you want to keep a record of deleted records

/*
CREATE TABLE IF NOT EXISTS deleted_records_backup (
    backup_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    table_name VARCHAR(100),
    record_count INT,
    backup_notes TEXT
);
*/

-- ============================================================
-- PART 2: DISABLE FOREIGN KEY CHECKS
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- PART 3: DATA DELETION IN PROPER ORDER
-- ============================================================

-- LEVEL 1: System & Audit Tables (no FK dependencies)
DELETE FROM audit_logs WHERE 1=1;
DELETE FROM status_audit_trail WHERE 1=1;
DELETE FROM data_import_logs WHERE 1=1;
DELETE FROM notifications WHERE 1=1;
DELETE FROM notification_templates WHERE 1=1;
DELETE FROM approval_workflows WHERE 1=1;

-- LEVEL 2: Analytics Tables (aggregated data)
DELETE FROM payroll_cost_summary_monthly WHERE 1=1;
DELETE FROM attendance_summary_analytics WHERE 1=1;
DELETE FROM leave_usage_summary WHERE 1=1;
DELETE FROM overtime_cost_analysis WHERE 1=1;
DELETE FROM compensation_analysis WHERE 1=1;
DELETE FROM employee_metrics_snapshot WHERE 1=1;
DELETE FROM department_metrics_dashboard WHERE 1=1;
DELETE FROM compliance_metrics WHERE 1=1;

-- LEVEL 3: Attendance Records
DELETE FROM late_and_undertime_records WHERE 1=1;
DELETE FROM night_differential_tracking WHERE 1=1;
DELETE FROM shift_swap_requests WHERE 1=1;
DELETE FROM attendance_summary_monthly WHERE 1=1;
DELETE FROM attendance_logs WHERE 1=1;

-- LEVEL 4: Leave Management (careful order: utilization → approvals → applications → balances → policies → types)
DELETE FROM leave_utilization_history WHERE 1=1;
DELETE FROM leave_approvals WHERE 1=1;
DELETE FROM leave_applications WHERE 1=1;
DELETE FROM leave_balances WHERE 1=1;
DELETE FROM leave_policies WHERE 1=1;
DELETE FROM leave_types WHERE 1=1;

-- LEVEL 5: Shift Management
DELETE FROM employee_shift_assignments WHERE 1=1;
DELETE FROM shift_swap_requests WHERE 1=1;
DELETE FROM shift_templates WHERE 1=1;
DELETE FROM shift_definitions WHERE 1=1;

-- LEVEL 6: Payroll Module (careful order due to multiple dependencies)
DELETE FROM payroll_audit_log WHERE 1=1;
DELETE FROM payroll_deductions WHERE 1=1;
DELETE FROM payroll_line_items WHERE 1=1;
DELETE FROM government_contributions WHERE 1=1;
DELETE FROM payslips WHERE 1=1;
DELETE FROM thirteenth_month_computation WHERE 1=1;
DELETE FROM net_pay_computation WHERE 1=1;
DELETE FROM tax_returns_summary WHERE 1=1;
DELETE FROM payroll_approvals WHERE 1=1;
DELETE FROM payroll_headers WHERE 1=1;
DELETE FROM payroll_runs WHERE 1=1;

-- LEVEL 7: Compensation Module (in dependency order)
DELETE FROM compensation_approvals WHERE 1=1;
DELETE FROM compensation_history WHERE 1=1;
DELETE FROM gross_pay_computation WHERE 1=1;
DELETE FROM employee_deductions WHERE 1=1;
DELETE FROM employee_allowances WHERE 1=1;
DELETE FROM employee_compensation WHERE 1=1;
DELETE FROM deduction_components WHERE 1=1;
DELETE FROM allowance_components WHERE 1=1;
DELETE FROM statutory_contributions WHERE 1=1;
DELETE FROM withholding_tax_brackets WHERE 1=1;
DELETE FROM overtime_records WHERE 1=1;
DELETE FROM compensation_templates WHERE 1=1;

-- LEVEL 8: HMO Module
DELETE FROM hmo_claims WHERE 1=1;
DELETE FROM hmo_dependents WHERE 1=1;
DELETE FROM hmo_deduction_mapping WHERE 1=1;
DELETE FROM hmo_enrollments WHERE 1=1;
DELETE FROM hmo_plans WHERE 1=1;
DELETE FROM hmo_provider_contracts WHERE 1=1;
DELETE FROM hmo_providers WHERE 1=1;

-- LEVEL 9: Documents
DELETE FROM employee_documents WHERE 1=1;
DELETE FROM documents WHERE 1=1;
DELETE FROM document_types WHERE 1=1;
DELETE FROM document_categories WHERE 1=1;

-- LEVEL 10: Skills
DELETE FROM skills WHERE 1=1;

-- LEVEL 11: Employment History & HR Core Support
DELETE FROM manager_relationships WHERE 1=1;
DELETE FROM user_roles WHERE 1=1;
DELETE FROM organization_parameters WHERE 1=1;
DELETE FROM benefits WHERE 1=1;
DELETE FROM employment_history WHERE 1=1;
DELETE FROM employment_status_history WHERE 1=1;
DELETE FROM cost_centers WHERE 1=1;

-- LEVEL 12: Base HR Data (CRITICAL ORDER)
-- First clear employees (which has self-referencing manager_id)
DELETE FROM employees WHERE 1=1;

-- Then clear positions (which has self-referencing reports_to_position_id)
DELETE FROM positions WHERE 1=1;

-- Then clear departments (which has self-referencing parent_department_id)
DELETE FROM departments WHERE 1=1;

-- Then clear salary grades
DELETE FROM salary_grades WHERE 1=1;

-- Finally clear users
DELETE FROM users WHERE 1=1;

-- ============================================================
-- PART 4: RE-ENABLE FOREIGN KEY CHECKS
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- PART 5: RESET AUTO_INCREMENT COUNTERS (Optional)
-- ============================================================

-- Uncomment the following if you want to reset auto-increment values
-- (Most HR4 tables use VARCHAR PKs, so auto-increment reset not needed)

/*
-- Example (if tables used AUTO_INCREMENT):
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE employees AUTO_INCREMENT = 1;
-- etc...
*/

-- ============================================================
-- PART 6: VERIFICATION QUERIES (Run after deletion)
-- ============================================================

/*
-- Run these queries to verify all data has been deleted:

SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'payroll_runs', COUNT(*) FROM payroll_runs
UNION ALL
SELECT 'attendance_logs', COUNT(*) FROM attendance_logs
UNION ALL
SELECT 'leave_applications', COUNT(*) FROM leave_applications
UNION ALL
SELECT 'hmo_enrollments', COUNT(*) FROM hmo_enrollments
UNION ALL
SELECT 'payslips', COUNT(*) FROM payslips;

-- Expected: All counts should be 0

-- Verify schema integrity:
SHOW TABLES;
-- Expected: All 73 tables should still exist

-- Check foreign key constraints:
SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'hr4_hospital'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
-- Expected: All FK constraints should still be in place
*/

-- ============================================================
-- COMPLETE: Database is now empty
-- Ready for: Mock data insertion
-- ============================================================

COMMIT;
