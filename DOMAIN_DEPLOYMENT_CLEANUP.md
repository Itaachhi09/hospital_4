# Domain Deployment - Path Simplified

## Changes Made
Removed all `/hospital_4/` path references from API endpoints. Now all endpoints use `/api` directly since you're deployed on the domain.

## Files Updated (16 total)

### Core Files:
- ✅ `main.js` - Changed `apiBaseUrl` from dynamic detection to hardcoded `/api`
- ✅ `auth.js` - Changed `API_BASE_URL` from dynamic to `/api`

### API Base References:
- ✅ `hrcore-employees.js` - Now uses `/api/` and `/api`
- ✅ `hrcore-documents.js` - Now uses `/api/` and `/api`
- ✅ `salaries.js` - Now uses `/api`
- ✅ `payslips.js` - Now uses `/api`
- ✅ `payroll.js` - Now uses `/api`
- ✅ `payroll-modals.js` - Now uses `/api`
- ✅ `hrcore.js` - Now uses `/api`
- ✅ `hmo.js` - Now uses `/api`
- ✅ `analytics.js` - Now uses `/api`
- ✅ `compensation-module.js` - Now uses `/api/compensation`
- ✅ `enrollments.js` - Now uses `/api/Employees/`
- ✅ `employee-hmo.js` - Now uses `/api/Employees/`
- ✅ `claims.js` - Now uses `/api/Employees/`

## What Still Works

✅ `.php` extension auto-appending (via fetch interceptor)
✅ All API calls route correctly to `/api/endpoint.php`
✅ Domain deployment without any `/hospital_4/` references

## Example Paths

Before:
```
- /hospital_4/api/auth/login.php
- /hospital_4/api/HRCORE/employees.php
```

After:
```
- /api/auth/login.php
- /api/HRCORE/employees.php
```

## Status
✅ Ready for domain deployment - clean API paths without local development references
