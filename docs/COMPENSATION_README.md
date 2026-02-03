# Compensation Module - README

## Overview

The Compensation Module is a complete, production-ready compensation management system for the HR4 Hospital HR Management System. It handles salary structures, salary adjustments, incentives, and pay bonds with full Philippine compliance and multi-level approval workflows.

## Features

### ✅ 4 Complete Submodules

1. **Compensation Plans**
   - Define salary structures and tiers
   - Manage allowances (hazard pay, meal, transportation, etc.)
   - Configure deductions (SSS, PhilHealth, Pag-IBIG, tax)
   - Assign plans to employees with approval workflow

2. **Salary Adjustments**
   - Create salary adjustments (promotion, increase, COLA, etc.)
   - Multi-level approval workflow (HR → Finance → Admin)
   - Auto-trigger payroll recalculation on final approval
   - Complete audit trail for all changes

3. **Incentives**
   - Define incentive types (performance, holiday, hazard, loyalty, attendance, productivity)
   - Issue incentives to employees
   - Manage approval and payment status
   - Link to performance metrics and attendance

4. **Pay Bonds**
   - Create training, scholarship, contractual, and relocation bonds
   - Automatic monthly deduction processing
   - Track remaining balance and deduction schedule
   - Handle early termination with penalty calculation

### ✅ Core Capabilities

- **Multi-Level Approval Workflows** - HR → Finance → Admin for salary changes
- **Auto-Payroll Integration** - Changes automatically trigger payroll recalculation
- **Complete Audit Logging** - Every action logged with who, what, when
- **Philippine Compliance** - DOLE, BIR, SSS, PhilHealth, Pag-IBIG standards
- **Role-Based Access Control** - Admin, HR Manager, Finance Officer, Payroll Officer, Employee
- **RESTful API** - All operations via REST endpoints
- **Pagination & Filtering** - Efficient data retrieval with search capabilities
- **Error Handling** - Comprehensive error messages with HTTP status codes

## Project Structure

```
/
├── api/
│   └── compensation/
│       ├── index.php          # Module router
│       ├── plans.php          # Compensation plans CRUD
│       ├── adjustments.php    # Salary adjustments with approvals
│       ├── incentives.php     # Incentive management
│       ├── bonds.php          # Pay bonds management
│       └── dashboard.php      # Dashboard summary data
├── database/
│   ├── compensation_schema.sql # Database migration (11 tables)
│   └── migrations/
│       └── 001_create_compensation_tables.sql
├── docs/
│   ├── COMPENSATION_API_GUIDE.md         # Full API documentation
│   ├── COMPENSATION_DEPLOYMENT_GUIDE.md  # Deployment instructions
│   └── README.md (this file)
└── postman/
    └── HR4_Compensation_Collection.postman_collection.json
```

## Quick Start

### 1. Database Setup

Run the schema migration:

```bash
mysql -u root -p hospital_hr4 < database/compensation_schema.sql
```

This creates 11 normalized tables:
- `compensation_plans` - Plan definitions
- `compensation_plan_allowances` - Plan allowances
- `compensation_plan_deductions` - Plan deductions
- `employee_compensation_assignments` - Employee-plan mappings
- `salary_adjustments` - Salary change records
- `salary_adjustment_history` - Adjustment audit trail
- `incentive_types` - Incentive type definitions
- `incentive_issuances` - Individual incentives
- `pay_bonds` - Bond master data
- `pay_bond_deductions` - Bond deduction schedule
- `compensation_audit_log` - Complete audit trail

### 2. Verify API Endpoints

Test with cURL:

```bash
# List compensation plans
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost//api/compensation/plans
```

Or use Postman with the provided collection.

### 3. Sample Data

Sample data is pre-loaded in the schema:
- 3 compensation plans (Clinical, Administrative, Nursing)
- 5 allowance types
- 4 deduction types
- 4 incentive types

## API Endpoints

### Compensation Plans

```
GET    /api/compensation/plans                    # List plans
POST   /api/compensation/plans                    # Create plan
GET    /api/compensation/plans/{id}               # Get plan details
PUT    /api/compensation/plans/{id}               # Update plan
DELETE /api/compensation/plans/{id}               # Deactivate plan
POST   /api/compensation/plans/{id}/assign        # Assign to employee
GET    /api/compensation/plans/{id}/assignments   # Get assignments
```

### Salary Adjustments

```
GET    /api/compensation/adjustments              # List adjustments
POST   /api/compensation/adjustments              # Create adjustment
GET    /api/compensation/adjustments/{id}         # Get details
PUT    /api/compensation/adjustments/{id}         # Update (pending only)
POST   /api/compensation/adjustments/{id}/approve-hr       # HR approval
POST   /api/compensation/adjustments/{id}/approve-finance  # Finance approval
POST   /api/compensation/adjustments/{id}/reject           # Reject
```

### Incentives

```
GET    /api/compensation/incentives               # List issuances
POST   /api/compensation/incentives               # Issue incentive
GET    /api/compensation/incentives/{id}          # Get details
GET    /api/compensation/incentives/types/list    # List types
POST   /api/compensation/incentives/types         # Create type
POST   /api/compensation/incentives/{id}/approve  # Approve
POST   /api/compensation/incentives/{id}/reject   # Reject
POST   /api/compensation/incentives/{id}/mark-paid        # Mark paid
```

### Pay Bonds

```
GET    /api/compensation/bonds                    # List bonds
POST   /api/compensation/bonds                    # Create bond
GET    /api/compensation/bonds/{id}               # Get details
PUT    /api/compensation/bonds/{id}               # Update (draft only)
POST   /api/compensation/bonds/{id}/activate      # Activate
GET    /api/compensation/bonds/{id}/deductions    # Get schedule
POST   /api/compensation/bonds/{id}/deductions/process   # Process deduction
POST   /api/compensation/bonds/{id}/early-termination    # Early termination
```

### Dashboard

```
GET    /api/compensation/dashboard               # Get summary data
```

## Approval Workflows

### Salary Adjustment Approval Flow

```
Created (pending)
    ↓ [HR Manager]
HR Approved (hr_approved)
    ↓ [Finance Officer]
Finance Approved (finance_approved)
    ↓ [Auto-Payroll Recalculation Triggered]
Applied to Payroll
```

### Incentive Approval Flow

```
Created (pending)
    ↓ [Manager/HR]
Approved (approved)
    ↓ [Payroll Officer]
Marked as Paid (paid)
```

### Pay Bond Lifecycle

```
Draft (created)
    ↓
Active (activated)
    ↓ [Monthly deduction processing]
Completed (when balance = 0)

OR
    ↓
Terminated (early termination with penalty)
```

## Authentication

All endpoints require JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get token through login endpoint in auth module.

## Role-Based Permissions

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| Admin | All operations | None |
| HR Manager | Create/edit plans, create adjustments, HR approval | Finance approval |
| Finance Officer | Approve salary adjustments at finance level | Create plans |
| Payroll Officer | View all data, process deductions, mark paid | Create/approve |
| Employee | View own compensation | Create/edit/approve |

## Request/Response Format

### Request

All POST/PUT requests require JSON body:

```json
{
  "employee_id": "EMP001",
  "adjustment_type": "promotion",
  "current_salary": 50000,
  "new_salary": 60000,
  "effective_date": "2024-03-01"
}
```

### Response - Success

```json
{
  "success": true,
  "data": {
    "id": "SADJ20240201001234",
    "message": "Salary adjustment created successfully"
  }
}
```

### Response - Error

```json
{
  "success": false,
  "error": "Missing required field: employee_id"
}
```

## Philippine Compliance

### Supported Allowances
- Hazard Pay (10% for healthcare)
- Meal Allowance (₱4,000)
- Transportation (₱3,000)
- Rice Subsidy (₱2,000)
- Night Differential
- On-call Allowance
- Shift Differential

### Supported Deductions
- SSS (Social Security)
- PhilHealth (Health Insurance)
- Pag-IBIG (Housing Benefit)
- BIR Withholding Tax
- Union Dues
- Loan Repayments

### Compliance Standards Met
✅ DOLE wage standards for hospitals  
✅ BIR tax regulations  
✅ SSS/PhilHealth/Pag-IBIG contribution requirements  
✅ Holiday and overtime computation  
✅ Minimum wage compliance  

## Audit & Security

### Comprehensive Audit Logging

Every action is logged:
- Who made the change
- What was changed (old vs new values)
- When it was made
- Event type (created, updated, approved, rejected)

View audit logs:
```sql
SELECT * FROM compensation_audit_log 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC;
```

### Data Validation

- Employee existence verified
- Salary within grade range
- Allowances comply with labor law
- Deductions match regulatory requirements
- Bond terms within legal limits

## Performance

### Database Indexes

All critical queries optimized with indexes:
- Salary adjustments by status and employee
- Incentives by month and employee
- Pay bonds by status
- Audit logs by timestamp

### Pagination

Default: 20 items per page  
Maximum: 100 items per page  
Query: `GET /api/compensation/plans?page=2&limit=50`

## Troubleshooting

### Issue: 404 on endpoints
**Solution:** Verify `/api/compensation/` folder exists with all PHP files

### Issue: Authentication fails
**Solution:** Include valid JWT token in Authorization header

### Issue: Database errors
**Solution:** Run compensation_schema.sql migration, verify database tables

### Issue: Approval workflow stuck
**Solution:** Check user role, verify approval status in database

## Integration with Other Modules

### Payroll Module
- Auto-trigger salary recalculation on adjustment approval
- Process monthly incentive payments
- Auto-deduct bonds from salary

### HR Core Module
- Validate employee data
- Align with salary grades
- Link to departments and positions

### Attendance Module
- Use attendance data for incentive criteria
- Calculate attendance-based bonuses

### Finance Module
- Track compensation budget impact
- Bond escrow management
- Financial reporting

## Postman Collection

Complete Postman collection included: `postman/HR4_Compensation_Collection.postman_collection.json`

**Setup:**
1. Import collection into Postman
2. Set `base_url` variable: `http://localhost`
3. Set `token` variable with your JWT token
4. Run pre-built requests

## Documentation

- **API Guide:** `docs/COMPENSATION_API_GUIDE.md` - Complete endpoint documentation
- **Deployment Guide:** `docs/COMPENSATION_DEPLOYMENT_GUIDE.md` - Setup and configuration
- **Database Design:** `database/HR4_DATABASE_DESIGN.md` - Schema overview
- **This README:** Quick start and features overview

## Testing

### Manual Testing

```bash
# Create salary adjustment
curl -X POST http://localhost//api/compensation/adjustments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "adjustment_type": "promotion",
    "current_salary": 50000,
    "new_salary": 60000,
    "effective_date": "2024-03-01",
    "reason": "Promotion"
  }'

# List pending adjustments
curl http://localhost//api/compensation/adjustments?status=pending \
  -H "Authorization: Bearer $TOKEN"

# HR approval
curl -X POST http://localhost//api/compensation/adjustments/{ID}/approve-hr \
  -H "Authorization: Bearer $TOKEN"

# Finance approval (triggers payroll update)
curl -X POST http://localhost//api/compensation/adjustments/{ID}/approve-finance \
  -H "Authorization: Bearer $TOKEN"
```

## Version

**Current Version:** 1.0.0  
**Release Date:** 2024-02-01  
**Status:** Production Ready  

## Support

For issues or questions:
1. Check `docs/COMPENSATION_API_GUIDE.md` for detailed endpoint documentation
2. Review `docs/COMPENSATION_DEPLOYMENT_GUIDE.md` for setup issues
3. Check `compensation_audit_log` table for debugging
4. Review recent entries in `salary_adjustment_history` for workflow issues

## Future Enhancements

- [ ] Frontend UI dashboard for compensation management
- [ ] Advanced reporting and analytics
- [ ] Bulk operations for mass salary adjustments
- [ ] Integration with external payroll systems
- [ ] Mobile app for employee self-service
- [ ] Advanced forecasting for compensation planning
- [ ] Performance management integration

## Files Summary

| File | Purpose | Lines |
|------|---------|-------|
| plans.php | Compensation plans CRUD | ~280 |
| adjustments.php | Salary adjustments with approvals | ~290 |
| incentives.php | Incentive management | ~310 |
| bonds.php | Pay bonds with deduction schedule | ~350 |
| dashboard.php | Summary statistics | ~80 |
| index.php | Module router | ~40 |
| compensation_schema.sql | Database schema (11 tables) | ~350 |
| COMPENSATION_API_GUIDE.md | Full API documentation | ~400 |
| COMPENSATION_DEPLOYMENT_GUIDE.md | Deployment and setup | ~300 |

---

## License & Compliance

This module is designed specifically for HR4 Hospital HR Management System and complies with:
- Philippine Labor Law
- BIR Regulations
- SSS/PhilHealth/Pag-IBIG Requirements
- Hospital Industry Standards

---

**Last Updated:** 2024-02-01  
**Maintained By:** HR Systems Development Team
