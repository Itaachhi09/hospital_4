# ⚡ HR4 ANALYTICS DASHBOARD - QUICK START GUIDE
# Philippine Hospital HR System
# Fast-track deployment in 5 steps

---

## 🚀 5-MINUTE OVERVIEW

The HR4 Analytics Dashboard provides real-time insights into your hospital's HR operations with:
- Executive dashboard with 4 KPI cards
- 12 interactive data widgets
- 7 professional reports
- Real-time metrics from employee, payroll, attendance, and compliance data
- Mobile-responsive design
- Role-based access control

**Status:** ✅ Ready for production deployment

---

## 📋 PRE-DEPLOYMENT CHECKLIST (5 min)

Before you start, verify:

- [ ] MySQL database running
- [ ] Database backup created
- [ ] SSH/terminal access available
- [ ] PHP 7.4+ installed
- [ ] DBA access available
- [ ] Project files present at root directory

---

## 🔧 DEPLOYMENT STEPS (30 minutes total)

### STEP 1: Execute Database Schema (10 min)

**Command:**
```bash
# Connect to MySQL and run the analytics extension
mysql -u [username] -p[password] [database_name] < database/analytics_extension.sql

# Verify it worked
mysql -u [username] -p[password] [database_name] -e "SHOW TABLES LIKE '%metrics%';"
```

**Expected Output:**
```
Tables showing:
- employee_metrics
- payroll_metrics
- attendance_metrics
- leave_metrics
- compliance_tracking
- department_metrics
- salary_adjustments_tracking
- analytics_cache
```

✅ **If successful:** Proceed to Step 2

❌ **If failed:** Check error message and refer to Troubleshooting Guide

---

### STEP 2: Populate Initial Data (5 min)

**Command:**
```bash
# Refresh payroll data for current month
mysql -u [username] -p[password] [database_name] -e \
"CALL sp_refresh_payroll_metrics(DATE_FORMAT(CURDATE(), '%Y-%m'));"

# Refresh attendance data for current month
mysql -u [username] -p[password] [database_name] -e \
"CALL sp_refresh_attendance_metrics(YEAR(CURDATE()), MONTH(CURDATE()));"

# Refresh department metrics
mysql -u [username] -p[password] [database_name] -e \
"CALL sp_refresh_department_metrics(YEAR(CURDATE()), MONTH(CURDATE()));"
```

✅ **If successful:** Data is now populated

---

### STEP 3: Test API Endpoints (10 min)

**Test 1: Get JWT Token**
```bash
# Login to get authentication token
curl -X POST "http://localhost/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"password"}'
```

**Copy the token** from response for next tests

**Test 2: Dashboard Endpoint**
```bash
curl -X GET "http://localhost/api/v1/analytics/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "summary": {...},
    "operations": {...},
    "compliance": {...},
    "performance": {...}
  },
  "timestamp": "2026-02-02T10:30:00Z"
}
```

✅ **If 200 OK:** API is working

❌ **If 401:** Token invalid, get new one
❌ **If 403:** User role not authorized
❌ **If 500:** Check server error logs

**Test 3: KPI Metrics**
```bash
curl -X GET "http://localhost/api/v1/analytics/metrics/kpis" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### STEP 4: Access Dashboard (5 min)

**URL:**
```
http://localhost/public/analytics-dashboard.html
```

**What to see:**
1. Login prompt (enter your credentials)
2. Dashboard loads with:
   - 4 KPI cards at top
   - 6 widget cards below
   - 2 data tables at bottom

**Test Features:**
- [ ] Dashboard loads without errors
- [ ] All widgets show data
- [ ] Department filter works
- [ ] Month selector works
- [ ] Refresh button works
- [ ] Export menu appears

✅ **If all pass:** Dashboard is working!

---

### STEP 5: Setup Automated Refresh (Optional but Recommended - 10 min)

**For Linux/Unix servers:**

```bash
# Edit crontab
crontab -e

# Add these lines:
0 2 * * * mysql -u [user] -p[pass] hospital_4 -e "CALL sp_refresh_payroll_metrics(DATE_FORMAT(CURDATE(), '%Y-%m'))"
0 3 * * * mysql -u [user] -p[pass] hospital_4 -e "CALL sp_refresh_attendance_metrics(YEAR(CURDATE()), MONTH(CURDATE()))"
0 4 * * * mysql -u [user] -p[pass] hospital_4 -e "CALL sp_refresh_department_metrics(YEAR(CURDATE()), MONTH(CURDATE()))"

# Save and exit
```

**For Windows servers:**

Use Task Scheduler to create tasks that run:
```batch
mysql -u [user] -p[pass] hospital_4 -e "CALL sp_refresh_payroll_metrics(...);"
```

Daily at 2 AM, 3 AM, and 4 AM respectively.

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify:

- [x] Database tables created: 8 tables
- [x] Database views created: 6 views
- [x] Database procedures created: 3 procedures
- [x] Initial data populated
- [x] API endpoints responding (200 OK)
- [x] Dashboard loading without errors
- [x] Widgets showing data
- [x] Filters working
- [x] Export menu visible
- [x] Role-based access working

All checked? ✅ **System is ready to use!**

---

## 🎯 NEXT ACTIONS

### For Administrators
1. Create user accounts
2. Assign roles (admin, hr_manager, finance_manager, hospital_director)
3. Configure access permissions
4. Setup monitoring and alerts

### For Managers
1. Access the dashboard at `/public/analytics-dashboard.html`
2. Filter by department to see department-specific metrics
3. Export reports as needed
4. Review compliance metrics regularly

### For Support Team
1. Monitor error logs
2. Check dashboard performance
3. Verify daily data refreshes run
4. Handle user support requests

---

## 🚨 COMMON ISSUES & QUICK FIXES

### Issue: "Database connection failed"
**Fix:**
```bash
# Verify MySQL is running
sudo service mysql status

# Check credentials in api/config/database.php
cat api/config/database.php | grep "DB_"
```

---

### Issue: "Unauthorized" error on API
**Fix:**
```bash
# Verify user has correct role
mysql -u [user] -p[pass] hospital_4 -e \
"SELECT id, email, role FROM users WHERE email='your_email';"

# Update role if needed
mysql -u [user] -p[pass] hospital_4 -e \
"UPDATE users SET role='hr_manager' WHERE id=123;"
```

---

### Issue: Dashboard shows no data
**Fix:**
```bash
# Manually refresh data
mysql -u [user] -p[pass] hospital_4 -e \
"CALL sp_refresh_payroll_metrics(DATE_FORMAT(CURDATE(), '%Y-%m'));"

# Check if data was inserted
mysql -u [user] -p[pass] hospital_4 -e \
"SELECT COUNT(*) as total FROM payroll_metrics;"
```

---

### Issue: Slow dashboard load (> 2 seconds)
**Fix:**
```bash
# Check if indexes exist
mysql -u [user] -p[pass] hospital_4 -e \
"SHOW INDEXES FROM payroll_metrics;"

# Optimize tables
mysql -u [user] -p[pass] hospital_4 -e \
"OPTIMIZE TABLE payroll_metrics;"
```

---

## 📞 GET HELP

### Documentation
- **Full Guide:** `docs/ANALYTICS_DASHBOARD_IMPLEMENTATION.md`
- **Deployment:** `docs/ANALYTICS_DEPLOYMENT_GUIDE.md`
- **Troubleshooting:** `docs/ANALYTICS_DEPLOYMENT_GUIDE.md` (Section 8)
- **Index:** `docs/DOCUMENTATION_INDEX.md`

### Support Contact
- **Email:** support@hospital.com
- **Phone:** (555) 123-4567
- **Hours:** 24/7

### Escalation
- Database issues: DBA Team
- API issues: Backend Team
- Dashboard issues: Frontend Team
- Access issues: Security Team

---

## 📊 WHAT YOU GET

### Dashboard Widgets
1. **KPI Cards** - Top 4 key performance indicators
2. **Employee Summary** - Headcount and breakdown
3. **Payroll Summary** - Salary and cost analysis
4. **Attendance Metrics** - Attendance tracking
5. **Leave Utilization** - Leave balance and usage
6. **Department Distribution** - Headcount by department
7. **Compliance Status** - Regulatory compliance tracking
8. **Department Performance** - Full comparison table
9. **Compensation Analysis** - Salary by position
10. **Overtime Analysis** - Top overtime employees
11. **Attrition Trends** - 6-month trend analysis
12. **Executive KPIs** - Critical business metrics

### Reports Available
- Monthly HR Summary
- Payroll Summary
- Attendance & Overtime
- Leave Report
- Compliance Report
- Department Performance
- Employee Demographics

### Export Formats
- CSV (Spreadsheet)
- PDF (Professional)
- Excel (Advanced)

---

## 🎓 QUICK USER GUIDE

### Accessing the Dashboard
1. Go to: `http://localhost/public/analytics-dashboard.html`
2. Login with your credentials
3. Dashboard appears with current month data

### Using Filters
- **Department Filter:** Select department to view department-specific metrics
- **Month Selector:** Choose month to view historical data

### Refreshing Data
- Click **Refresh Button** to reload latest data from API
- Automatic refresh every 1 hour via cron job

### Exporting Reports
1. Click **Export Menu**
2. Choose format: CSV, PDF, or Excel
3. Report downloads automatically
4. Open in your preferred application

### Reading KPI Cards
- **Green Circle:** Metric meets target
- **Yellow Circle:** Metric approaching threshold
- **Red Circle:** Metric below target
- **Blue Circle:** Informational metric

---

## ✨ BEST PRACTICES

### Daily
- Check compliance metrics for any red flags
- Monitor attendance rates
- Review payroll summary

### Weekly
- Export reports for management review
- Check attrition trends
- Verify data accuracy

### Monthly
- Generate comprehensive HR summary
- Review department performance
- Plan next month actions based on metrics

### Quarterly
- Analyze year-to-date trends
- Review overall compliance
- Plan departmental improvements

---

## 🎉 YOU'RE READY!

The HR4 Analytics Dashboard is now deployed and ready to use!

**Next:** Log in to the dashboard and start exploring your HR metrics!

---

**Document:** QUICK_START_GUIDE.md  
**Version:** 1.0  
**Last Updated:** February 2, 2026  
**Status:** ✅ Ready for Production

**Happy Analytics! 📊**
