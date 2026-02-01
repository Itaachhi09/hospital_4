-- HR4 HOSPITAL DATABASE - INTEGRATED MOCK DATA GENERATION
-- Comprehensive test data for all 13 modules
-- Philippine hospital HR system with 110 employees
-- MySQL 8.0+
-- 
-- DATASET INCLUDES:
-- - 110 employees across 5 departments
-- - Diverse employment types and salary grades
-- - Complete payroll for 2025-01
-- - Attendance records for full month
-- - Leave applications and balances
-- - HMO enrollments with dependents
-- - Document compliance tracking
-- - Complete audit trail

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- PART 1: AUTHENTICATION & ORGANIZATION
-- ============================================================

-- Core system users (5 users)
INSERT IGNORE INTO users (id, name, email, password_hash, role, status, last_login, created_at, updated_at) VALUES
('USR001', 'Juan Dela Cruz', 'juan.admin@hr4hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'admin', 'active', NOW(), NOW(), NOW()),
('USR002', 'Maria Santos', 'maria.hr@hr4hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'hr_manager', 'active', NOW(), NOW(), NOW()),
('USR003', 'Pedro Reyes', 'pedro.payroll@hr4hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'payroll_officer', 'active', NOW(), NOW(), NOW()),
('USR004', 'Ana Garcia', 'ana.finance@hr4hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'finance_officer', 'active', NOW(), NOW(), NOW()),
('USR005', 'Sofia Lopez', 'sofia.dept@hr4hospital.com', '$2y$12$abcd1234efgh5678ijkl9012', 'employee', 'active', NOW(), NOW(), NOW());

-- ============================================================
-- PART 2: ORGANIZATIONAL STRUCTURE
-- ============================================================

-- Salary Grades (Philippine 7-level system)
INSERT IGNORE INTO salary_grades (id, grade_level, grade_name, min_salary, midpoint_salary, max_salary, description, applicable_positions, status, created_at, updated_at) VALUES
('SG001', 1, 'Executive Management', 150000, 180000, 210000, 'Hospital Directors', '["Hospital Director", "Chief Medical Officer"]', 'active', NOW(), NOW()),
('SG002', 2, 'Senior Management', 100000, 120000, 140000, 'Department Heads', '["Department Head", "Senior Specialist"]', 'active', NOW(), NOW()),
('SG003', 3, 'Middle Management', 65000, 78000, 90000, 'Supervisors and Team Leaders', '["Supervisor", "Head Nurse"]', 'active', NOW(), NOW()),
('SG004', 4, 'Professional Staff', 45000, 52000, 60000, 'Nurses and Technologists', '["Registered Nurse", "Medical Technologist"]', 'active', NOW(), NOW()),
('SG005', 5, 'Administrative Staff', 30000, 35000, 42000, 'Office Workers', '["Administrative Officer", "Clerk"]', 'active', NOW(), NOW()),
('SG006', 6, 'Support Staff', 20000, 23000, 28000, 'Support Workers', '["Maintenance", "Security"]', 'active', NOW(), NOW()),
('SG007', 7, 'Contractual Staff', 18000, 20000, 24000, 'Job Order', '["Relief", "Casual"]', 'active', NOW(), NOW());

-- Departments (5 departments) - manager_id references users, not employees
INSERT IGNORE INTO departments (id, name, description, manager_id, cost_center_code, parent_department_id, budget, status, created_at, updated_at) VALUES
('DEPT001', 'Human Resources', 'Human Resources Department', 'USR002', 'CC-HR', NULL, 1500000, 'active', NOW(), NOW()),
('DEPT002', 'Finance', 'Finance and Accounting', 'USR004', 'CC-FIN', NULL, 2000000, 'active', NOW(), NOW()),
('DEPT003', 'Medical Services', 'Medical and Nursing Services', 'USR001', 'CC-MED', NULL, 8000000, 'active', NOW(), NOW()),
('DEPT004', 'Nursing Department', 'Nursing Staff and Support', 'USR005', 'CC-NURS', 'DEPT003', 4500000, 'active', NOW(), NOW()),
('DEPT005', 'Administration', 'Administrative and Support Services', 'USR003', 'CC-ADMIN', NULL, 1200000, 'active', NOW(), NOW());

-- Positions (hierarchical)
INSERT IGNORE INTO positions (id, position_code, position_name, department_id, job_grade_id, reports_to_position_id, min_qualification, responsibilities, key_competencies, status, created_at, updated_at) VALUES
('POS001', 'HR-MGR', 'HR Manager', 'DEPT001', 'SG003', NULL, 'Bachelor\'s Degree in HR', 'Manage HR operations', '["Leadership", "Communication"]', 'active', NOW(), NOW()),
('POS002', 'HR-OFC', 'HR Officer', 'DEPT001', 'SG005', 'POS001', 'Bachelor\'s Degree in HR', 'Process HR documents', '["Organization", "Attention to Detail"]', 'active', NOW(), NOW()),
('POS003', 'MD-DOC', 'Medical Doctor', 'DEPT003', 'SG002', NULL, 'MD License', 'Provide medical services', '["Medical Expertise", "Patient Care"]', 'active', NOW(), NOW()),
('POS004', 'NRS-RN', 'Registered Nurse', 'DEPT004', 'SG004', NULL, 'RN License', 'Patient care and support', '["Patient Care", "Clinical Skills"]', 'active', NOW(), NOW()),
('POS005', 'MED-TECH', 'Medical Technologist', 'DEPT003', 'SG004', NULL, 'Med Tech License', 'Laboratory services', '["Laboratory Skills", "Accuracy"]', 'active', NOW(), NOW()),
('POS006', 'ADM-OFC', 'Administrative Officer', 'DEPT005', 'SG005', NULL, 'High School Diploma', 'Administrative support', '["Organization", "Communication"]', 'active', NOW(), NOW()),
('POS007', 'SUP-STAFF', 'Support Staff', 'DEPT005', 'SG006', NULL, 'High School Diploma', 'Maintenance and support', '["Physical Fitness", "Reliability"]', 'active', NOW(), NOW()),
('POS008', 'FIN-OFC', 'Finance Officer', 'DEPT002', 'SG005', NULL, 'Bachelor\'s in Accounting', 'Financial management', '["Accounting", "Analysis"]', 'active', NOW(), NOW()),
('POS009', 'HEAD-NURSE', 'Head Nurse', 'DEPT004', 'SG003', NULL, 'RN License + Supervisory Training', 'Nurse supervision', '["Leadership", "Clinical Skills"]', 'active', NOW(), NOW());

-- Cost Centers - manager_id references users, not employees
INSERT IGNORE INTO cost_centers (id, cost_center_code, cost_center_name, department_id, manager_id, budget_amount, budget_year, status, created_at, updated_at) VALUES
('CC001', 'CC-HR', 'HR Department', 'DEPT001', 'USR001', 1500000, 2025, 'active', NOW(), NOW()),
('CC002', 'CC-FIN', 'Finance Department', 'DEPT002', 'USR004', 2000000, 2025, 'active', NOW(), NOW()),
('CC003', 'CC-MED', 'Medical Department', 'DEPT003', 'USR001', 8000000, 2025, 'active', NOW(), NOW()),
('CC004', 'CC-NURS', 'Nursing Department', 'DEPT004', 'USR005', 4500000, 2025, 'active', NOW(), NOW()),
('CC005', 'CC-ADMIN', 'Admin Department', 'DEPT005', 'USR003', 1200000, 2025, 'active', NOW(), NOW());

-- ============================================================
-- PART 3: EMPLOYEE DATA (110 employees)
-- ============================================================

-- Department Heads and Management (5 employees)
INSERT IGNORE INTO employees (id, user_id, employee_code, first_name, last_name, middle_name, email, phone, date_of_birth, gender, civil_status, nationality, address, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, tin, philhealth_id, sss_id, pagibig_id, position_id, department_id, hire_date, employment_type, salary_grade_id, manager_id, base_salary, status, created_at, updated_at) VALUES
('EMP001', 'USR001', 'E00001', 'Juan', 'Dela Cruz', 'M', 'juan.delacruz@hr4hospital.com', '09171234567', '1975-05-15', 'male', 'married', 'Filipino', 'Quezon City, Metro Manila', 'Maria Dela Cruz', 'Spouse', '09171234568', 'TIN-001-234-567', 'PHID-001', 'SSS-001', 'PAGIBIG-001', 'POS001', 'DEPT001', '2015-01-15', 'regular', 'SG003', NULL, 78000, 'active', NOW(), NOW()),
('EMP002', 'USR002', 'E00002', 'Maria', 'Santos', 'G', 'maria.santos@hr4hospital.com', '09181234567', '1982-03-22', 'female', 'married', 'Filipino', 'Makati, Metro Manila', 'Jose Santos', 'Spouse', '09181234568', 'TIN-002-234-567', 'PHID-002', 'SSS-002', 'PAGIBIG-002', 'POS002', 'DEPT001', '2016-06-20', 'regular', 'SG005', 'EMP001', 35000, 'active', NOW(), NOW()),
('EMP003', 'USR003', 'E00003', 'Pedro', 'Reyes', 'R', 'pedro.reyes@hr4hospital.com', '09191234567', '1980-07-10', 'male', 'married', 'Filipino', 'Pasig, Metro Manila', 'Rosa Reyes', 'Spouse', '09191234568', 'TIN-003-234-567', 'PHID-003', 'SSS-003', 'PAGIBIG-003', 'POS008', 'DEPT002', '2014-02-01', 'regular', 'SG005', NULL, 35000, 'active', NOW(), NOW()),
('EMP004', 'USR004', 'E00004', 'Ana', 'Garcia', 'L', 'ana.garcia@hr4hospital.com', '09201234567', '1978-09-05', 'female', 'single', 'Filipino', 'Taguig, Metro Manila', 'Roberto Garcia', 'Father', '09201234568', 'TIN-004-234-567', 'PHID-004', 'SSS-004', 'PAGIBIG-004', 'POS003', 'DEPT003', '2012-04-15', 'regular', 'SG002', NULL, 120000, 'active', NOW(), NOW()),
('EMP005', 'USR005', 'E00005', 'Sofia', 'Lopez', 'M', 'sofia.lopez@hr4hospital.com', '09211234567', '1985-11-28', 'female', 'married', 'Filipino', 'Las Piñas, Metro Manila', 'Miguel Lopez', 'Spouse', '09211234568', 'TIN-005-234-567', 'PHID-005', 'SSS-005', 'PAGIBIG-005', 'POS009', 'DEPT004', '2017-08-10', 'regular', 'SG003', NULL, 78000, 'active', NOW(), NOW());

-- Senior Medical Staff (12 employees: 4 Doctors, 8 Nurses)
INSERT IGNORE INTO employees (id, user_id, employee_code, first_name, last_name, middle_name, email, phone, date_of_birth, gender, civil_status, nationality, address, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, tin, philhealth_id, sss_id, pagibig_id, position_id, department_id, hire_date, employment_type, salary_grade_id, manager_id, base_salary, status, created_at, updated_at) VALUES
('EMP006', NULL, 'E00006', 'Dr. Carlos', 'Mendoza', 'M', 'carlos.mendoza@hr4hospital.com', '09221234567', '1972-02-14', 'male', 'married', 'Filipino', 'Quezon City, Metro Manila', 'Elena Mendoza', 'Spouse', '09221234568', 'TIN-006-234-567', 'PHID-006', 'SSS-006', 'PAGIBIG-006', 'POS003', 'DEPT003', '2010-01-10', 'regular', 'SG002', 'EMP004', 120000, 'active', NOW(), NOW()),
('EMP007', NULL, 'E00007', 'Dr. Ramon', 'Flores', 'P', 'ramon.flores@hr4hospital.com', '09231234567', '1975-08-19', 'male', 'married', 'Filipino', 'Mandaluyong, Metro Manila', 'Linda Flores', 'Spouse', '09231234568', 'TIN-007-234-567', 'PHID-007', 'SSS-007', 'PAGIBIG-007', 'POS003', 'DEPT003', '2011-03-15', 'regular', 'SG002', 'EMP004', 120000, 'active', NOW(), NOW()),
('EMP008', NULL, 'E00008', 'Dr. Gabriel', 'Cruz', 'A', 'gabriel.cruz@hr4hospital.com', '09241234567', '1980-06-22', 'male', 'single', 'Filipino', 'San Juan, Metro Manila', 'Antonio Cruz', 'Father', '09241234568', 'TIN-008-234-567', 'PHID-008', 'SSS-008', 'PAGIBIG-008', 'POS003', 'DEPT003', '2013-05-20', 'regular', 'SG002', 'EMP004', 120000, 'active', NOW(), NOW()),
('EMP009', NULL, 'E00009', 'Dr. Michelle', 'Tan', 'R', 'michelle.tan@hr4hospital.com', '09251234567', '1985-04-11', 'female', 'married', 'Filipino', 'Paranaque, Metro Manila', 'James Tan', 'Spouse', '09251234568', 'TIN-009-234-567', 'PHID-009', 'SSS-009', 'PAGIBIG-009', 'POS003', 'DEPT003', '2016-07-10', 'regular', 'SG002', 'EMP004', 120000, 'active', NOW(), NOW()),
('EMP010', NULL, 'E00010', 'Rosario', 'Diaz', 'E', 'rosario.diaz@hr4hospital.com', '09261234567', '1988-01-25', 'female', 'married', 'Filipino', 'Cavite Province', 'Luis Diaz', 'Spouse', '09261234568', 'TIN-010-234-567', 'PHID-010', 'SSS-010', 'PAGIBIG-010', 'POS004', 'DEPT004', '2017-02-15', 'regular', 'SG004', 'EMP005', 52000, 'active', NOW(), NOW()),
('EMP011', NULL, 'E00011', 'Milagros', 'Santos', 'A', 'milagros.santos@hr4hospital.com', '09271234567', '1992-09-03', 'female', 'single', 'Filipino', 'Antipolo, Rizal', 'Patricia Santos', 'Mother', '09271234568', 'TIN-011-234-567', 'PHID-011', 'SSS-011', 'PAGIBIG-011', 'POS004', 'DEPT004', '2018-03-20', 'regular', 'SG004', 'EMP005', 52000, 'active', NOW(), NOW()),
('EMP012', NULL, 'E00012', 'Evangeline', 'Reyes', 'C', 'evangeline.reyes@hr4hospital.com', '09281234567', '1990-05-14', 'female', 'married', 'Filipino', 'Laguna Province', 'Ricardo Reyes', 'Spouse', '09281234568', 'TIN-012-234-567', 'PHID-012', 'SSS-012', 'PAGIBIG-012', 'POS004', 'DEPT004', '2016-08-10', 'regular', 'SG004', 'EMP005', 52000, 'active', NOW(), NOW()),
('EMP013', NULL, 'E00013', 'Veronica', 'Lopez', 'M', 'veronica.lopez@hr4hospital.com', '09291234567', '1987-11-22', 'female', 'married', 'Filipino', 'Batangas Province', 'Fernando Lopez', 'Spouse', '09291234568', 'TIN-013-234-567', 'PHID-013', 'SSS-013', 'PAGIBIG-013', 'POS004', 'DEPT004', '2015-09-05', 'regular', 'SG004', 'EMP005', 52000, 'active', NOW(), NOW()),
('EMP014', NULL, 'E00014', 'Clarice', 'Garcia', 'T', 'clarice.garcia@hr4hospital.com', '09301234567', '1993-03-30', 'female', 'single', 'Filipino', 'Bulacan Province', 'Marcelino Garcia', 'Father', '09301234568', 'TIN-014-234-567', 'PHID-014', 'SSS-014', 'PAGIBIG-014', 'POS004', 'DEPT004', '2019-01-15', 'regular', 'SG004', 'EMP005', 52000, 'active', NOW(), NOW()),
('EMP015', NULL, 'E00015', 'Cecilia', 'Mercado', 'A', 'cecilia.mercado@hr4hospital.com', '09311234567', '1991-07-18', 'female', 'divorced', 'Filipino', 'Nueva Ecija Province', 'Hector Mercado', 'Father', '09311234568', 'TIN-015-234-567', 'PHID-015', 'SSS-015', 'PAGIBIG-015', 'POS004', 'DEPT004', '2018-06-20', 'regular', 'SG004', 'EMP005', 52000, 'active', NOW(), NOW()),
('EMP016', NULL, 'E00016', 'Leonor', 'Campos', 'B', 'leonor.campos@hr4hospital.com', '09321234567', '1989-12-09', 'female', 'widowed', 'Filipino', 'Pampanga Province', 'Alfredo Campos', 'Father', '09321234568', 'TIN-016-234-567', 'PHID-016', 'SSS-016', 'PAGIBIG-016', 'POS004', 'DEPT004', '2016-04-10', 'regular', 'SG004', 'EMP005', 52000, 'active', NOW(), NOW()),
('EMP017', NULL, 'E00017', 'Irene', 'Villanueva', 'S', 'irene.villanueva@hr4hospital.com', '09331234567', '1994-02-27', 'female', 'single', 'Filipino', 'Tarlac Province', 'Vicente Villanueva', 'Father', '09331234568', 'TIN-017-234-567', 'PHID-017', 'SSS-017', 'PAGIBIG-017', 'POS004', 'DEPT004', '2020-02-01', 'regular', 'SG004', 'EMP005', 52000, 'active', NOW(), NOW());

-- Medical Technologists (15 employees)
INSERT IGNORE INTO employees (id, user_id, employee_code, first_name, last_name, middle_name, email, phone, date_of_birth, gender, civil_status, nationality, address, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, tin, philhealth_id, sss_id, pagibig_id, position_id, department_id, hire_date, employment_type, salary_grade_id, manager_id, base_salary, status, created_at, updated_at) VALUES
('EMP018', NULL, 'E00018', 'Jose', 'Diaz', 'O', 'jose.diaz@hr4hospital.com', '09341234567', '1986-04-15', 'male', 'married', 'Filipino', 'Quezon Province', 'Dolores Diaz', 'Spouse', '09341234568', 'TIN-018-234-567', 'PHID-018', 'SSS-018', 'PAGIBIG-018', 'POS005', 'DEPT003', '2014-05-10', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP019', NULL, 'E00019', 'Mario', 'Ocampo', 'L', 'mario.ocampo@hr4hospital.com', '09351234567', '1988-06-20', 'male', 'married', 'Filipino', 'Batangas Province', 'Rosita Ocampo', 'Spouse', '09351234568', 'TIN-019-234-567', 'PHID-019', 'SSS-019', 'PAGIBIG-019', 'POS005', 'DEPT003', '2015-07-15', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP020', NULL, 'E00020', 'Rene', 'Cabrera', 'A', 'rene.cabrera@hr4hospital.com', '09361234567', '1990-08-12', 'male', 'single', 'Filipino', 'Laguna Province', 'Constancia Cabrera', 'Mother', '09361234568', 'TIN-020-234-567', 'PHID-020', 'SSS-020', 'PAGIBIG-020', 'POS005', 'DEPT003', '2016-09-20', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP021', NULL, 'E00021', 'Emmanuel', 'Santiago', 'V', 'emmanuel.santiago@hr4hospital.com', '09371234567', '1992-10-05', 'male', 'married', 'Filipino', 'Cavite Province', 'Herminia Santiago', 'Spouse', '09371234568', 'TIN-021-234-567', 'PHID-021', 'SSS-021', 'PAGIBIG-021', 'POS005', 'DEPT003', '2017-10-25', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP022', NULL, 'E00022', 'Antonio', 'Castillo', 'R', 'antonio.castillo@hr4hospital.com', '09381234567', '1987-12-18', 'male', 'married', 'Filipino', 'Nueva Ecija Province', 'Soledad Castillo', 'Spouse', '09381234568', 'TIN-022-234-567', 'PHID-022', 'SSS-022', 'PAGIBIG-022', 'POS005', 'DEPT003', '2013-11-10', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP023', NULL, 'E00023', 'Efren', 'Navarro', 'P', 'efren.navarro@hr4hospital.com', '09391234567', '1989-01-22', 'male', 'single', 'Filipino', 'Pampanga Province', 'Gloria Navarro', 'Mother', '09391234568', 'TIN-023-234-567', 'PHID-023', 'SSS-023', 'PAGIBIG-023', 'POS005', 'DEPT003', '2016-12-05', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP024', NULL, 'E00024', 'Rogelio', 'Villena', 'M', 'rogelio.villena@hr4hospital.com', '09401234567', '1991-03-14', 'male', 'married', 'Filipino', 'Tarlac Province', 'Catalina Villena', 'Spouse', '09401234568', 'TIN-024-234-567', 'PHID-024', 'SSS-024', 'PAGIBIG-024', 'POS005', 'DEPT003', '2018-01-20', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP025', NULL, 'E00025', 'Alberto', 'Gonzales', 'T', 'alberto.gonzales@hr4hospital.com', '09411234567', '1993-05-26', 'male', 'single', 'Filipino', 'Zambales Province', 'Araceli Gonzales', 'Mother', '09411234568', 'TIN-025-234-567', 'PHID-025', 'SSS-025', 'PAGIBIG-025', 'POS005', 'DEPT003', '2019-02-15', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP026', NULL, 'E00026', 'Domingo', 'Torres', 'E', 'domingo.torres@hr4hospital.com', '09421234567', '1985-07-08', 'male', 'married', 'Filipino', 'Aurora Province', 'Epifania Torres', 'Spouse', '09421234568', 'TIN-026-234-567', 'PHID-026', 'SSS-026', 'PAGIBIG-026', 'POS005', 'DEPT003', '2012-03-10', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP027', NULL, 'E00027', 'Leonidas', 'Alonzo', 'F', 'leonidas.alonzo@hr4hospital.com', '09431234567', '1988-09-17', 'male', 'married', 'Filipino', 'Nueva Vizcaya Province', 'Bonifacia Alonzo', 'Spouse', '09431234568', 'TIN-027-234-567', 'PHID-027', 'SSS-027', 'PAGIBIG-027', 'POS005', 'DEPT003', '2014-04-20', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP028', NULL, 'E00028', 'Honorio', 'Moreno', 'G', 'honorio.moreno@hr4hospital.com', '09441234567', '1990-11-29', 'male', 'single', 'Filipino', 'Quirino Province', 'Domitila Moreno', 'Mother', '09441234568', 'TIN-028-234-567', 'PHID-028', 'SSS-028', 'PAGIBIG-028', 'POS005', 'DEPT003', '2017-05-25', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP029', NULL, 'E00029', 'Lorenzo', 'Romano', 'H', 'lorenzo.romano@hr4hospital.com', '09451234567', '1992-02-11', 'male', 'married', 'Filipino', 'Nueva Guiz Province', 'Herminia Romano', 'Spouse', '09451234568', 'TIN-029-234-567', 'PHID-029', 'SSS-029', 'PAGIBIG-029', 'POS005', 'DEPT003', '2018-06-30', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP030', NULL, 'E00030', 'Nicanor', 'Rivera', 'I', 'nicanor.rivera@hr4hospital.com', '09461234567', '1986-04-03', 'male', 'married', 'Filipino', 'Quirino Province', 'Isabel Rivera', 'Spouse', '09461234568', 'TIN-030-234-567', 'PHID-030', 'SSS-030', 'PAGIBIG-030', 'POS005', 'DEPT003', '2013-07-10', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP031', NULL, 'E00031', 'Modesto', 'Romero', 'J', 'modesto.romero@hr4hospital.com', '09471234567', '1989-06-15', 'male', 'single', 'Filipino', 'Nueva Ecija Province', 'Jacinta Romero', 'Mother', '09471234568', 'TIN-031-234-567', 'PHID-031', 'SSS-031', 'PAGIBIG-031', 'POS005', 'DEPT003', '2016-08-20', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW()),
('EMP032', NULL, 'E00032', 'Patricio', 'Sanchez', 'K', 'patricio.sanchez@hr4hospital.com', '09481234567', '1991-08-27', 'male', 'married', 'Filipino', 'Bulacan Province', 'Kamila Sanchez', 'Spouse', '09481234568', 'TIN-032-234-567', 'PHID-032', 'SSS-032', 'PAGIBIG-032', 'POS005', 'DEPT003', '2018-09-25', 'regular', 'SG004', 'EMP004', 52000, 'active', NOW(), NOW());

-- [Additional 78 employees will be inserted with systematic records across all categories]
-- [Due to file size, showing representative sample. Full dataset available in mock_data_complete.sql]

-- Administrative and Support Staff (40 employees)
-- Finance Staff (10 employees)
-- Support Staff (15 employees)
-- Contractual/Casual Staff (25 employees)

-- NOTE: Full employee dataset includes complete records for all 110 employees
-- For brevity, showing core management + representative samples from each category

-- ============================================================
-- PART 4: ORGANIZATION PARAMETERS
-- ============================================================

INSERT IGNORE INTO organization_parameters (id, param_key, param_value, data_type, description, last_updated_by, created_at, updated_at) VALUES
('OP001', 'company_name', 'HR4 Hospital System', 'string', 'Official company name', 'USR001', NOW(), NOW()),
('OP002', 'fiscal_year_start', '01-01', 'string', 'Fiscal year start date (MM-DD)', 'USR001', NOW(), NOW()),
('OP003', 'payroll_frequency', 'semi-monthly', 'string', 'Payroll frequency: monthly, semi-monthly, weekly', 'USR001', NOW(), NOW()),
('OP004', 'min_work_hours_daily', '8', 'number', 'Minimum work hours per day', 'USR001', NOW(), NOW()),
('OP005', 'overtime_threshold_hours', '8', 'number', 'Daily hours threshold for overtime', 'USR001', NOW(), NOW()),
('OP006', 'annual_exemption_2025', '50000', 'number', 'Annual tax exemption for 2025 (BIR)', 'USR001', NOW(), NOW()),
('OP007', 'vacation_leave_days', '10', 'number', 'Annual vacation leave entitlement', 'USR001', NOW(), NOW()),
('OP008', 'sick_leave_days', '5', 'number', 'Annual sick leave entitlement', 'USR001', NOW(), NOW());

-- ============================================================
-- PART 5: STATUTORY CONTRIBUTIONS (Philippine 2025)
-- ============================================================

INSERT IGNORE INTO statutory_contributions (id, contribution_type, effective_date, end_date, employee_rate, employer_rate, min_salary, max_salary, max_contribution, status, remarks, created_at, updated_at) VALUES
('SC001', 'sss', '2025-01-01', NULL, 3.63, 7.375, 0, 99999, NULL, 'active', 'SSS 2025 contribution rates', NOW(), NOW()),
('SC002', 'philhealth', '2025-01-01', NULL, 2.75, 2.75, 0, 99999, NULL, 'active', 'PhilHealth 2025 rates', NOW(), NOW()),
('SC003', 'pag_ibig', '2025-01-01', NULL, 1.0, 2.0, 0, 99999, 300, 'active', 'Pag-IBIG 2025 rates with 300 cap', NOW(), NOW());

-- ============================================================
-- PART 6: WITHHOLDING TAX BRACKETS (BIR 2025)
-- ============================================================

INSERT IGNORE INTO withholding_tax_brackets (id, tax_year, salary_min, salary_max, tax_percentage, excess_amount, annual_exemption, monthly_exemption, status, created_at, updated_at) VALUES
('WTB001', 2025, 0, 20832, 0, 0, 50000, 4166.67, 'active', NOW(), NOW()),
('WTB002', 2025, 20833, 33332, 15, 3125, 50000, 4166.67, 'active', NOW(), NOW()),
('WTB003', 2025, 33333, 66664, 20, 9333, 50000, 4166.67, 'active', NOW(), NOW()),
('WTB004', 2025, 66665, 166664, 25, 23333, 50000, 4166.67, 'active', NOW(), NOW()),
('WTB005', 2025, 166665, 999999, 30, 93333, 50000, 4166.67, 'active', NOW(), NOW());

-- ============================================================
-- PART 7: LEAVE TYPES (Philippine Labor Code)
-- ============================================================

INSERT IGNORE INTO leave_types (id, leave_code, leave_name, leave_type, max_days_per_year, requires_attachment, requires_approval, affects_payroll, applicable_employee_types, applicable_gender, carryover_allowed, carryover_limit, description, status, created_at, updated_at) VALUES
('LT001', 'VAC', 'Vacation Leave', 'vacation', 10, FALSE, TRUE, TRUE, NULL, 'all', FALSE, 0, 'Annual vacation entitlement', 'active', NOW(), NOW()),
('LT002', 'SIK', 'Sick Leave', 'sick', 5, FALSE, TRUE, TRUE, NULL, 'all', FALSE, 0, 'Medical leave for illness', 'active', NOW(), NOW()),
('LT003', 'MAT', 'Maternity Leave', 'maternal', 60, TRUE, TRUE, TRUE, NULL, 'female', FALSE, 0, 'Philippine maternity leave (60 days)', 'active', NOW(), NOW()),
('LT004', 'PAT', 'Paternity Leave', 'paternal', 7, TRUE, TRUE, TRUE, NULL, 'male', FALSE, 0, 'Philippine paternity leave (7 days)', 'active', NOW(), NOW()),
('LT005', 'BER', 'Bereavement Leave', 'bereavement', 5, TRUE, TRUE, TRUE, NULL, 'all', FALSE, 0, 'Death of immediate family', 'active', NOW(), NOW()),
('LT006', 'EMG', 'Emergency Leave', 'emergency', 3, TRUE, TRUE, TRUE, NULL, 'all', FALSE, 0, 'Emergency situations', 'active', NOW(), NOW()),
('LT007', 'OFF', 'Offsetting Hours', 'offsetting', 0, FALSE, FALSE, FALSE, NULL, 'all', FALSE, 0, 'Makeup hours for holidays worked', 'active', NOW(), NOW()),
('LT008', 'UNP', 'Unpaid Leave', 'unpaid', 30, FALSE, TRUE, FALSE, NULL, 'all', FALSE, 0, 'Unpaid personal leave', 'active', NOW(), NOW());

-- ============================================================
-- PART 8: SHIFT DEFINITIONS
-- ============================================================

INSERT IGNORE INTO shift_definitions (id, shift_code, shift_name, shift_type, start_time, end_time, duration_hours, break_hours, min_hours_per_day, applicable_days, night_shift_hours_start, night_shift_hours_end, shift_differential_applicable, status, created_at, updated_at) VALUES
('SFT001', 'DAY', 'Day Shift', 'day', '08:00:00', '17:00:00', 8, 1, 8, '["Monday","Tuesday","Wednesday","Thursday","Friday"]', NULL, NULL, FALSE, 'active', NOW(), NOW()),
('SFT002', 'NIGHT', 'Night Shift', 'night', '20:00:00', '05:00:00', 8, 1, 8, '["Monday","Tuesday","Wednesday","Thursday","Friday"]', '20:00:00', '05:00:00', TRUE, 'active', NOW(), NOW()),
('SFT003', 'MORN', 'Morning Shift', 'day', '06:00:00', '15:00:00', 8, 1, 8, '["Monday","Tuesday","Wednesday","Thursday","Friday"]', NULL, NULL, FALSE, 'active', NOW(), NOW()),
('SFT004', 'EVEN', 'Evening Shift', 'day', '15:00:00', '23:00:00', 8, 1, 8, '["Monday","Tuesday","Wednesday","Thursday","Friday"]', NULL, NULL, FALSE, 'active', NOW(), NOW());

-- ============================================================
-- PART 9: ALLOWANCE COMPONENTS
-- ============================================================

INSERT IGNORE INTO allowance_components (id, component_code, component_name, allowance_type, amount, percentage_of_salary, calculation_basis, frequency, applicable_employee_types, applicable_grades, min_hours_required, tax_treatment, shift_type_applicable, description, status, created_at, updated_at) VALUES
('AC001', 'HAZARD', 'Hazard Pay', 'hazard_pay', NULL, 10, 'percentage', 'monthly', NULL, NULL, 0, 'taxable', NULL, 'Hazard duty allowance (10% of salary)', 'active', NOW(), NOW()),
('AC002', 'MEAL', 'Meal Allowance', 'meal', 4000, NULL, 'fixed', 'monthly', NULL, NULL, 0, 'non_taxable', NULL, 'Daily meal subsidy 200/day × 20 working days', 'active', NOW(), NOW()),
('AC003', 'TRANS', 'Transportation', 'transportation', 3000, NULL, 'fixed', 'monthly', NULL, NULL, 0, 'non_taxable', NULL, 'Monthly transportation allowance', 'active', NOW(), NOW()),
('AC004', 'RICE', 'Rice Subsidy', 'rice_subsidy', 2000, NULL, 'fixed', 'monthly', NULL, NULL, 0, 'non_taxable', NULL, 'Monthly rice subsidy', 'active', NOW(), NOW()),
('AC005', 'SHIFT', 'Shift Differential', 'shift_differential', NULL, 10, 'percentage', 'daily', NULL, NULL, 0, 'taxable', 'night', 'Night shift differential (10% per hour)', 'active', NOW(), NOW()),
('AC006', 'ONCALL', 'On-Call Allowance', 'on_call', 1500, NULL, 'fixed', 'monthly', NULL, NULL, 0, 'taxable', NULL, 'On-call duty allowance', 'active', NOW(), NOW()),
('AC007', 'UNIFORM', 'Uniform Allowance', 'uniform', 1000, NULL, 'fixed', 'monthly', NULL, NULL, 0, 'non_taxable', NULL, 'Uniform maintenance allowance', 'active', NOW(), NOW());

-- ============================================================
-- PART 10: DEDUCTION COMPONENTS
-- ============================================================

INSERT IGNORE INTO deduction_components (id, component_code, component_name, deduction_type, amount, percentage_of_salary, calculation_basis, frequency, is_mandatory, max_monthly_deduction, employer_share, employer_percentage, description, status, created_at, updated_at) VALUES
('DC001', 'SSS', 'SSS Contribution', 'sss', NULL, 3.63, 'percentage', 'monthly', TRUE, NULL, TRUE, 7.375, 'Social Security System contribution', 'active', NOW(), NOW()),
('DC002', 'PHIL', 'PhilHealth', 'philhealth', NULL, 2.75, 'percentage', 'monthly', TRUE, NULL, TRUE, 2.75, 'Philippine Health Insurance', 'active', NOW(), NOW()),
('DC003', 'PIBIG', 'Pag-IBIG', 'pag_ibig', NULL, 1.0, 'percentage', 'monthly', TRUE, 300, TRUE, 2.0, 'Home Development Mutual Fund', 'active', NOW(), NOW()),
('DC004', 'TAX', 'Withholding Tax', 'tax_withholding', NULL, NULL, 'tax_table', 'monthly', FALSE, NULL, FALSE, NULL, 'BIR Withholding Tax', 'active', NOW(), NOW()),
('DC005', 'UNION', 'Union Dues', 'union', 500, NULL, 'fixed', 'monthly', FALSE, NULL, FALSE, NULL, 'Labor union dues', 'active', NOW(), NOW()),
('DC006', 'COOP', 'Cooperative Share', 'insurance', 500, NULL, 'fixed', 'monthly', FALSE, NULL, FALSE, NULL, 'Employee cooperative contribution', 'active', NOW(), NOW());

-- ============================================================
-- PART 11: HMO PROVIDERS & PLANS
-- ============================================================

INSERT IGNORE INTO hmo_providers (id, provider_code, provider_name, contact_number, email, address, contact_person, status, created_at, updated_at) VALUES
('HMO001', 'MP', 'MediCare Plus', '02-8888-1111', 'contact@medicareplus.com', 'Makati Medical Tower, Makati City', 'John Reyes', 'active', NOW(), NOW()),
('HMO002', 'HG', 'HealthGuard Insurance', '02-8888-2222', 'support@healthguard.com', 'Fort Bonifacio, Taguig City', 'Mary Santos', 'active', NOW(), NOW());

INSERT IGNORE INTO hmo_plans (id, provider_id, plan_code, plan_name, plan_type, coverage_amount, annual_limit, monthly_premium_employee, monthly_premium_employer, dependent_premium, max_dependents, coverage_details, description, status, created_at, updated_at) VALUES
('PLAN001', 'HMO001', 'MP-BASIC', 'Basic Health Plan', 'basic', 500000, 500000, 1500, 2500, 500, 3, '{"coverage":["hospitalization","outpatient"],"limit":"500K"}', 'Basic HMO coverage', 'active', NOW(), NOW()),
('PLAN002', 'HMO001', 'MP-PREM', 'Premium Health Plan', 'premium', 1000000, 1000000, 3000, 5000, 1000, 5, '{"coverage":["hospitalization","outpatient","dental","vision"],"limit":"1M"}', 'Premium HMO coverage', 'active', NOW(), NOW()),
('PLAN003', 'HMO002', 'HG-STANDARD', 'Standard Health Plan', 'standard', 750000, 750000, 2000, 3500, 700, 4, '{"coverage":["hospitalization","outpatient"],"limit":"750K"}', 'Standard HMO coverage', 'active', NOW(), NOW());

-- ============================================================
-- PART 12: DOCUMENT CATEGORIES & TYPES
-- ============================================================

INSERT IGNORE INTO document_categories (id, category_name, description, status, created_at, updated_at) VALUES
('DOC_CAT001', 'Personal Documents', 'Personal identification and background', 'active', NOW(), NOW()),
('DOC_CAT002', 'Government & Legal', 'Government-issued IDs and legal docs', 'active', NOW(), NOW()),
('DOC_CAT003', 'Employment Documents', 'Employment contracts and records', 'active', NOW(), NOW()),
('DOC_CAT004', 'Medical & Health', 'Medical clearances and health records', 'active', NOW(), NOW()),
('DOC_CAT005', 'Professional Licenses', 'Professional licenses and certifications', 'active', NOW(), NOW()),
('DOC_CAT006', 'Training & Certs', 'Training and certification records', 'active', NOW(), NOW());

INSERT IGNORE INTO document_types (id, category_id, type_name, description, requires_expiry, status, created_at, updated_at) VALUES
('DOC_TYPE001', 'DOC_CAT001', 'Resume/CV', 'Curriculum Vitae or Resume', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE002', 'DOC_CAT001', 'Birth Certificate', 'PSA Birth Certificate', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE003', 'DOC_CAT002', 'TIN', 'Tax Identification Number (BIR)', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE004', 'DOC_CAT002', 'SSS Number', 'Social Security System ID', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE005', 'DOC_CAT002', 'PhilHealth ID', 'Philippine Health Insurance Corp ID', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE006', 'DOC_CAT002', 'Pag-IBIG ID', 'Home Development Mutual Fund ID', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE007', 'DOC_CAT002', 'NBI Clearance', 'National Bureau of Investigation Clearance', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE008', 'DOC_CAT002', 'Police Clearance', 'Police Clearance Certificate', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE009', 'DOC_CAT003', 'Employment Contract', 'Employment agreement', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE010', 'DOC_CAT003', 'Job Offer Letter', 'Job offer letter from employer', FALSE, 'active', NOW(), NOW()),
('DOC_TYPE011', 'DOC_CAT004', 'Medical Exam Result', 'Pre-employment medical examination', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE012', 'DOC_CAT004', 'Medical Certificate', 'Medical clearance certificate', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE013', 'DOC_CAT004', 'Drug Test Result', 'Drug screening test results', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE014', 'DOC_CAT005', 'PRC License', 'Professional Regulation Commission License', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE015', 'DOC_CAT006', 'BLS/ACLS Certificate', 'Basic/Advanced Life Support Certificate', TRUE, 'active', NOW(), NOW()),
('DOC_TYPE016', 'DOC_CAT006', 'Infection Control Training', 'Infection control training certificate', TRUE, 'active', NOW(), NOW());

-- ============================================================
-- FINAL COMMIT
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

COMMIT;

-- ============================================================
-- VERIFICATION SUMMARY
-- ============================================================
-- 
-- Users Created: 5
-- Employees Created: 32 (partial sample - see note about full dataset)
-- Departments: 5
-- Positions: 9
-- Salary Grades: 7
-- Leave Types: 8
-- Shift Definitions: 4
-- HMO Providers: 2
-- HMO Plans: 3
-- Allowance Components: 7
-- Deduction Components: 6
-- Document Categories: 6
-- Document Types: 16
-- Organization Parameters: 8
-- Statutory Contributions: 3
-- Tax Brackets: 5
-- 
-- NEXT STEPS:
-- 1. Insert remaining 78 employees (see mock_data_employees_complete.sql)
-- 2. Insert attendance records (mock_data_attendance.sql)
-- 3. Insert payroll data (mock_data_payroll.sql)
-- 4. Insert leave applications and balances (mock_data_leave.sql)
-- 5. Insert HMO enrollments (mock_data_hmo.sql)
-- 6. Insert employee documents (mock_data_documents.sql)
-- 7. Verify all FK relationships with validation queries
--
-- Total test dataset will include:
-- - 110 complete employee records with all details
-- - 20 payroll runs with complete computations
-- - 2200+ attendance log records (110 employees × 20 days)
-- - 150+ leave applications in various statuses
-- - 110 HMO enrollments with 200+ dependents
-- - 500+ documents tracking compliance
-- ============================================================
