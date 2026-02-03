# Analytics Dashboard - Complete Implementation Guide
# HR4 Hospital HR Management System - Philippines
# Data-Driven Real-Time Analytics for HR Modules 1-4

## 📋 Table of Contents
1. Database Setup
2. API Endpoints
3. Frontend Dashboard
4. Integration Points
5. Data Flow
6. KPIs & Metrics
7. Reports & Exports
8. Deployment

---

## 🗄️ 1. Database Setup

### Step 1: Install Analytics Extension
Run the analytics extension SQL file to extend your existing database:

```bash
# Using MySQL CLI
mysql -u [username] -p [database] < database/analytics_extension.sql

# Or import via phpMyAdmin
```

### Tables Created:
1. **employee_metrics** - Employee-level metrics tracking
2. **payroll_metrics** - Payroll and compensation data
3. **attendance_metrics** - Daily attendance records
4. **leave_metrics** - Leave utilization tracking
5. **compliance_tracking** - Regulatory compliance status
6. **department_metrics** - Department aggregated metrics
7. **salary_adjustments_tracking** - Salary change history
8. **analytics_cache** - Performance cache layer

### Views Created:
- `v_payroll_summary_current_month` - Current month payroll overview
- `v_attendance_summary_current_month` - Current month attendance
- `v_employee_turnover` - Turnover & attrition metrics
- `v_leave_utilization_summary` - Leave utilization by department
- `v_compensation_analysis` - Salary analysis
- `v_compliance_summary` - Compliance status overview

### Stored Procedures:
- `sp_refresh_payroll_metrics()` - Refresh payroll data
- `sp_refresh_attendance_metrics()` - Refresh attendance data
- `sp_refresh_department_metrics()` - Refresh department metrics

### Step 2: Schedule Data Refresh
Create cron jobs to regularly refresh analytics data:

```bash
# Refresh payroll metrics daily
0 2 * * * mysql -u [user] -p[pass] [db] -e "CALL sp_refresh_payroll_metrics(DATE_FORMAT(CURDATE(), '%Y-%m'))"

# Refresh attendance metrics daily
0 3 * * * mysql -u [user] -p[pass] [db] -e "CALL sp_refresh_attendance_metrics(YEAR(CURDATE()), MONTH(CURDATE()))"

# Refresh department metrics daily
0 4 * * * mysql -u [user] -p[pass] [db] -e "CALL sp_refresh_department_metrics(YEAR(CURDATE()), MONTH(CURDATE()))"
```

---

## 🔌 2. API Endpoints

### Base URL
```
/api/v1/analytics/
```

### Dashboard Endpoint
```
GET /dashboard
```
Returns complete dashboard data with all widgets and KPIs.

**Response:**
```json
{
  "success": true,
  "data": {
    "widgets": {
      "total_employees": {...},
      "payroll_summary": {...},
      "hiring_attrition": {...},
      "department_headcount": [...],
      "attendance": {...},
      "leave_utilization": {...},
      "compensation_breakdown": {...},
      "compliance_status": [...],
      "department_performance": [...],
      "overtime": {...},
      "attrition_trend": [...]
    },
    "kpis": [...]
  }
}
```

### Metrics Endpoints

#### All Metrics
```
GET /metrics
```

#### KPIs Only
```
GET /metrics/kpis
```

#### Employee Metrics
```
GET /metrics/employees?department_id={id}
```

#### Payroll Metrics
```
GET /metrics/payroll?month=2026-02
```

#### Attendance Metrics
```
GET /metrics/attendance
```

#### Compensation Analysis
```
GET /metrics/compensation
```

#### Compliance Metrics
```
GET /metrics/compliance
```

### Reports Endpoints

#### List Available Reports
```
GET /reports/list
```

#### Generate Report
```
GET /reports/{reportId}
?date_from=2026-02-01
&date_to=2026-02-28
&department_id={id}
```

**Available Report Types:**
- `monthly-hr-summary` - Complete HR monthly overview
- `payroll-summary` - Payroll breakdown
- `attendance-overtime` - Attendance analysis
- `leave-report` - Leave utilization
- `compliance-report` - Regulatory compliance
- `department-performance` - Department metrics
- `employee-demographics` - Employee distribution

#### Export Report
```
GET /reports/{reportId}/export
?format=pdf|excel|csv
&date_from=2026-02-01
&date_to=2026-02-28
```

### Department Endpoints

#### Department Metrics
```
GET /departments/{departmentId}
```

#### Department Employees
```
GET /departments/{departmentId}/employees
```

#### Department Payroll
```
GET /departments/{departmentId}/payroll
```

#### Department Attendance
```
GET /departments/{departmentId}/attendance
```

---

## 🎨 3. Frontend Dashboard

### Access URL
```
/public/analytics-dashboard.html
```

### Features
1. **Top KPI Cards** - Quick overview of critical metrics
2. **Employee Summary** - Active/inactive/on-leave breakdown
3. **Payroll Summary** - Cost and salary analysis
4. **Attendance Tracking** - Daily attendance metrics
5. **Leave Utilization** - Leave usage tracking
6. **Department Distribution** - Headcount by department
7. **Compliance Status** - BIR, SSS, PhilHealth, Pag-IBIG status
8. **Department Performance** - Full department comparison table
9. **Compensation Analysis** - Salary by position
10. **Export Options** - PDF, Excel, CSV export

### Widgets & Visualizations
- **KPI Cards** with status indicators (Green/Yellow/Red)
- **Summary Widgets** with key statistics
- **Department Cards** showing headcount
- **Performance Tables** with detailed metrics
- **Responsive Design** - Works on desktop and tablet

### User Interactions
- Month/Department filters
- Real-time refresh
- Export functionality
- Drill-down capabilities

---

## 🔗 4. Integration Points

### HR Module 1 (Core HR)
**Endpoints:**
- `/api/v1/hrcore/employees` - Get employee data
- `/api/v1/hrcore/departments` - Get departments

**Data Used:**
- Employee count & status
- Department assignment
- Employee names, emails, positions
- Hire dates for tenure calculations

### HR Module 2 (Time & Attendance)
**Data Used:**
- Attendance records
- Overtime hours
- Leave requests
- Shift schedules

**Integration:**
```php
// Query attendance_metrics table
SELECT * FROM attendance_metrics 
WHERE employee_id = ? 
AND YEAR(attendance_date) = YEAR(CURDATE())
```

### HR Module 3 (Payroll)
**Data Used:**
- Salary information
- Deductions (BIR, SSS, PhilHealth, Pag-IBIG)
- Net pay
- Payroll runs

**Integration:**
```php
// Query payroll_metrics table
SELECT * FROM payroll_metrics 
WHERE payroll_month = DATE_FORMAT(CURDATE(), '%Y-%m')
```

### HR Module 4 (Compensation & Benefits)
**Data Used:**
- Salary adjustments
- Incentives & bonuses
- HMO enrollment
- Pay bonds

**Integration:**
```php
// Query salary_adjustments_tracking
SELECT * FROM salary_adjustments_tracking
WHERE employee_id = ?
ORDER BY effective_date DESC
```

---

## 📊 5. Data Flow Architecture

```
┌─────────────────────────────────────────────┐
│         HR Modules 1-4 (Data Sources)       │
├─────────────────────────────────────────────┤
│  • Employee data (Module 1)                 │
│  • Attendance/Overtime (Module 2)           │
│  • Payroll/Deductions (Module 3)            │
│  • Compensation/Benefits (Module 4)         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│     Data Aggregation Layer (SQL Views)      │
├─────────────────────────────────────────────┤
│  • v_payroll_summary_*                      │
│  • v_attendance_summary_*                   │
│  • v_employee_turnover                      │
│  • v_leave_utilization_summary              │
│  • v_compensation_analysis                  │
│  • v_compliance_summary                     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│      Analytics Cache Layer (Performance)    │
├─────────────────────────────────────────────┤
│  • analytics_cache table                    │
│  • 1-hour TTL for cached queries            │
│  • Automatic invalidation on data change    │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Analytics API Layer (analytics-enhanced.php)│
├─────────────────────────────────────────────┤
│  • /dashboard - All widgets                 │
│  • /metrics/* - Specific metrics            │
│  • /reports/* - Report generation          │
│  • /departments/* - Department data        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│    Frontend Layer (analytics-dashboard.html) │
├─────────────────────────────────────────────┤
│  • KPI Cards (Visual indicators)            │
│  • Widgets (Summary stats)                  │
│  • Tables (Detailed data)                   │
│  • Charts (Trends)                          │
│  • Export (PDF/Excel/CSV)                   │
└─────────────────────────────────────────────┘
```

---

## 📈 6. KPIs & Metrics

### Employee KPIs
1. **Employee Turnover Rate**
   - Calculation: (Separations / Average Headcount) × 100
   - Target: < 15% annually
   - Status: Green < 15%, Yellow 15-25%, Red > 25%

2. **Attrition Rate by Department**
   - Monthly attrition tracking
   - Identifies high-risk departments

3. **New Hire Rate**
   - Monthly new hires count
   - YTD tracking

### Attendance KPIs
1. **Attendance Rate**
   - Calculation: (Present Days / Working Days) × 100
   - Target: 95%+
   - Status: Green 95%+, Yellow 90-95%, Red < 90%

2. **Overtime Ratio**
   - Calculation: (Overtime Hours / Standard Hours) × 100
   - Identifies workload issues

3. **Leave Utilization**
   - Calculation: (Days Used / Days Entitled) × 100
   - Monitors leave patterns

### Payroll KPIs
1. **Total Payroll Cost**
   - Salary + allowances + benefits + employer contributions
   - Monthly and YTD tracking

2. **Average Salary**
   - By position, department, employment type
   - Used for benchmarking

3. **Payroll Variance**
   - Compare budget vs. actual
   - Month-to-month variance

### Compliance KPIs
1. **BIR Compliance %**
   - % of employees with proper tax withholding
   - Target: 100%

2. **SSS Compliance %**
   - % of employees with SSS contributions
   - Target: 100%

3. **PhilHealth Compliance %**
   - % of employees covered
   - Target: 100%

4. **Pag-IBIG Compliance %**
   - % of employees with contributions
   - Target: 100%

---

## 📑 7. Reports & Exports

### Standard Reports

#### 1. Monthly HR Summary Report
**Includes:**
- Employee headcount trends
- New hires vs. separations
- Payroll overview
- Attendance metrics
- Key KPIs

#### 2. Payroll & Compensation Report
**Includes:**
- Total payroll cost
- Breakdown by department
- Salary distribution
- Allowances summary
- Compliance contributions (BIR, SSS, PhilHealth, Pag-IBIG)

#### 3. Attendance & Overtime Report
**Includes:**
- Department attendance rates
- Overtime analysis
- Top overtime employees
- Absenteeism patterns

#### 4. Leave & Absence Report
**Includes:**
- Leave utilization by type
- Leave balance
- Absence patterns
- Department leave analysis

#### 5. Compliance Status Report
**Includes:**
- Compliance status by type (BIR, SSS, PhilHealth, Pag-IBIG)
- Non-compliant employees
- Compliance timeline

#### 6. Department Performance Report
**Includes:**
- Department headcount
- Attendance percentage
- Attrition rate
- Average salary
- Payroll cost
- Performance score

#### 7. Employee Demographics Report
**Includes:**
- Employee distribution
- Tenure analysis
- Salary ranges
- Employment type distribution
- Position distribution

### Export Formats
- **PDF** - Professional format with branding
- **Excel** - Detailed data with formulas
- **CSV** - Universal spreadsheet format

---

## 🚀 8. Deployment

### Prerequisites
- PHP 7.4+
- MySQL 5.7+
- Apache with mod_rewrite

### Installation Steps

#### Step 1: Copy Files
```bash
# Copy analytics extension SQL
cp database/analytics_extension.sql /path/to/deployment/

# Copy API file
cp api/analytics/analytics-enhanced.php /path/to/deployment/api/analytics/

# Copy Dashboard
cp public/analytics-dashboard.html /path/to/deployment/public/
```

#### Step 2: Initialize Database
```bash
# Import analytics extension
mysql -u [user] -p [database] < database/analytics_extension.sql

# Verify tables and views
mysql -u [user] -p [database] -e "SHOW TABLES LIKE '%_metrics%'; SHOW VIEWS;"
```

#### Step 3: Configure Routes
```php
// In /api/router.php or /api/index.php
$this->routes['v1/analytics/dashboard'] = 'analytics/analytics-enhanced.php';
$this->routes['v1/analytics/metrics'] = 'analytics/analytics-enhanced.php';
// ... add all routes from section 2
```

#### Step 4: Set Permissions
```bash
# Ensure write permissions for logs
chmod 755 /path/to/api/analytics/

# Ensure database has write permissions
chmod 755 /path/to/database/
```

#### Step 5: Verify Installation
```bash
# Test API endpoint
curl -H "Authorization: Bearer [token]" \
     http://localhost/api/v1/analytics/dashboard

# Test dashboard access
curl http://localhost/public/analytics-dashboard.html
```

### Performance Optimization

#### 1. Enable Query Caching
```php
// In analytics-enhanced.php
function getCachedMetrics($cacheKey, $callback, $ttl = 3600) {
    // Check cache
    $cached = $conn->query("SELECT cache_value FROM analytics_cache WHERE cache_key = '$cacheKey' AND expires_at > NOW()");
    
    if ($cached && $cached->num_rows > 0) {
        return json_decode($cached->fetch_assoc()['cache_value'], true);
    }
    
    // Generate fresh data
    $data = $callback();
    
    // Cache it
    $cacheValue = json_encode($data);
    $expiresAt = date('Y-m-d H:i:s', time() + $ttl);
    $conn->query("INSERT INTO analytics_cache (cache_key, cache_value, expires_at) VALUES ('$cacheKey', '$cacheValue', '$expiresAt')");
    
    return $data;
}
```

#### 2. Index Strategy
```sql
-- Critical indexes for analytics queries
CREATE INDEX idx_em_employee_department ON employee_metrics(employee_id, department_id, metric_date);
CREATE INDEX idx_pm_month_employee ON payroll_metrics(payroll_month, employee_id);
CREATE INDEX idx_am_date_employee ON attendance_metrics(attendance_date, employee_id, status);
CREATE INDEX idx_dm_month_dept ON department_metrics(metric_month, department_id);
```

#### 3. Materialized Views
```sql
-- Pre-calculate heavy aggregations
CREATE TABLE mv_payroll_summary_annual AS
SELECT YEAR(payroll_month) as year, SUM(total_cost) as annual_cost
FROM payroll_metrics
GROUP BY YEAR(payroll_month);
```

---

## 🔐 Security Considerations

### Authentication
All endpoints require Bearer token authentication:
```header
Authorization: Bearer {jwt_token}
```

### Authorization
- Only admin, hr_manager, finance_manager, hospital_director can view analytics
- Department managers see only their department data
- Employees see only their own data

### Data Privacy
- No personal identifiable information (PII) in exports
- Employee IDs only in detailed reports
- Audit trail of report generation

### SQL Injection Prevention
```php
// Use prepared statements
$stmt = $conn->prepare("SELECT * FROM employees WHERE id = ?");
$stmt->bind_param("s", $employeeId);
```

---

## 📞 Support & Troubleshooting

### Common Issues

#### 1. Dashboard Loads but Shows No Data
**Solution:**
- Verify analytics tables are populated
- Run data refresh procedures manually
- Check user has correct role/permissions

#### 2. 401 Unauthorized Error
**Solution:**
- Ensure authToken is in localStorage
- Verify token is still valid
- Re-login to get fresh token

#### 3. 403 Forbidden Error
**Solution:**
- Verify user role is: admin, hr_manager, finance_manager, or hospital_director
- Check role assignment in users table

#### 4. Slow Dashboard Load
**Solution:**
- Enable analytics cache layer
- Run data refresh procedures
- Check database indexes
- Monitor active queries with: `SHOW PROCESSLIST;`

---

## 📝 Future Enhancements

1. **Real-time Notifications**
   - Alert on compliance issues
   - Attrition rate threshold alerts

2. **Advanced Analytics**
   - Predictive attrition modeling
   - Salary trend forecasting
   - Seasonal pattern analysis

3. **Mobile Dashboard**
   - Responsive mobile-first design
   - Push notifications
   - Offline capabilities

4. **Custom Reports**
   - Report builder UI
   - Scheduled email delivery
   - Custom metrics definition

5. **Data Visualization**
   - Interactive charts (Chart.js, D3.js)
   - Heatmaps
   - Network diagrams

6. **Audit Trail**
   - Log all report views and exports
   - Track data changes
   - Compliance documentation

---

## 🎯 Success Metrics

After implementation, track:
- Dashboard load time: < 2 seconds
- API response time: < 500ms
- Data refresh completion: < 5 minutes
- User adoption: > 80% of managers viewing analytics monthly
- Report generation: < 30 seconds for monthly reports
- Cache hit rate: > 70%

---

**Document Version:** 1.0  
**Last Updated:** February 2, 2026  
**Author:** Senior HR Analytics Architect
