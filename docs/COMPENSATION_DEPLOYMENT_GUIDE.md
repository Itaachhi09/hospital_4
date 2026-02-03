# Compensation Module - Deployment & Setup Guide

## Quick Start

### 1. Database Schema Migration

Run the compensation schema SQL file in MySQL:

```bash
mysql -u root -p hospital_hr4 < database/compensation_schema.sql
```

Or through phpMyAdmin:
1. Import `database/compensation_schema.sql`
2. Execute all SQL statements

**Tables Created:**
- `compensation_plans` - Plan master data
- `compensation_plan_allowances` - Allowances per plan
- `compensation_plan_deductions` - Deductions per plan
- `employee_compensation_assignments` - Employee-plan mapping
- `salary_adjustments` - Salary change records
- `salary_adjustment_history` - Audit trail for adjustments
- `incentive_types` - Incentive type definitions
- `incentive_issuances` - Individual incentive records
- `pay_bonds` - Bond master data
- `pay_bond_deductions` - Deduction schedule tracking
- `compensation_audit_log` - Complete audit trail

### 2. File Structure

```
api/compensation/
├── index.php              # Router
├── plans.php              # Compensation Plans API
├── adjustments.php        # Salary Adjustments API
├── incentives.php         # Incentives API
├── bonds.php              # Pay Bonds API
└── dashboard.php          # Dashboard Summary API

database/
├── compensation_schema.sql # Main schema file
├── migrations/
│   └── 001_create_compensation_tables.sql
```

### 3. Configuration

No additional configuration needed. Uses existing:
- Database connection from `config/database.php`
- Authentication from `middlewares/AuthMiddleware.php`
- Constants from `config/constants.php`

### 4. Initial Data

Sample data is included in `compensation_schema.sql`:

**Sample Compensation Plans:**
- Clinical Staff Plan (₱35,000 base)
- Administrative Staff Plan (₱28,000 base)
- Nursing Staff Plan (₱32,000 base)

**Sample Allowances:**
- Hazard Pay
- Meal Allowance
- Transportation
- Night Differential
- Shift Differential

**Sample Deductions:**
- SSS
- PhilHealth
- Pag-IBIG
- Withholding Tax

### 5. Testing Endpoints

#### Test with curl:

```bash
# List compensation plans
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost/api/compensation/plans

# Create salary adjustment
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "adjustment_type": "promotion",
    "current_salary": 50000,
    "new_salary": 60000,
    "effective_date": "2024-03-01",
    "reason": "Promotion to Senior Manager"
  }' \
  http://localhost/api/compensation/adjustments

# Issue incentive
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "incentive_type_id": "ITYPE001",
    "amount": 5000,
    "incentive_month": "2024-02-01"
  }' \
  http://localhost/api/compensation/incentives
```

#### Or use Postman:
1. Import `postman/HR4_API_Collection.postman_collection.json`
2. Set `base_url` variable to `http://localhost`
3. Set `token` variable with your JWT token
4. Run pre-built requests

---

## Approval Workflows

### Salary Adjustments Workflow

```
Created (pending)
    ↓
HR Manager Approves (hr_approved)
    ↓
Finance Manager Approves (finance_approved)
    ↓ [Auto-trigger Payroll Recalculation]
Approved (status = approved)
    ↓
Applied to Employee Payroll
```

**Required Permissions:**
- HR Manager: Can approve at HR level
- Finance Officer: Can approve at Finance level
- Admin: Can override any stage

### Incentives Approval

```
Created (pending)
    ↓
HR/Manager Reviews (approved/rejected)
    ↓
Mark as Paid (through payroll)
```

### Pay Bonds Lifecycle

```
Draft (initial creation)
    ↓
Activate (activate_bond endpoint)
    ↓
Active (deductions start)
    ↓
Process Deductions (monthly, auto-deduct through payroll)
    ↓
Completed (when balance = 0)
    
OR
    ↓
Early Termination (with penalty calculation)
```

---

## Payroll Integration

### Auto-Deduction Mechanism

The compensation module integrates with payroll through:

1. **Salary Adjustments**
   - When finance-approved, trigger payroll recomputation
   - Update employee salary_master record
   - Next payroll run uses new salary

2. **Incentives**
   - Monthly incentives added to payroll during incentive processing
   - Mark as paid through `POST /api/compensation/incentives/{id}/mark-paid`

3. **Pay Bonds**
   - Monthly deduction processed automatically
   - Deduct amount from gross salary
   - Track remaining balance in `pay_bond_deductions` table

### Integration Code Example

In payroll computation engine, add:

```php
// Get active salary adjustments for employee
$sql = "SELECT new_salary FROM salary_adjustments 
        WHERE employee_id = ? AND approval_status = 'finance_approved'
        ORDER BY created_at DESC LIMIT 1";

// Get approved incentives for pay month
$sql = "SELECT COALESCE(SUM(amount), 0) as total_incentives
        FROM incentive_issuances 
        WHERE employee_id = ? AND approval_status = 'approved'
        AND incentive_month = ?";

// Get active bond deduction
$sql = "SELECT monthly_deduction FROM pay_bonds 
        WHERE employee_id = ? AND bond_status = 'active'";
```

---

## Role-Based Access Control

### Admin
- All access across all compensation operations
- Can override approvals
- Can deactivate plans

### HR Manager
- Create/edit compensation plans
- Create/approve salary adjustments at HR level
- View all compensation data
- Can assign plans to employees

### Finance Officer
- Approve salary adjustments at finance level
- View compensation impact on budget
- Approve incentive issuances for payment

### Payroll Officer
- View compensation data
- Process monthly bond deductions
- Mark incentives as paid
- Generate compensation reports

### Employee
- View own compensation plan
- View own salary adjustments (approved only)
- View own incentives
- View own pay bond status

---

## Audit & Compliance

### Audit Logging

Every compensation action is logged:

```sql
SELECT * FROM compensation_audit_log
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC;
```

Tracks:
- User who made change
- What was changed (old vs new values)
- When change was made
- Event type (created, updated, approved, rejected)

### Compliance Validation

Module validates:
- ✅ Employee exists and is active
- ✅ Salary within grade range
- ✅ Allowances comply with Philippine labor law
- ✅ Deductions match regulatory requirements
- ✅ Bond terms are within legal limits

---

## Performance Optimization

### Indexes

All critical queries have indexes:

```sql
CREATE INDEX idx_salary_adjustments_status ON salary_adjustments(approval_status);
CREATE INDEX idx_salary_adjustments_employee ON salary_adjustments(employee_id);
CREATE INDEX idx_incentive_issuances_month ON incentive_issuances(incentive_month);
CREATE INDEX idx_pay_bonds_status ON pay_bonds(bond_status);
```

### Query Optimization

- Pagination limited to 100 items max
- Foreign key validation indexed
- Use covering indexes for common queries

---

## Troubleshooting

### Issue: Compensation endpoints return 404

**Solution:**
- Verify API path: `/api/compensation/plans` (not `/api/compensation_plans`)
- Check `api/compensation/` folder exists with all PHP files
- Verify `.htaccess` is configured for URL rewriting

### Issue: Authentication fails

**Solution:**
- Ensure JWT token is valid and not expired
- Check `AuthMiddleware::verifyToken()` in request headers
- Include: `Authorization: Bearer <token>`

### Issue: Database connection errors

**Solution:**
- Run `compensation_schema.sql` migration
- Verify database tables exist: `SHOW TABLES LIKE 'compensation%'`
- Check `config/database.php` connection parameters

### Issue: Approval workflow stuck

**Solution:**
- Check current `approval_status` in database
- Verify user role has permission for next approval level
- View `salary_adjustment_history` for audit trail

---

## Backup & Recovery

### Backup Compensation Data

```bash
# Full compensation module backup
mysqldump -u root -p hospital_hr4 \
  compensation_plans \
  compensation_plan_allowances \
  compensation_plan_deductions \
  employee_compensation_assignments \
  salary_adjustments \
  salary_adjustment_history \
  incentive_types \
  incentive_issuances \
  pay_bonds \
  pay_bond_deductions \
  compensation_audit_log \
  > compensation_backup_$(date +%Y%m%d).sql
```

### Recovery

```bash
mysql -u root -p hospital_hr4 < compensation_backup_20240201.sql
```

---

## Updates & Maintenance

### To add new compensation allowance type:

1. Add to `compensation_plan_allowances` table
2. Update schema documentation
3. Create migration file in `database/migrations/`
4. Deploy to production with version number

### To modify approval workflow:

1. Update approval logic in `adjustments.php`
2. Add new approval status if needed
3. Update audit logging
4. Test workflow with sample data

### To add new incentive category:

1. Insert into `incentive_types` table
2. Create corresponding criteria validation
3. Test with sample issuances

---

## Monitoring & Reporting

### Key Metrics to Monitor

```sql
-- Pending approvals by manager
SELECT approved_by_hr, COUNT(*) as pending
FROM salary_adjustments
WHERE approval_status = 'hr_approved'
GROUP BY approved_by_hr;

-- Monthly incentive expense
SELECT YEAR(incentive_month) as year, MONTH(incentive_month) as month,
       SUM(amount) as total_incentives
FROM incentive_issuances
WHERE approval_status = 'approved'
GROUP BY YEAR(incentive_month), MONTH(incentive_month);

-- Bond deduction tracking
SELECT employee_id, SUM(remaining_balance) as total_bonds_owed
FROM pay_bonds
WHERE bond_status IN ('active', 'draft')
GROUP BY employee_id;
```

---

## Support & Documentation

- **API Documentation:** `docs/COMPENSATION_API_GUIDE.md`
- **Schema Design:** `database/HR4_DATABASE_DESIGN.md`
- **Postman Collection:** `postman/HR4_API_Collection.postman_collection.json`
- **Module Code:** `api/compensation/`

---

## Version History

- **v1.0.0** (2024-02-01)
  - Initial release
  - 4 submodules (Plans, Adjustments, Incentives, Bonds)
  - Multi-level approval workflows
  - Comprehensive audit logging
  - Philippine compliance
  - Full CRUD operations for all entities

---

## Next Steps

1. ✅ Database schema deployed
2. ✅ API endpoints created
3. ✅ Audit logging implemented
4. ⏳ Frontend UI components
5. ⏳ Postman collection updated
6. ⏳ Testing & QA
7. ⏳ Production deployment
8. ⏳ Staff training documentation

---

**Last Updated:** 2024-02-01
**Maintained By:** HR Systems Team
