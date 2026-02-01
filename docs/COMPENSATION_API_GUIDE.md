# Compensation Module API Documentation

## Overview
Complete compensation management system for HR4 Hospital with support for 4 submodules:
1. **Compensation Plans** - Define salary structures and allowances
2. **Salary Adjustments** - Manage salary increases, promotions, COLA with multi-level approvals
3. **Incentives** - Issue performance bonuses, holiday pay, hazard incentives
4. **Pay Bonds** - Manage training bonds, scholarship bonds with auto-deduction scheduling

## Base URL
```
/api/compensation
```

## Authentication
All endpoints require JWT token in `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Compensation Plans

### List Plans
```
GET /api/compensation/plans
```

**Query Parameters:**
- `status` (optional): 'active' or 'inactive'
- `employment_type` (optional): 'regular', 'contractual', 'casual', 'job_order'
- `page` (optional): Default 1
- `limit` (optional): Default 20

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "PLAN001",
        "plan_code": "MGR-001",
        "plan_name": "Manager Grade A",
        "base_salary": 50000,
        "employment_type": "regular",
        "status": "active"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### Get Plan Details
```
GET /api/compensation/plans/{id}
```

**Response includes:**
- Plan basic info
- List of allowances
- List of deductions
- Employee assignments count

### Create Plan
```
POST /api/compensation/plans
```

**Request Body:**
```json
{
  "plan_code": "MGR-002",
  "plan_name": "Manager Grade B",
  "base_salary": 55000,
  "daily_rate": 1833.33,
  "hourly_rate": 229.17,
  "employment_type": "regular",
  "effective_date": "2024-01-01",
  "allowances": [
    {
      "allowance_type": "hazard_pay",
      "amount": 5000,
      "percentage": 10
    }
  ],
  "deductions": [
    {
      "deduction_type": "sss",
      "amount": 1350
    }
  ]
}
```

### Update Plan
```
PUT /api/compensation/plans/{id}
```

### Deactivate Plan
```
DELETE /api/compensation/plans/{id}
```

### Assign Plan to Employee
```
POST /api/compensation/plans/{id}/assign
```

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "effective_date": "2024-02-01",
  "remarks": "Promotion to manager"
}
```

**Approval Workflow:**
- Status: `pending` → `hr_approved` → `approved`
- Requires HR Manager approval before final activation

### Get Plan Assignments
```
GET /api/compensation/plans/{id}/assignments
```

---

## 2. Salary Adjustments

### List Adjustments
```
GET /api/compensation/adjustments
```

**Query Parameters:**
- `employee_id` (optional)
- `status` (optional): 'pending', 'hr_approved', 'finance_approved', 'rejected'
- `type` (optional): 'salary_increase', 'promotion', 'demotion', 'cola', 'merit_increase'
- `page` (optional): Default 1
- `limit` (optional): Default 20

### Get Adjustment Details
```
GET /api/compensation/adjustments/{id}
```

**Response includes:**
- Current and new salary
- Percentage change
- Approval history
- Status timeline

### Create Adjustment
```
POST /api/compensation/adjustments
```

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "adjustment_type": "promotion",
  "current_salary": 50000,
  "new_salary": 60000,
  "effective_date": "2024-03-01",
  "reason": "Promotion to Senior Manager"
}
```

**Multi-level Approval Workflow:**
1. Created with status `pending`
2. HR Manager approval → `hr_approved`
3. Finance Manager approval → `finance_approved`
4. On final approval: Payroll is auto-recalculated

### Update Adjustment
```
PUT /api/compensation/adjustments/{id}
```

Only pending adjustments can be updated.

### HR Approval
```
POST /api/compensation/adjustments/{id}/approve-hr
```

Changes status from `pending` to `hr_approved`

### Finance Approval
```
POST /api/compensation/adjustments/{id}/approve-finance
```

Changes status from `hr_approved` to `finance_approved`
**Triggers:** Auto-recalculation of employee payroll

### Reject Adjustment
```
POST /api/compensation/adjustments/{id}/reject
```

**Request Body:**
```json
{
  "reason": "Budget constraint"
}
```

---

## 3. Incentives

### List Incentive Issuances
```
GET /api/compensation/incentives
```

**Query Parameters:**
- `employee_id` (optional)
- `incentive_type` (optional)
- `status` (optional): 'pending', 'approved', 'rejected'
- `month` (optional): YYYY-MM format

### List Incentive Types
```
GET /api/compensation/incentives/types/list
```

**Response:**
```json
{
  "success": true,
  "data": {
    "types": [
      {
        "id": "ITYPE001",
        "name": "Performance Bonus",
        "description": "Monthly performance incentive",
        "category": "performance_bonus"
      }
    ]
  }
}
```

### Create Incentive Type
```
POST /api/compensation/incentives/types
```

**Request Body:**
```json
{
  "name": "Attendance Bonus",
  "description": "Bonus for perfect attendance",
  "category": "attendance_bonus"
}
```

### Issue Incentive
```
POST /api/compensation/incentives
```

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "incentive_type_id": "ITYPE001",
  "amount": 5000,
  "payment_basis": "fixed",
  "incentive_month": "2024-02-01",
  "criteria": {
    "performance_rating": "excellent",
    "attendance_rate": 100
  },
  "remarks": "February 2024 performance bonus"
}
```

### Get Incentive Details
```
GET /api/compensation/incentives/{id}
```

### Approve Incentive
```
POST /api/compensation/incentives/{id}/approve
```

### Reject Incentive
```
POST /api/compensation/incentives/{id}/reject
```

**Request Body:**
```json
{
  "reason": "Performance criteria not met"
}
```

### Mark as Paid
```
POST /api/compensation/incentives/{id}/mark-paid
```

**Request Body:**
```json
{
  "paid_through": "payroll"
}
```

---

## 4. Pay Bonds

### List Bonds
```
GET /api/compensation/bonds
```

**Query Parameters:**
- `employee_id` (optional)
- `bond_type` (optional): 'training_bond', 'scholarship_bond', 'contractual_bond', 'relocation_bond'
- `status` (optional): 'draft', 'active', 'completed', 'terminated'

### Get Bond Details
```
GET /api/compensation/bonds/{id}
```

**Response includes:**
- Bond information
- Deduction schedule
- Remaining balance

### Create Bond
```
POST /api/compensation/bonds
```

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "bond_type": "training_bond",
  "bond_amount": 100000,
  "monthly_deduction": 5000,
  "deduction_start_date": "2024-03-01",
  "condition_details": {
    "training_institution": "XYZ Hospital",
    "training_duration": "3 months",
    "service_commitment": "2 years"
  }
}
```

**Bond Status Lifecycle:**
- `draft` → `active` (after activation) → `completed` (deducted fully)
- Can be `terminated` early with penalty calculation

### Update Bond (Draft Only)
```
PUT /api/compensation/bonds/{id}
```

### Activate Bond
```
POST /api/compensation/bonds/{id}/activate
```

Changes status from `draft` to `active`

### Get Deduction Schedule
```
GET /api/compensation/bonds/{id}/deductions
```

**Response:**
```json
{
  "bond_summary": {
    "bond_amount": 100000,
    "monthly_deduction": 5000,
    "total_deducted": 15000,
    "remaining_balance": 85000
  },
  "deductions": [
    {
      "id": "DEDN001",
      "deduction_month": "2024-01-01",
      "deduction_amount": 5000,
      "remaining_balance": 95000
    }
  ]
}
```

### Process Monthly Deduction
```
POST /api/compensation/bonds/{id}/deductions/process
```

**Request Body:**
```json
{
  "deduction_month": "2024-02-01"
}
```

**Behavior:**
- Auto-deducts through payroll
- Updates remaining balance
- When balance = 0, changes bond status to `completed`

### Early Termination
```
POST /api/compensation/bonds/{id}/early-termination
```

**Request Body:**
```json
{
  "reason": "employee_resignation",
  "penalty": 10000
}
```

**Response:**
- Final settlement amount (remaining_balance + penalty)
- Bond status changes to `terminated`

---

## 5. Dashboard

### Get Compensation Dashboard Summary
```
GET /api/compensation/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_plans": 5,
    "covered_employees": 250,
    "pending_adjustments": 3,
    "pending_incentives": 8,
    "active_bonds": 12,
    "total_bond_balance": 500000,
    "recent_adjustments": [...],
    "recent_incentives": [...],
    "pending_by_type": [
      {
        "type": "salary_adjustment",
        "count": 3
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required field: employee_id"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or missing token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Salary adjustment not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Server error: Database connection failed"
}
```

---

## Audit Logging

All compensation operations are logged to `compensation_audit_log` table with:
- Entity type (plan, adjustment, incentive, bond)
- Event type (created, updated, approved, rejected, etc.)
- User who performed action
- Changes made (old/new values)
- Timestamp

---

## Philippine Compliance

### Covered Allowances
- Hazard Pay (10% for healthcare workers)
- Meal Allowance (₱4,000)
- Transportation (₱3,000)
- Rice Subsidy (₱2,000)
- Night Differential
- On-call Allowance
- Shift Differential

### Deductions
- SSS (Social Security System)
- PhilHealth
- Pag-IBIG (Housing Benefit)
- Withholding Tax (BIR)
- Union Dues
- Loans/Advances

### Compliance Standards
- DOLE wage regulations for hospitals
- BIR taxation requirements
- SSS/PhilHealth/Pag-IBIG contribution schedules
- Holiday pay calculations

---

## Integration Points

### With Payroll Module
- Auto-trigger payroll recalculation on salary adjustment approval
- Monthly incentive payment through payroll
- Automatic bond deduction integration

### With HR Core Module
- Employee data validation
- Position and salary grade alignment
- Department-based compensation tiers

### With Attendance Module
- Incentive criteria linking (attendance-based bonuses)
- Attendance validation for incentive eligibility

### With Finance Module
- Budget tracking for compensation increases
- Bond escrow management
- Financial impact reporting

---

## Postman Collection

Import the provided `HR4_API_Collection.postman_collection.json` which includes:
- Pre-configured requests for all endpoints
- Sample request/response bodies
- Environment variables for base URL and authentication
- Authorization header setup with JWT token

---

## Rate Limiting

No rate limiting enforced. Consider implementing based on production requirements.

## Pagination

Default page size: 20 items
Maximum page size: 100 items

Request: `GET /api/compensation/plans?page=2&limit=50`

---

## Version
API Version: 1.0.0
Last Updated: 2024
