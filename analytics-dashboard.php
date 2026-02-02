<?php
/**
 * HR4 Hospital HR Management System
 * Analytics Dashboard Page
 */

require_once 'config.php';
require_once 'SessionManager.php';

// Initialize session and check authentication
SessionManager::init();
SessionManager::requireLogin();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard - HR4 Hospital</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #2563eb;
            --primary-dark: #1e40af;
            --secondary: #7c3aed;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --light-gray: #f3f4f6;
            --border-gray: #e5e7eb;
            --text-dark: #1f2937;
            --text-light: #6b7280;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--light-gray);
            color: var(--text-dark);
            line-height: 1.6;
        }

        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }

        /* Header */
        .analytics-header {
            background: white;
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .analytics-header h1 {
            font-size: 28px;
            color: var(--text-dark);
        }

        .header-controls {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .header-controls select, .header-controls input {
            padding: 8px 12px;
            border: 1px solid var(--border-gray);
            border-radius: 6px;
            font-size: 14px;
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .btn-primary:hover {
            background: var(--primary-dark);
        }

        .btn-secondary {
            background: var(--border-gray);
            color: var(--text-dark);
        }

        /* KPI Cards */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }

        .kpi-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-left: 4px solid var(--primary);
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .kpi-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .kpi-card.status-green {
            border-left-color: var(--success);
        }

        .kpi-card.status-yellow {
            border-left-color: var(--warning);
        }

        .kpi-card.status-red {
            border-left-color: var(--danger);
        }

        .kpi-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-light);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .kpi-value {
            font-size: 32px;
            font-weight: bold;
            color: var(--text-dark);
            margin-bottom: 8px;
        }

        .kpi-unit {
            font-size: 16px;
            color: var(--text-light);
            margin-left: 4px;
        }

        .kpi-benchmark {
            font-size: 12px;
            color: var(--text-light);
            margin-top: 8px;
        }

        .kpi-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            margin-top: 8px;
        }

        .kpi-status.green {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .kpi-status.yellow {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
        }

        .kpi-status.red {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
        }

        /* Widget Grid */
        .widget-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }

        .widget {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .widget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border-gray);
        }

        .widget-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-dark);
        }

        .widget-menu {
            display: flex;
            gap: 8px;
        }

        .widget-menu button {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-light);
            padding: 4px 8px;
            font-size: 14px;
        }

        .widget-menu button:hover {
            color: var(--primary);
        }

        /* Charts */
        .chart-container {
            position: relative;
            height: 300px;
            margin-bottom: 16px;
        }

        /* Summary Statistics */
        .summary-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--border-gray);
        }

        .summary-stat:last-child {
            border-bottom: none;
        }

        .summary-stat-label {
            color: var(--text-light);
            font-size: 14px;
        }

        .summary-stat-value {
            font-weight: 600;
            font-size: 16px;
            color: var(--text-dark);
        }

        .summary-stat-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .badge-warning {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
        }

        .badge-danger {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
        }

        /* Tables */
        .table-container {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        table th {
            background: var(--light-gray);
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: var(--text-dark);
            border-bottom: 2px solid var(--border-gray);
        }

        table td {
            padding: 12px;
            border-bottom: 1px solid var(--border-gray);
        }

        table tr:hover {
            background: var(--light-gray);
        }

        /* Department Cards */
        .department-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }

        .department-card {
            background: var(--light-gray);
            padding: 16px;
            border-radius: 6px;
            text-align: center;
        }

        .department-name {
            font-weight: 600;
            color: var(--text-dark);
            margin-bottom: 8px;
        }

        .department-stat {
            font-size: 24px;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 4px;
        }

        .department-label {
            font-size: 12px;
            color: var(--text-light);
        }

        /* Loading State */
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 200px;
        }

        .spinner {
            border: 3px solid var(--border-gray);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .widget-grid {
                grid-template-columns: 1fr;
            }

            .kpi-grid {
                grid-template-columns: 1fr;
            }

            .analytics-header {
                flex-direction: column;
                gap: 16px;
                align-items: flex-start;
            }

            .header-controls {
                flex-wrap: wrap;
            }
        }

        /* Export Menu */
        .export-menu {
            position: relative;
        }

        .export-dropdown {
            position: absolute;
            right: 0;
            top: 100%;
            background: white;
            border: 1px solid var(--border-gray);
            border-radius: 6px;
            min-width: 150px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: none;
        }

        .export-dropdown.active {
            display: block;
        }

        .export-option {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-gray);
            cursor: pointer;
            transition: background 0.2s;
        }

        .export-option:last-child {
            border-bottom: none;
        }

        .export-option:hover {
            background: var(--light-gray);
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="analytics-header">
            <div>
                <h1><i class="fas fa-chart-bar"></i> Analytics Dashboard</h1>
                <p style="color: var(--text-light); font-size: 14px; margin-top: 4px;">HR4 Hospital - Real-time Metrics & KPIs</p>
            </div>
            <div class="header-controls">
                <select id="departmentFilter" onchange="applyFilters()">
                    <option value="">All Departments</option>
                </select>
                <input type="month" id="monthFilter" onchange="applyFilters()">
                <button class="btn btn-primary" onclick="refreshDashboard()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
                <div class="export-menu">
                    <button class="btn btn-secondary" onclick="toggleExportMenu()">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <div class="export-dropdown" id="exportMenu">
                        <div class="export-option" onclick="exportReport('pdf')">
                            <i class="fas fa-file-pdf"></i> Export as PDF
                        </div>
                        <div class="export-option" onclick="exportReport('excel')">
                            <i class="fas fa-file-excel"></i> Export as Excel
                        </div>
                        <div class="export-option" onclick="exportReport('csv')">
                            <i class="fas fa-file-csv"></i> Export as CSV
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Top KPIs -->
        <div class="kpi-grid" id="kpiContainer">
            <div class="loading"><div class="spinner"></div></div>
        </div>

        <!-- Main Widgets -->
        <div class="widget-grid">
            <!-- Employee Summary Widget -->
            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title"><i class="fas fa-users"></i> Employee Summary</h3>
                </div>
                <div id="employeeSummary">
                    <div class="summary-stat">
                        <span class="summary-stat-label">Total Employees</span>
                        <span class="summary-stat-value" id="totalEmployees">-</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Active</span>
                        <span class="summary-stat-value" id="activeEmployees">-</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Inactive</span>
                        <span class="summary-stat-value" id="inactiveEmployees">-</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">On Leave</span>
                        <span class="summary-stat-value" id="onLeaveEmployees">-</span>
                    </div>
                </div>
            </div>

            <!-- Payroll Summary Widget -->
            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title"><i class="fas fa-money-bill-wave"></i> Payroll Summary</h3>
                </div>
                <div id="payrollSummary">
                    <div class="summary-stat">
                        <span class="summary-stat-label">Total Payroll Cost</span>
                        <span class="summary-stat-value" id="totalPayrollCost">₱0</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Average Salary</span>
                        <span class="summary-stat-value" id="averageSalary">₱0</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Total Allowances</span>
                        <span class="summary-stat-value" id="totalAllowances">₱0</span>
                    </div>
                </div>
            </div>

            <!-- Attendance Widget -->
            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title"><i class="fas fa-calendar-check"></i> Attendance This Month</h3>
                </div>
                <div id="attendanceSummary">
                    <div class="summary-stat">
                        <span class="summary-stat-label">Attendance Rate</span>
                        <span class="summary-stat-value"><span id="attendanceRate">0</span>%</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Present Days</span>
                        <span class="summary-stat-value" id="presentDays">0</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Absent Days</span>
                        <span class="summary-stat-value" id="absentDays">0</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Overtime Hours</span>
                        <span class="summary-stat-value" id="overtimeHours">0</span>
                    </div>
                </div>
            </div>

            <!-- Leave Utilization Widget -->
            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title"><i class="fas fa-umbrella-beach"></i> Leave Utilization</h3>
                </div>
                <div id="leaveSummary">
                    <div class="summary-stat">
                        <span class="summary-stat-label">Utilization Rate</span>
                        <span class="summary-stat-value"><span id="leaveUtilizationRate">0</span>%</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Total Entitled</span>
                        <span class="summary-stat-value" id="leaveTotalEntitled">0 days</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Total Used</span>
                        <span class="summary-stat-value" id="leaveTotalUsed">0 days</span>
                    </div>
                </div>
            </div>

            <!-- Department Headcount Widget -->
            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title"><i class="fas fa-sitemap"></i> Department Distribution</h3>
                </div>
                <div class="department-grid" id="departmentHeadcount">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </div>

            <!-- Compliance Status Widget -->
            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title"><i class="fas fa-check-circle"></i> Compliance Status</h3>
                </div>
                <div id="complianceStatus">
                    <div class="summary-stat">
                        <span class="summary-stat-label">BIR</span>
                        <span class="summary-stat-badge badge-success">Compliant</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">SSS</span>
                        <span class="summary-stat-badge badge-success">Compliant</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">PhilHealth</span>
                        <span class="summary-stat-badge badge-success">Compliant</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Pag-IBIG</span>
                        <span class="summary-stat-badge badge-success">Compliant</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Full-width Widgets -->
        <div style="display: grid; gap: 20px;">
            <!-- Department Performance -->
            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title"><i class="fas fa-chart-line"></i> Department Performance</h3>
                </div>
                <div class="table-container">
                    <table id="departmentPerformanceTable">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Total Employees</th>
                                <th>Active</th>
                                <th>Attendance %</th>
                                <th>Attrition Rate %</th>
                                <th>Avg Salary</th>
                            </tr>
                        </thead>
                        <tbody id="departmentPerformanceBody">
                            <tr><td colspan="6" style="text-align: center;">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Compensation Breakdown -->
            <div class="widget">
                <div class="widget-header">
                    <h3 class="widget-title"><i class="fas fa-coins"></i> Compensation by Position</h3>
                </div>
                <div class="table-container">
                    <table id="compensationTable">
                        <thead>
                            <tr>
                                <th>Position</th>
                                <th>Count</th>
                                <th>Min Salary</th>
                                <th>Max Salary</th>
                                <th>Average</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody id="compensationBody">
                            <tr><td colspan="6" style="text-align: center;">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE_URL = '/api';
        let dashboardData = null;

        // Initialize dashboard
        async function initializeDashboard() {
            await loadDashboardData();
            await loadDepartmentFilter();
        }

        // Load dashboard data
        async function loadDashboardData() {
            try {
                const response = await fetch(`${API_BASE_URL}/v1/analytics/dashboard`, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

                const data = await response.json();
                if (data.success) {
                    dashboardData = data.data;
                    renderDashboard();
                } else {
                    console.error('API error:', data.error);
                    alert('Error: ' + (data.error?.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error loading dashboard:', error);
                alert('Error loading dashboard data: ' + error.message);
            }
        }

        // Render dashboard
        function renderDashboard() {
            if (!dashboardData) return;

            // Render KPIs
            const kpiContainer = document.getElementById('kpiContainer');
            kpiContainer.innerHTML = dashboardData.kpis.map(kpi => `
                <div class="kpi-card status-${kpi.status}">
                    <div class="kpi-label">${kpi.label || kpi.name}</div>
                    <div class="kpi-value">
                        ${formatNumber(kpi.value)}<span class="kpi-unit">${kpi.unit}</span>
                    </div>
                    <div class="kpi-benchmark">${kpi.target || kpi.benchmark || 'N/A'}</div>
                    <span class="kpi-status ${kpi.status}">${kpi.status.toUpperCase()}</span>
                </div>
            `).join('');

            // Render employee summary
            const emp = dashboardData.widgets.total_employees;
            if (emp) {
                document.getElementById('totalEmployees').textContent = formatNumber(emp.total_employees);
                document.getElementById('activeEmployees').textContent = formatNumber(emp.active_employees || emp.active_employees);
                document.getElementById('inactiveEmployees').textContent = formatNumber(emp.inactive_employees || 0);
                document.getElementById('onLeaveEmployees').textContent = formatNumber(emp.on_leave_employees || 0);
            }

            // Render payroll summary
            const payroll = dashboardData.widgets.payroll_summary;
            if (payroll) {
                document.getElementById('totalPayrollCost').textContent = formatCurrency(payroll.total_payroll_cost);
                document.getElementById('averageSalary').textContent = formatCurrency(payroll.average_net_salary);
                document.getElementById('totalAllowances').textContent = formatCurrency(payroll.total_allowances);
            }

            // Render attendance
            const attendance = dashboardData.widgets.attendance;
            if (attendance) {
                document.getElementById('attendanceRate').textContent = Math.round(attendance.attendance_percentage || 0);
                document.getElementById('presentDays').textContent = formatNumber(attendance.present_days);
                document.getElementById('absentDays').textContent = formatNumber(attendance.absent_days);
                document.getElementById('overtimeHours').textContent = formatNumber(attendance.total_overtime_hours);
            }

            // Render leave utilization
            const leave = dashboardData.widgets.leave_utilization;
            if (leave) {
                document.getElementById('leaveUtilizationRate').textContent = Math.round(leave.utilization_percentage || 0);
                document.getElementById('leaveTotalEntitled').textContent = Math.round(leave.total_entitled) + ' days';
                document.getElementById('leaveTotalUsed').textContent = Math.round(leave.total_used) + ' days';
            }

            // Render department headcount
            const departmentHeadcount = document.getElementById('departmentHeadcount');
            if (dashboardData.widgets.department_headcount) {
                departmentHeadcount.innerHTML = dashboardData.widgets.department_headcount.slice(0, 6).map(dept => `
                    <div class="department-card">
                        <div class="department-name">${dept.department_name}</div>
                        <div class="department-stat">${dept.total_employees}</div>
                        <div class="department-label">${dept.active_employees} Active</div>
                    </div>
                `).join('');
            }

            // Render department performance table
            renderDepartmentPerformance();

            // Render compensation breakdown
            renderCompensationBreakdown();
        }

        function renderDepartmentPerformance() {
            const tbody = document.getElementById('departmentPerformanceBody');
            if (!dashboardData.widgets.department_performance) {
                tbody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
                return;
            }

            tbody.innerHTML = dashboardData.widgets.department_performance.map(dept => `
                <tr>
                    <td>${dept.department_name}</td>
                    <td>${formatNumber(dept.total_employees)}</td>
                    <td>${formatNumber(dept.active_employees)}</td>
                    <td>${dept.attendance_percentage}%</td>
                    <td>${dept.attrition_rate}%</td>
                    <td>${formatCurrency(dept.average_salary)}</td>
                </tr>
            `).join('');
        }

        function renderCompensationBreakdown() {
            const tbody = document.getElementById('compensationBody');
            
            if (!dashboardData.widgets.compensation_breakdown) {
                tbody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
                return;
            }

            tbody.innerHTML = '<tr><td colspan="6">No position data available</td></tr>';
        }

        function loadDepartmentFilter() {
            const select = document.getElementById('departmentFilter');
            if (dashboardData && dashboardData.widgets.department_headcount) {
                const options = dashboardData.widgets.department_headcount.map(dept => 
                    `<option value="${dept.id}">${dept.department_name}</option>`
                ).join('');
                select.innerHTML = '<option value="">All Departments</option>' + options;
            }
        }

        function applyFilters() {
            loadDashboardData();
        }

        function refreshDashboard() {
            loadDashboardData();
        }

        function toggleExportMenu() {
            document.getElementById('exportMenu').classList.toggle('active');
        }

        function exportReport(format) {
            alert(`Export to ${format.toUpperCase()} coming soon!`);
        }

        function formatNumber(num) {
            if (num === null || num === undefined) return '0';
            return num.toLocaleString('en-PH');
        }

        function formatCurrency(num) {
            if (num === null || num === undefined) return '₱0';
            return '₱' + Number(num).toLocaleString('en-PH', { maximumFractionDigits: 0 });
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', initializeDashboard);

        // Set current month
        document.getElementById('monthFilter').valueAsDate = new Date();
    </script>
</body>
</html>
