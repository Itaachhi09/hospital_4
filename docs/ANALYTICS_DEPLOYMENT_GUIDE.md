# ANALYTICS DASHBOARD - DEPLOYMENT & SETUP GUIDE
# HR4 Hospital HR Management System - Philippines
# Version: 2.0 | Date: February 2, 2026

## ✅ IMPLEMENTATION STATUS

### ✔️ COMPLETED COMPONENTS

1. **Database Extension** (`database/analytics_extension.sql`)
   - Status: READY TO DEPLOY
   - Contains: 8 tables, 6 views, 3 stored procedures
   - Action: Execute against hospital_4 database

2. **API Implementation** (`api/analytics/analytics-enhanced.php`)
   - Status: READY TO USE
   - Endpoints: 20+ analytics endpoints
   - Authentication: JWT token required
   - Authorization: Role-based access control (admin, hr_manager, finance_manager, hospital_director)

3. **Frontend Dashboard** (`public/analytics-dashboard.html`)
   - Status: FULLY FUNCTIONAL
   - Features: 12+ widgets, KPI cards, responsive design, export functionality
   - Design: Modern, professional, hospital-grade UI

4. **Route Configuration** (`api/router.php`)
   - Status: UPDATED with analytics routes
   - All endpoints mapped and ready

---

## 🚀 DEPLOYMENT CHECKLIST

### Phase 1: Database Setup (REQUIRED FIRST)

#### Step 1.1: Backup Existing Database
```bash
# Create backup before running analytics extension
mysqldump -u [username] -p [hospital_4_database] > backup_hospital_4_$(date +%Y%m%d).sql
```

#### Step 1.2: Execute Analytics Extension SQL
```bash
# Connect to database and run extension
mysql -u [username] -p [hospital_4_database] < database/analytics_extension.sql

# Verify tables were created
mysql -u [username] -p [hospital_4_database] -e "
    SHOW TABLES LIKE '%metrics%';
    SHOW TABLES LIKE '%tracking%';
    SHOW VIEWS;
"
```

**Expected Output:**
- Tables: employee_metrics, payroll_metrics, attendance_metrics, leave_metrics, compliance_tracking, department_metrics, salary_adjustments_tracking, analytics_cache
- Views: v_payroll_summary_current_month, v_attendance_summary_current_month, v_employee_turnover, v_leave_utilization_summary, v_compensation_analysis, v_compliance_summary

#### Step 1.3: Initialize Data (Optional but Recommended)
```sql
-- Run initial data population
CALL sp_refresh_payroll_metrics(DATE_FORMAT(CURDATE(), '%Y-%m'));
CALL sp_refresh_attendance_metrics(YEAR(CURDATE()), MONTH(CURDATE()));
CALL sp_refresh_department_metrics(YEAR(CURDATE()), MONTH(CURDATE()));
```

#### Step 1.4: Verify Views
```sql
-- Test views are working
SELECT * FROM v_payroll_summary_current_month LIMIT 1;
SELECT * FROM v_attendance_summary_current_month LIMIT 1;
SELECT * FROM v_employee_turnover LIMIT 1;
```

---

### Phase 2: API Configuration (IF NEEDED)

#### Step 2.1: Verify Analytics API File
- Location: `api/analytics/analytics-enhanced.php`
- Status: ✅ Already in place
- No action needed if file exists

#### Step 2.2: Verify Router Configuration
- Location: `api/router.php`
- Required routes:
  - `/v1/analytics/dashboard` ✅
  - `/v1/analytics/metrics/*` ✅
  - `/v1/analytics/reports/*` ✅
  - `/v1/analytics/departments/*` ✅

Check if routes are configured:
```bash
grep -n "analytics" api/router.php
```

If missing, add these route mappings to `router.php`:
```php
$this->routes['v1/analytics/dashboard'] = 'analytics/analytics-enhanced.php';
$this->routes['v1/analytics/metrics'] = 'analytics/analytics-enhanced.php';
$this->routes['v1/analytics/reports'] = 'analytics/analytics-enhanced.php';
$this->routes['v1/analytics/departments'] = 'analytics/analytics-enhanced.php';
```

---

### Phase 3: Frontend Deployment

#### Step 3.1: Verify Dashboard File
- Location: `public/analytics-dashboard.html`
- Status: ✅ Already deployed
- Access URL: `/hospital_4/public/analytics-dashboard.html`

#### Step 3.2: Test Dashboard Access
```bash
# Test with authentication token
curl -H "Authorization: Bearer {your_jwt_token}" \
     http://localhost/hospital_4/api/v1/analytics/dashboard
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "summary": {...},
    "operations": {...},
    "compliance": {...},
    "performance": {...}
  },
  "timestamp": "2026-02-02 10:30:00"
}
```

---

## 📊 API ENDPOINTS REFERENCE

### Base URL
```
http://localhost/hospital_4/api/v1/analytics
```

### Authentication
All requests require Bearer token in Authorization header:
```
Authorization: Bearer {jwt_token}
```

### Endpoints

#### 1. Executive Dashboard
```
GET /dashboard
GET /dashboard?department_id=1&month=2026-02
```
Returns: Complete dashboard with all widgets and KPIs

#### 2. Metrics
```
GET /metrics - All metrics
GET /metrics/kpis - Top KPIs only
GET /metrics/employees - Employee metrics
GET /metrics/payroll - Payroll metrics
GET /metrics/attendance - Attendance metrics
GET /metrics/compensation - Compensation breakdown
GET /metrics/compliance - Compliance status
```

#### 3. Reports
```
GET /reports - List available reports
GET /reports/monthly-hr-summary - Generate report
GET /reports/{type}/export?format=csv|pdf|excel - Export report
```

Available Report Types:
- `monthly-hr-summary` - Complete HR overview
- `payroll-summary` - Payroll analysis
- `attendance-overtime` - Attendance and overtime
- `leave-report` - Leave utilization
- `compliance-report` - Compliance status
- `department-performance` - Department metrics
- `employee-demographics` - Employee distribution

#### 4. Department Metrics
```
GET /departments/{id} - Department overview
GET /departments/{id}/employees - Department employees
GET /departments/{id}/payroll - Department payroll
GET /departments/{id}/attendance - Department attendance
```

---

## 🔐 ROLE-BASED ACCESS CONTROL

### Required Roles for Analytics Access
- `admin` - Full access to all analytics
- `hr_manager` - HR metrics only
- `finance_manager` - Payroll and financial metrics
- `hospital_director` - Executive dashboard and KPIs

### Role Verification
```php
// Verify user role in your authentication system
$allowedRoles = ['admin', 'hr_manager', 'finance_manager', 'hospital_director'];
if (!in_array($user['role'], $allowedRoles)) {
    return error('Access denied', 403);
}
```

---

## 🔧 CONFIGURATION

### Database Configuration
File: `api/config/database.php`

Verify connection parameters:
```php
$conn = new mysqli(
    DB_HOST,      // localhost
    DB_USER,      // your_db_user
    DB_PASSWORD,  // your_db_password
    DB_NAME       // hospital_4
);
```

### JWT Configuration
File: `api/config/constants.php`

Verify JWT settings:
```php
define('JWT_SECRET', 'your_secret_key');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 86400);  // 24 hours
```

---

## 📈 DATA REFRESH SCHEDULE

### Automatic Data Refresh (Optional but Recommended)

#### Setup Cron Jobs

**Linux/Unix:**
```bash
# Add to crontab (crontab -e)

# Refresh payroll metrics daily at 2 AM
0 2 * * * mysql -u [user] -p[pass] hospital_4 -e "CALL sp_refresh_payroll_metrics(DATE_FORMAT(CURDATE(), '%Y-%m'))"

# Refresh attendance metrics daily at 3 AM
0 3 * * * mysql -u [user] -p[pass] hospital_4 -e "CALL sp_refresh_attendance_metrics(YEAR(CURDATE()), MONTH(CURDATE()))"

# Refresh department metrics daily at 4 AM
0 4 * * * mysql -u [user] -p[pass] hospital_4 -e "CALL sp_refresh_department_metrics(YEAR(CURDATE()), MONTH(CURDATE()))"
```

**Windows (Task Scheduler):**
1. Create batch file: `refresh_analytics.bat`
```batch
@echo off
mysql -u [user] -p[pass] hospital_4 -e "CALL sp_refresh_payroll_metrics(DATE_FORMAT(CURDATE(), '%%Y-%%m'))"
mysql -u [user] -p[pass] hospital_4 -e "CALL sp_refresh_attendance_metrics(YEAR(CURDATE()), MONTH(CURDATE()))"
mysql -u [user] -p[pass] hospital_4 -e "CALL sp_refresh_department_metrics(YEAR(CURDATE()), MONTH(CURDATE()))"
```

2. Schedule in Task Scheduler to run daily

---

## 🧪 TESTING

### Unit Tests: API Endpoints

#### Test 1: Dashboard Endpoint
```bash
curl -X GET "http://localhost/hospital_4/api/v1/analytics/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Expected Status: 200 OK

#### Test 2: KPI Metrics
```bash
curl -X GET "http://localhost/hospital_4/api/v1/analytics/metrics/kpis" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test 3: Employee Summary
```bash
curl -X GET "http://localhost/hospital_4/api/v1/analytics/metrics/employees" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test 4: Report Generation
```bash
curl -X GET "http://localhost/hospital_4/api/v1/analytics/reports/monthly-hr-summary" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test 5: Department Metrics
```bash
curl -X GET "http://localhost/hospital_4/api/v1/analytics/departments/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Integration Tests: Frontend

1. **Login Test**
   - Navigate to: `/hospital_4/public/login.html`
   - Login with valid credentials
   - System should store JWT token in localStorage

2. **Dashboard Load Test**
   - Navigate to: `/hospital_4/public/analytics-dashboard.html`
   - Dashboard should load without errors
   - All widgets should populate with data

3. **Filter Test**
   - Change department filter
   - Change month selector
   - Dashboard should update with filtered data

4. **Export Test**
   - Click Export menu
   - Select format (CSV, Excel, PDF)
   - File should download successfully

---

## 🐛 TROUBLESHOOTING

### Issue 1: 401 Unauthorized Error
**Symptom:** API returns "Missing authorization token"

**Solution:**
1. Verify JWT token is in Authorization header
2. Check token hasn't expired (24 hours default)
3. Re-login to get fresh token
4. Verify token format: `Bearer {token}`

### Issue 2: 403 Forbidden Error
**Symptom:** API returns "Insufficient permissions"

**Solution:**
1. Verify user role is: admin, hr_manager, finance_manager, or hospital_director
2. Check role assignment in users table:
```sql
SELECT id, email, role FROM users WHERE email = 'user@hospital.com';
```
3. Update role if needed:
```sql
UPDATE users SET role = 'hr_manager' WHERE id = 123;
```

### Issue 3: Dashboard Shows No Data
**Symptom:** Dashboard loads but all widgets are empty

**Solution:**
1. Verify analytics_extension.sql was executed:
```sql
SHOW TABLES LIKE '%metrics%';  -- Should show 8 tables
```
2. Check data exists in tables:
```sql
SELECT COUNT(*) FROM payroll_metrics;
SELECT COUNT(*) FROM employee_metrics;
```
3. Run data refresh manually:
```sql
CALL sp_refresh_payroll_metrics(DATE_FORMAT(CURDATE(), '%Y-%m'));
```

### Issue 4: Slow Dashboard Load (> 2 seconds)
**Symptom:** Dashboard takes long time to load

**Solution:**
1. Verify indexes exist:
```sql
SHOW INDEXES FROM employee_metrics;
SHOW INDEXES FROM payroll_metrics;
```
2. Run query optimization:
```sql
ANALYZE TABLE employee_metrics;
ANALYZE TABLE payroll_metrics;
OPTIMIZE TABLE employee_metrics;
OPTIMIZE TABLE payroll_metrics;
```
3. Check active queries:
```sql
SHOW PROCESSLIST;
```
4. Enable caching in API:
```php
// Check cache is being used
SELECT COUNT(*) FROM analytics_cache WHERE expires_at > NOW();
```

### Issue 5: Database Connection Error
**Symptom:** "Database connection failed"

**Solution:**
1. Verify MySQL is running
2. Check connection parameters in `api/config/database.php`
3. Test connection manually:
```bash
mysql -u [user] -p[password] -h localhost hospital_4 -e "SELECT 1;"
```
4. Check user permissions:
```sql
SHOW GRANTS FOR '[user]'@'localhost';
```

---

## 📊 PERFORMANCE OPTIMIZATION

### Database Optimization

#### 1. Index Analysis
```sql
-- Analyze slow queries
EXPLAIN SELECT * FROM payroll_metrics WHERE payroll_month = '2026-02';

-- Verify index is being used (should show index_name)
SHOW INDEXES FROM payroll_metrics;
```

#### 2. Query Caching
```php
// Enable caching for 1 hour
$cacheKey = md5('dashboard_' . $departmentId);
$cached = $conn->query("
    SELECT cache_value FROM analytics_cache 
    WHERE cache_key = '$cacheKey' AND expires_at > NOW()
");

if ($cached && $cached->num_rows > 0) {
    return json_decode($cached->fetch_assoc()['cache_value']);
}

// Cache miss - execute query
$data = fetchDashboardData();

// Store in cache
$conn->query("
    INSERT INTO analytics_cache (cache_key, cache_value, expires_at)
    VALUES ('$cacheKey', '" . json_encode($data) . "', DATE_ADD(NOW(), INTERVAL 1 HOUR))
");
```

#### 3. Materialized Views
```sql
-- Pre-calculate heavy aggregations monthly
CREATE TABLE mv_monthly_summary AS
SELECT 
    YEAR(payroll_month) as year,
    MONTH(payroll_month) as month,
    SUM(gross_pay) as total_gross,
    COUNT(DISTINCT employee_id) as employee_count
FROM payroll_metrics
GROUP BY YEAR(payroll_month), MONTH(payroll_month);

-- Create index for fast lookups
CREATE INDEX idx_mv_year_month ON mv_monthly_summary(year, month);
```

### Frontend Optimization

#### 1. Lazy Loading
```javascript
// Load widgets only when visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            loadWidget(entry.target.id);
            observer.unobserve(entry.target);
        }
    });
});

document.querySelectorAll('.widget').forEach(widget => {
    observer.observe(widget);
});
```

#### 2. Request Batching
```javascript
// Batch multiple metric requests
const requests = [
    fetch('/api/v1/analytics/metrics/employees'),
    fetch('/api/v1/analytics/metrics/payroll'),
    fetch('/api/v1/analytics/metrics/attendance')
];

Promise.all(requests)
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(data => renderAllWidgets(data));
```

---

## 📚 HR MODULE INTEGRATION

### Module 1: Core HR
**Data Points:**
- Employee count and status
- Department assignment
- Hire dates

**Integration:**
```sql
SELECT COUNT(*) FROM employees WHERE status = 'active';
SELECT DATEDIFF(CURDATE(), hire_date) / 365 as tenure_years FROM employees;
```

### Module 2: Time & Attendance
**Data Points:**
- Daily attendance records
- Overtime hours
- Leave requests

**Integration:**
```php
// Get attendance from Module 2 API
$attendance = fetch('/api/v1/attendance/records?month=2026-02');
INSERT INTO attendance_metrics (...) VALUES (...);
```

### Module 3: Payroll
**Data Points:**
- Salary components
- Deductions (BIR, SSS, PhilHealth, Pag-IBIG)
- Payroll runs

**Integration:**
```php
// Get payroll from Module 3 API
$payroll = fetch('/api/v1/payroll/summary?month=2026-02');
INSERT INTO payroll_metrics (...) VALUES (...);
```

### Module 4: Compensation & Benefits
**Data Points:**
- Salary adjustments
- Incentives and bonuses
- Benefits enrollment

**Integration:**
```php
// Get compensation from Module 4 API
$compensation = fetch('/api/v1/compensation/adjustments');
INSERT INTO salary_adjustments_tracking (...) VALUES (...);
```

---

## 🎯 SUCCESS METRICS

After deployment, monitor these KPIs:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboard Load Time | < 2 seconds | Browser DevTools |
| API Response Time | < 500ms | API logs |
| Data Refresh Duration | < 5 minutes | Cron logs |
| User Adoption | > 80% | Login count |
| Report Generation | < 30 seconds | API logs |
| Cache Hit Rate | > 70% | Cache table |
| System Uptime | > 99.5% | Monitoring tool |

---

## 📞 SUPPORT & ESCALATION

### Common Issues Contacts
1. **Database Issues** → DBA Team
2. **API Errors** → Backend Team
3. **Dashboard Issues** → Frontend Team
4. **Authentication Issues** → Security Team

### Logs to Check
```bash
# MySQL error log
tail -f /var/log/mysql/error.log

# Apache error log
tail -f /var/log/apache2/error.log

# PHP error log (if configured)
tail -f /var/log/php_errors.log

# Application logs
tail -f /path/to/hospital_4/logs/error.log
```

---

## 📝 MAINTENANCE SCHEDULE

### Daily
- Monitor dashboard load times
- Check error logs
- Verify cron job execution

### Weekly
- Review analytics data accuracy
- Check cache hit rates
- Backup database

### Monthly
- Analyze performance metrics
- Review user adoption
- Plan optimizations
- Update documentation

### Quarterly
- Review analytics effectiveness
- Plan enhancements
- Security audit
- Performance tuning

---

## 🎓 USER TRAINING

### Admin/Manager Training (30 minutes)
1. Dashboard Navigation
2. Filter and Export
3. Report Generation
4. Accessing Department Metrics

### Executive Training (15 minutes)
1. Reading KPI Cards
2. Interpreting Compliance Status
3. Exporting Reports
4. Understanding Metrics

### Developer Training (1 hour)
1. API Endpoints
2. Authentication & Authorization
3. Query Structure
4. Adding Custom Metrics

---

**Last Updated:** February 2, 2026  
**Version:** 2.0  
**Status:** Ready for Production Deployment
