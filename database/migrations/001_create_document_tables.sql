-- Migration: Create document_categories and document_types (required for HR Core Documents)
-- Run this if you see "Table 'hr4_hospital.document_categories' doesn't exist"
-- Usage: mysql -u root hr4_hospital < database/migrations/001_create_document_tables.sql

USE hr4_hospital;

-- Document Categories
CREATE TABLE IF NOT EXISTS document_categories (
    id VARCHAR(20) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Types
CREATE TABLE IF NOT EXISTS document_types (
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

-- Seed default categories if empty
INSERT IGNORE INTO document_categories (id, category_name, description, status) VALUES
('DOC_CAT001', 'Personal Documents', 'Personal identification documents', 'active'),
('DOC_CAT002', 'Work Authorization', 'Work permits and visa documents', 'active'),
('DOC_CAT003', 'Certifications', 'Professional and medical certifications', 'active');

-- Seed default types if empty
INSERT IGNORE INTO document_types (id, category_id, type_name, description, requires_expiry, status) VALUES
('DOC_TYPE001', 'DOC_CAT001', 'National ID', 'National Identification Document', FALSE, 'active'),
('DOC_TYPE002', 'DOC_CAT001', 'Passport', 'International Passport', TRUE, 'active'),
('DOC_TYPE003', 'DOC_CAT002', 'Work Permit', 'Work authorization permit', TRUE, 'active'),
('DOC_TYPE004', 'DOC_CAT003', 'Medical License', 'Medical professional license', TRUE, 'active');
