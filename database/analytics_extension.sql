/**
 * Analytics Module - Database Extension
 * HR4 Hospital HR Management System - Philippines
 * Extends existing database with analytics tables, views, and procedures
 * Does NOT replace existing schema.sql
 * 
 * Run this after schema.sql is installed
 */

-- ============================================
-- 1. EMPLOYEE METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employee_metrics (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    metric_date DATE NOT NULL,
    -- Employment metrics
    employment_status VARCHAR(50),
    department_id VARCHAR(20),
    position VARCHAR(100),
    -- Tenure metrics
    days_employed INT,
    years_employed DECIMAL(5, 2),
    -- Attendance metrics
    total_present_days INT DEFAULT 0,
    total_absent_days INT DEFAULT 0,
    total_leave_days INT DEFAULT 0,
    attendance_percentage DECIMAL(5, 2),
    -- Engagement metrics
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_metric_date (metric_date),
    INDEX idx_department_id (department_id),
    INDEX idx_status (employment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. PAYROLL METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payroll_metrics (
    id VARCHAR(20) PRIMARY KEY,
    payroll_run_id VARCHAR(20),
    employee_id VARCHAR(20) NOT NULL,
    payroll_month VARCHAR(7), -- YYYY-MM format
    -- Salary components
    base_salary DECIMAL(12, 2),
    allowances DECIMAL(12, 2) DEFAULT 0,
    deductions DECIMAL(12, 2) DEFAULT 0,
    net_salary DECIMAL(12, 2),
    -- Cost analytics
    employer_contribution DECIMAL(12, 2) DEFAULT 0,
    total_cost DECIMAL(12, 2), -- base + benefits + employer contribution
    -- Compliance deductions
    bir_withholding DECIMAL(12, 2) DEFAULT 0,
    sss_contribution DECIMAL(12, 2) DEFAULT 0,
    philhealth_contribution DECIMAL(12, 2) DEFAULT 0,
    pagibig_contribution DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_payroll_month (payroll_month),
    INDEX idx_employee_id (employee_id),
    UNIQUE KEY unique_payroll_employee_month (payroll_month, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ATTENDANCE METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_metrics (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    attendance_date DATE NOT NULL,
    department_id VARCHAR(20),
    -- Attendance status
    status ENUM('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday') DEFAULT 'present',
    hours_worked DECIMAL(5, 2),
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    -- Leave information
    leave_type VARCHAR(50),
    is_paid_leave BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_status (status),
    INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. LEAVE METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leave_metrics (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    leave_type VARCHAR(100),
    calendar_year INT,
    -- Entitlements
    days_entitled DECIMAL(5, 2),
    days_used DECIMAL(5, 2) DEFAULT 0,
    days_remaining DECIMAL(5, 2),
    -- Compliance
    is_within_policy BOOLEAN DEFAULT TRUE,
    policy_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_year (calendar_year),
    INDEX idx_leave_type (leave_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. COMPLIANCE TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_tracking (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    compliance_type ENUM('BIR', 'SSS', 'PhilHealth', 'Pag-IBIG', 'HMO') NOT NULL,
    compliance_month VARCHAR(7), -- YYYY-MM
    status ENUM('compliant', 'partial', 'missing', 'pending') DEFAULT 'pending',
    compliance_date DATE,
    notes TEXT,
    verified_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_compliance_type (compliance_type),
    INDEX idx_compliance_month (compliance_month),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. DEPARTMENT METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS department_metrics (
    id VARCHAR(20) PRIMARY KEY,
    department_id VARCHAR(20) NOT NULL,
    metric_month VARCHAR(7), -- YYYY-MM
    -- Headcount
    total_employees INT DEFAULT 0,
    active_employees INT DEFAULT 0,
    new_hires INT DEFAULT 0,
    resignations INT DEFAULT 0,
    -- Performance
    average_attendance_percentage DECIMAL(5, 2),
    total_overtime_hours DECIMAL(10, 2) DEFAULT 0,
    average_salary DECIMAL(12, 2),
    total_payroll_cost DECIMAL(15, 2),
    -- HR metrics
    attrition_rate DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_department_id (department_id),
    INDEX idx_metric_month (metric_month),
    UNIQUE KEY unique_dept_month (department_id, metric_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. SALARY ADJUSTMENT TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS salary_adjustments_tracking (
    id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    adjustment_type ENUM('increase', 'decrease', 'promotion', 'demotion', 'adjustment') NOT NULL,
    old_salary DECIMAL(12, 2),
    new_salary DECIMAL(12, 2),
    adjustment_amount DECIMAL(12, 2),
    adjustment_percentage DECIMAL(5, 2),
    effective_date DATE NOT NULL,
    reason TEXT,
    approved_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_adjustment_type (adjustment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. ANALYTICS CACHE TABLE (for performance)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_cache (
    id VARCHAR(20) PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_value LONGTEXT,
    cache_type VARCHAR(50), -- 'dashboard', 'report', 'metric', 'kpi'
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cache_key (cache_key),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. ANALYTICS VIEWS - Real-time aggregation
-- ============================================

-- View: Current Month Payroll Summary
CREATE OR REPLACE VIEW v_payroll_summary_current_month AS
SELECT 
    YEAR(CURDATE()) as year,
    MONTH(CURDATE()) as month,
    DATE_FORMAT(CURDATE(), '%Y-%m') as payroll_month,
    COUNT(DISTINCT employee_id) as total_employees,
    SUM(base_salary) as total_base_salary,
    SUM(allowances) as total_allowances,
    SUM(deductions) as total_deductions,
    SUM(net_salary) as total_net_salary,
    SUM(total_cost) as total_payroll_cost,
    AVG(net_salary) as average_net_salary,
    MAX(base_salary) as max_salary,
    MIN(base_salary) as min_salary,
    COUNT(CASE WHEN sss_contribution > 0 THEN 1 END) as sss_compliant,
    COUNT(CASE WHEN bir_withholding > 0 THEN 1 END) as bir_compliant,
    COUNT(CASE WHEN philhealth_contribution > 0 THEN 1 END) as philhealth_compliant,
    COUNT(CASE WHEN pagibig_contribution > 0 THEN 1 END) as pagibig_compliant
FROM payroll_metrics
WHERE payroll_month = DATE_FORMAT(CURDATE(), '%Y-%m')
GROUP BY year, month, payroll_month;

-- View: Current Month Attendance Summary
CREATE OR REPLACE VIEW v_attendance_summary_current_month AS
SELECT 
    YEAR(CURDATE()) as year,
    MONTH(CURDATE()) as month,
    e.department_id,
    d.name as department_name,
    COUNT(DISTINCT e.id) as total_employees,
    COUNT(CASE WHEN am.status = 'present' THEN 1 END) as total_present_days,
    COUNT(CASE WHEN am.status = 'absent' THEN 1 END) as total_absent_days,
    COUNT(CASE WHEN am.status = 'on_leave' THEN 1 END) as total_leave_days,
    ROUND(100.0 * COUNT(CASE WHEN am.status = 'present' THEN 1 END) / 
        (COUNT(CASE WHEN am.status IN ('present', 'absent', 'late', 'half_day') THEN 1 END) + 1), 2) as attendance_percentage,
    SUM(am.overtime_hours) as total_overtime_hours,
    ROUND(SUM(am.overtime_hours) / COUNT(DISTINCT e.id), 2) as average_overtime_per_employee
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
LEFT JOIN attendance_metrics am ON am.employee_id = e.id 
    AND YEAR(am.attendance_date) = YEAR(CURDATE())
    AND MONTH(am.attendance_date) = MONTH(CURDATE())
WHERE e.status = 'active'
GROUP BY e.department_id, d.name;

-- View: Employee Turnover & Attrition
CREATE OR REPLACE VIEW v_employee_turnover AS
SELECT 
    YEAR(CURDATE()) as year,
    MONTH(CURDATE()) as month,
    e.department_id,
    d.name as department_name,
    COUNT(DISTINCT e.id) as current_headcount,
    COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_employees,
    COUNT(CASE WHEN e.status IN ('resigned', 'terminated') THEN 1 END) as separations_ytd,
    ROUND(100.0 * COUNT(CASE WHEN e.status IN ('resigned', 'terminated') THEN 1 END) / 
        (COUNT(DISTINCT e.id) + 1), 2) as attrition_rate,
    COUNT(CASE WHEN MONTH(e.hire_date) = MONTH(CURDATE()) 
        AND YEAR(e.hire_date) = YEAR(CURDATE()) THEN 1 END) as new_hires_this_month
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
GROUP BY e.department_id, d.name;

-- View: Leave Utilization Summary
CREATE OR REPLACE VIEW v_leave_utilization_summary AS
SELECT 
    YEAR(CURDATE()) as year,
    e.department_id,
    d.name as department_name,
    COUNT(DISTINCT e.id) as total_employees,
    SUM(lm.days_entitled) as total_days_entitled,
    SUM(lm.days_used) as total_days_used,
    SUM(lm.days_remaining) as total_days_remaining,
    ROUND(100.0 * SUM(lm.days_used) / (SUM(lm.days_entitled) + 1), 2) as utilization_percentage,
    AVG(lm.days_used) as average_days_used_per_employee
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
LEFT JOIN leave_metrics lm ON lm.employee_id = e.id AND lm.calendar_year = YEAR(CURDATE())
WHERE e.status = 'active'
GROUP BY e.department_id, d.name;

-- View: Compensation Analysis
CREATE OR REPLACE VIEW v_compensation_analysis AS
SELECT 
    e.department_id,
    d.name as department_name,
    e.position,
    COUNT(e.id) as employee_count,
    AVG(ec.monthly_salary) as average_salary,
    MIN(ec.monthly_salary) as min_salary,
    MAX(ec.monthly_salary) as max_salary,
    STDDEV(ec.monthly_salary) as salary_stddev,
    SUM(ec.monthly_salary) as total_salary_cost,
    AVG(COALESCE(ea.assigned_amount, 0)) as average_allowances,
    SUM(COALESCE(ea.assigned_amount, 0)) as total_allowances
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
LEFT JOIN employee_compensation ec ON ec.employee_id = e.id AND ec.status = 'active'
LEFT JOIN employee_allowances ea ON ea.employee_id = e.id AND ea.status = 'active'
WHERE e.status = 'active'
GROUP BY e.department_id, d.name, e.position;

-- View: Compliance Summary
CREATE OR REPLACE VIEW v_compliance_summary AS
SELECT 
    YEAR(CURDATE()) as year,
    DATE_FORMAT(CURDATE(), '%Y-%m') as current_month,
    compliance_type,
    COUNT(DISTINCT employee_id) as total_employees,
    COUNT(CASE WHEN status = 'compliant' THEN 1 END) as compliant_count,
    COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count,
    COUNT(CASE WHEN status = 'missing' THEN 1 END) as missing_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    ROUND(100.0 * COUNT(CASE WHEN status = 'compliant' THEN 1 END) / 
        (COUNT(DISTINCT employee_id) + 1), 2) as compliance_percentage
FROM compliance_tracking
WHERE compliance_month = DATE_FORMAT(CURDATE(), '%Y-%m')
GROUP BY compliance_type;

-- ============================================
-- 10. STORED PROCEDURES - Data refresh functions
-- ============================================

-- Procedure: Refresh Payroll Metrics
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_refresh_payroll_metrics(IN p_month VARCHAR(7))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error refreshing payroll metrics';
    END;
    
    START TRANSACTION;
    
    -- Clear old metrics for the month
    DELETE FROM payroll_metrics WHERE payroll_month = p_month;
    
    -- Insert new metrics from employee_compensation and payroll data
    INSERT INTO payroll_metrics (
        id, payroll_run_id, employee_id, payroll_month,
        base_salary, allowances, deductions, net_salary,
        employer_contribution, total_cost,
        bir_withholding, sss_contribution, philhealth_contribution, pagibig_contribution
    )
    SELECT 
        CONCAT('PM-', UUID()),
        NULL,
        e.id,
        p_month,
        COALESCE(ec.monthly_salary, 0),
        COALESCE(SUM(ea.assigned_amount), 0),
        0,
        COALESCE(ec.monthly_salary, 0) + COALESCE(SUM(ea.assigned_amount), 0),
        COALESCE(ec.monthly_salary * 0.13, 0), -- 13% employer contribution estimate
        (COALESCE(ec.monthly_salary, 0) + COALESCE(SUM(ea.assigned_amount), 0)) * 1.13,
        COALESCE(ec.monthly_salary * 0.15, 0), -- 15% BIR estimate
        COALESCE(ec.monthly_salary * 0.045, 0), -- 4.5% SSS
        COALESCE(ec.monthly_salary * 0.03, 0), -- 3% PhilHealth
        COALESCE(ec.monthly_salary * 0.02, 0)  -- 2% Pag-IBIG
    FROM employees e
    LEFT JOIN employee_compensation ec ON ec.employee_id = e.id AND ec.status = 'active'
    LEFT JOIN employee_allowances ea ON ea.employee_id = e.id AND ea.status = 'active'
    WHERE e.status = 'active'
    GROUP BY e.id, ec.monthly_salary;
    
    COMMIT;
END//
DELIMITER ;

-- Procedure: Refresh Attendance Metrics
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_refresh_attendance_metrics(IN p_year INT, IN p_month INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error refreshing attendance metrics';
    END;
    
    START TRANSACTION;
    
    -- Update employee_metrics with attendance data
    UPDATE employee_metrics em
    SET 
        total_present_days = (
            SELECT COUNT(*) FROM attendance_metrics 
            WHERE employee_id = em.employee_id 
            AND YEAR(attendance_date) = p_year
            AND MONTH(attendance_date) = p_month
            AND status = 'present'
        ),
        total_absent_days = (
            SELECT COUNT(*) FROM attendance_metrics 
            WHERE employee_id = em.employee_id 
            AND YEAR(attendance_date) = p_year
            AND MONTH(attendance_date) = p_month
            AND status = 'absent'
        ),
        total_leave_days = (
            SELECT COUNT(*) FROM attendance_metrics 
            WHERE employee_id = em.employee_id 
            AND YEAR(attendance_date) = p_year
            AND MONTH(attendance_date) = p_month
            AND status = 'on_leave'
        ),
        attendance_percentage = ROUND(
            100.0 * (SELECT COUNT(*) FROM attendance_metrics 
                WHERE employee_id = em.employee_id 
                AND YEAR(attendance_date) = p_year
                AND MONTH(attendance_date) = p_month
                AND status = 'present'
            ) / (SELECT COUNT(*) FROM attendance_metrics 
                WHERE employee_id = em.employee_id 
                AND YEAR(attendance_date) = p_year
                AND MONTH(attendance_date) = p_month
                AND status IN ('present', 'absent', 'late', 'half_day')
            ) + 1, 2
        ),
        updated_at = NOW()
    WHERE YEAR(metric_date) = p_year AND MONTH(metric_date) = p_month;
    
    COMMIT;
END//
DELIMITER ;

-- Procedure: Refresh Department Metrics
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_refresh_department_metrics(IN p_year INT, IN p_month INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error refreshing department metrics';
    END;
    
    START TRANSACTION;
    
    INSERT INTO department_metrics (
        id, department_id, metric_month,
        total_employees, active_employees, new_hires, resignations,
        average_attendance_percentage, total_overtime_hours, average_salary, total_payroll_cost,
        attrition_rate
    )
    SELECT 
        CONCAT('DM-', UUID()),
        d.id,
        DATE_FORMAT(CURDATE(), '%Y-%m'),
        COUNT(DISTINCT e.id),
        COUNT(CASE WHEN e.status = 'active' THEN 1 END),
        COUNT(CASE WHEN MONTH(e.hire_date) = p_month AND YEAR(e.hire_date) = p_year THEN 1 END),
        COUNT(CASE WHEN e.status IN ('resigned', 'terminated') THEN 1 END),
        AVG(COALESCE(em.attendance_percentage, 0)),
        SUM(COALESCE(am.overtime_hours, 0)),
        AVG(COALESCE(ec.monthly_salary, 0)),
        SUM(COALESCE(ec.monthly_salary, 0)) + SUM(COALESCE(ea.assigned_amount, 0)),
        ROUND(100.0 * COUNT(CASE WHEN e.status IN ('resigned', 'terminated') THEN 1 END) / 
            (COUNT(DISTINCT e.id) + 1), 2)
    FROM departments d
    LEFT JOIN employees e ON e.department_id = d.id
    LEFT JOIN employee_metrics em ON em.employee_id = e.id 
        AND YEAR(em.metric_date) = p_year AND MONTH(em.metric_date) = p_month
    LEFT JOIN attendance_metrics am ON am.employee_id = e.id 
        AND YEAR(am.attendance_date) = p_year AND MONTH(am.attendance_date) = p_month
    LEFT JOIN employee_compensation ec ON ec.employee_id = e.id AND ec.status = 'active'
    LEFT JOIN employee_allowances ea ON ea.employee_id = e.id AND ea.status = 'active'
    GROUP BY d.id
    ON DUPLICATE KEY UPDATE
        total_employees = VALUES(total_employees),
        active_employees = VALUES(active_employees),
        new_hires = VALUES(new_hires),
        resignations = VALUES(resignations),
        average_attendance_percentage = VALUES(average_attendance_percentage),
        total_overtime_hours = VALUES(total_overtime_hours),
        average_salary = VALUES(average_salary),
        total_payroll_cost = VALUES(total_payroll_cost),
        attrition_rate = VALUES(attrition_rate),
        updated_at = NOW();
    
    COMMIT;
END//
DELIMITER ;

-- ============================================
-- 11. INDEXES for performance
-- ============================================
CREATE INDEX idx_em_employee_department ON employee_metrics(employee_id, department_id, metric_date);
CREATE INDEX idx_pm_month_employee ON payroll_metrics(payroll_month, employee_id);
CREATE INDEX idx_am_date_employee ON attendance_metrics(attendance_date, employee_id, status);
CREATE INDEX idx_dm_month_dept ON department_metrics(metric_month, department_id);
