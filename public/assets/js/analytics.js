/**
 * Advanced HR Analytics Dashboard
 * Comprehensive workforce, payroll, and benefits analytics with interactive visualizations
 * Integrates with Chart.js for data visualization
 */

import { LEGACY_API_URL, REST_API_URL } from '../utils.js';

const API_BASE_URL = '/hospital_4/api';

// Chart instances for cleanup
let chartInstances = {};

/**
 * Display comprehensive HR Analytics Dashboard
 */
export async function displayHRAnalyticsDashboard() {
    try {
        // Verify user is authenticated
        const authToken = localStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!authToken || !userData.id) {
            console.warn('[Analytics] User not authenticated, redirecting to login');
            window.location.href = '/hospital_4/public/login.html';
            return;
        }
        
        console.log('[Analytics] User authenticated:', userData.email, 'Role:', userData.role_name || userData.role);
        
        // Prefer the container inside the CURRENTLY ACTIVE section so that
        // Analytics Dashboard / Reports / Metrics all render in their own views.
        const activeSection = document.querySelector('.page-section.active');
        let container = null;

        if (activeSection) {
            container =
                activeSection.querySelector('#analytics-dashboard-content') ||
                activeSection.querySelector('#analytics-reports-content') ||
                activeSection.querySelector('#analytics-metrics-content') ||
                activeSection.querySelector('#main-content-area');
        }

        // Fallbacks if for some reason the active section didn't contain our targets
        if (!container) {
            container =
                document.getElementById('analytics-dashboard-content') ||
                document.getElementById('analytics-reports-content') ||
                document.getElementById('analytics-metrics-content') ||
                document.getElementById('main-content-area');
        }

        if (!container) {
            console.error('[Analytics] No container found! Checked: main-content-area, analytics-dashboard-content, analytics-reports-content, analytics-metrics-content');
            return;
        }
        
        console.log('[Analytics] Container found:', container.id);
        
        // Page title element may not exist in all sections, so we'll skip it
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'HR Analytics Dashboard';
        }
        
        // Clear any existing content first
        container.innerHTML = '';
        
        // Render dashboard layout with loading state
        container.innerHTML = `
            <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 24px 0; color: #1f2937;">Dashboard Reports & Metrics</h2>
                
                <!-- KPI Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px;" id="analytics-kpis">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white;">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Total Employees</div>
                        <div style="font-size: 32px; font-weight: bold; margin-bottom: 4px;" id="total-emp">0</div>
                        <div style="font-size: 12px; opacity: 0.8;">Active: <span id="active-emp">0</span></div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px; color: white;">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Total Payroll</div>
                        <div style="font-size: 28px; font-weight: bold; margin-bottom: 4px;" id="total-payroll">₱0</div>
                        <div style="font-size: 12px; opacity: 0.8;">Monthly Average</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 8px; color: white;">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">HMO Enrollments</div>
                        <div style="font-size: 32px; font-weight: bold; margin-bottom: 4px;" id="hmo-enroll">0</div>
                        <div style="font-size: 12px; opacity: 0.8;">Active Plans: <span id="active-plans">0</span></div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 20px; border-radius: 8px; color: white;">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Pending Claims</div>
                        <div style="font-size: 32px; font-weight: bold; margin-bottom: 4px;" id="pending-claims">0</div>
                        <div style="font-size: 12px; opacity: 0.8;">In Review</div>
                    </div>
                </div>
                
                <!-- Report Sections -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                    <!-- Workforce Report -->
                    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">Workforce Distribution</h3>
                        <div id="workforce-content">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Department</th>
                                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Count</th>
                                    </tr>
                                </thead>
                                <tbody id="workforce-table"></tbody>
                            </table>
                        </div>
                    </div>
                
                <!-- Payroll Summary -->
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">Payroll Summary</h3>
                    <div id="payroll-content">
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="color: #6b7280;">Total Gross</span>
                                <span style="color: #1f2937; font-weight: 600;" id="payroll-gross">₱0</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="color: #6b7280;">Total Deductions</span>
                                <span style="color: #1f2937; font-weight: 600;" id="payroll-deductions">₱0</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                <span style="color: #6b7280;">Average Salary</span>
                                <span style="color: #1f2937; font-weight: 600;" id="payroll-avg">₱0</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Benefits Report -->
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">Benefits & Claims</h3>
                    <div id="benefits-content">
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="color: #6b7280;">Enrolled Employees</span>
                                <span style="color: #1f2937; font-weight: 600;" id="benefits-enrolled">0</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                <span style="color: #6b7280;">Active Plans</span>
                                <span style="color: #1f2937; font-weight: 600;" id="benefits-plans">0</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                <span style="color: #6b7280;">Total Claims Value</span>
                                <span style="color: #1f2937; font-weight: 600;" id="benefits-claims">₱0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    console.log('[Analytics] HTML rendered, now loading data...');
    
    // Load and display data
    await loadDashboardData();
    initializeEventListeners();
    
    console.log('[Analytics] Dashboard complete');
    } catch (error) {
        console.error('[Analytics] Error displaying HR Analytics Dashboard:', error);
        const container = document.getElementById('main-content-area') || document.querySelector('.page-section.active');
        if (container) {
            container.innerHTML = `
                <div style="background: #fee2e2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; color: #991b1b;">
                    <h3 style="margin: 0 0 8px 0;">Error Loading Analytics Dashboard</h3>
                    <p style="margin: 0; font-size: 14px;">${error.message || 'An unexpected error occurred while loading the dashboard.'}</p>
                </div>
            `;
        }
    }
}

/**
 * Analytics Dashboard export (alias for consistency)
 */
export async function displayAnalyticsDashboardsSection() {
    return displayAnalyticsDashboard();
}

/**
 * Analytics Reports export (loads dashboard in reports view)
 */
export async function displayAnalyticsReportsSection() {
    return displayAnalyticsReports();
}

/**
 * Analytics Metrics export (loads dashboard in metrics view)
 */
export async function displayAnalyticsMetricsSection() {
    return displayAnalyticsMetrics();
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // The simplified dashboard doesn't have tabs or complex filters
    // Just basic event handling for future enhancements
    console.log('[Analytics] Dashboard initialized');
}

/**
 * Load analytics data from API or use fallback
 */
async function loadDashboardData() {
    try {
        // Fetch live analytics data from backend
        const currentYear = new Date().getFullYear();
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
        const requestOptions = {
            credentials: 'include',
            headers: {
                // Some backends require explicit JSON header even for GETs
                'Content-Type': 'application/json',
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            }
        };

        const [dashboardRes, statisticsRes, payrollRes] = await Promise.all([
            fetch(`${API_BASE_URL}/analytics/analytics.php?resource=dashboard`, requestOptions),
            fetch(`${API_BASE_URL}/analytics/analytics.php?resource=statistics`, requestOptions),
            fetch(`${API_BASE_URL}/analytics/analytics.php?resource=payroll-summary&year=${currentYear}`, requestOptions)
        ]);

        // If not authenticated, log error but don't redirect (use fallback data instead)
        if (dashboardRes.status === 401 || statisticsRes.status === 401 || payrollRes.status === 401) {
            console.warn('[Analytics] Unauthorized (401). Using fallback data.');
            loadFallbackAnalyticsData();
            return;
        }

        if (!dashboardRes.ok || !statisticsRes.ok || !payrollRes.ok) {
            throw new Error(`HTTP error while loading analytics (${dashboardRes.status}, ${statisticsRes.status}, ${payrollRes.status})`);
        }

        const [dashboardJson, statisticsJson, payrollJson] = await Promise.all([
            dashboardRes.json(),
            statisticsRes.json(),
            payrollRes.json()
        ]);

        if (!dashboardJson.success || !statisticsJson.success || !payrollJson.success) {
            throw new Error(
                dashboardJson.message ||
                statisticsJson.message ||
                payrollJson.message ||
                'Failed to load analytics data'
            );
        }

        const dashboard = dashboardJson.data || {};
        const stats = statisticsJson.data || {};
        const payrollSummary = payrollJson.data || {};

        const overviewSummary = dashboard.summary || {};
        const health = dashboard.health_metrics || {};

        const workforceByDept = (stats.employee_distribution && stats.employee_distribution.by_department) || [];
        const salaryAnalysis = stats.salary_analysis || {};
        const payrollTotals = payrollSummary.totals || {};

        // Normalize data into the format used by the simple dashboard UI
        const data = {
            overview: {
                total_employees: overviewSummary.total_employees ?? workforceByDept.reduce((sum, d) => sum + (parseInt(d.count || 0, 10)), 0),
                active_employees: overviewSummary.active_employees ?? overviewSummary.total_employees ?? 0,
                inactive_employees: overviewSummary.inactive_employees ?? 0,
                total_departments: overviewSummary.total_departments ?? workforceByDept.length,
                total_payroll: overviewSummary.total_payroll ?? payrollTotals.total_gross ?? 0,
                pending_claims: overviewSummary.pending_claims ?? health.claims_pending ?? 0
            },
            workforce: workforceByDept.map(dept => ({
                department: dept.department || dept.department_name || 'N/A',
                count: dept.count || dept.headcount || 0
            })),
            payroll: {
                total_gross: payrollTotals.total_gross ?? overviewSummary.total_payroll ?? 0,
                total_deductions: payrollTotals.total_deductions ?? 0,
                total_net: payrollTotals.total_net ?? 0,
                average_salary: salaryAnalysis.average_salary ?? 0
            },
            benefits: {
                enrolled_employees: health.enrolled_employees ?? health.enrollment_rate ?? 0,
                active_plans: health.active_hmo_plans ?? 0,
                total_claims_value: health.total_claims_value ?? 0,
                pending_claims_value: health.claims_pending ?? 0
            }
        };

        // Populate KPI cards
        document.getElementById('total-emp').textContent = (data.overview.total_employees || 0).toLocaleString('en-PH');
        document.getElementById('active-emp').textContent = (data.overview.active_employees || 0).toLocaleString('en-PH');
        document.getElementById('total-payroll').textContent = '₱' + ((data.overview.total_payroll || 0) / 1000000).toFixed(1) + 'M';
        document.getElementById('hmo-enroll').textContent = (data.benefits.enrolled_employees || data.overview.total_employees || 0).toLocaleString('en-PH');
        document.getElementById('active-plans').textContent = (data.benefits.active_plans || 0).toString();
        document.getElementById('pending-claims').textContent = (data.overview.pending_claims || data.benefits.pending_claims_value || 0).toLocaleString('en-PH');

        // Populate Workforce table
        let workforceHtml = '';
        if (data.workforce && data.workforce.length > 0) {
            for (let dept of data.workforce) {
                workforceHtml += `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px; color: #374151;">${dept.department}</td>
                        <td style="padding: 12px; text-align: right; color: #374151; font-weight: 500;">${dept.count}</td>
                    </tr>
                `;
            }
        } else {
            workforceHtml = `
                <tr>
                    <td colspan="2" style="padding: 12px; color: #6b7280; text-align: center;">No workforce data available</td>
                </tr>
            `;
        }
        document.getElementById('workforce-table').innerHTML = workforceHtml;

        // Populate Payroll Summary
        document.getElementById('payroll-gross').textContent = '₱' + (data.payroll.total_gross || 0).toLocaleString('en-PH');
        document.getElementById('payroll-deductions').textContent = '₱' + (data.payroll.total_deductions || 0).toLocaleString('en-PH');
        document.getElementById('payroll-avg').textContent = '₱' + (data.payroll.average_salary || 0).toLocaleString('en-PH');

        // Populate Benefits Summary
        document.getElementById('benefits-enrolled').textContent = (data.benefits.enrolled_employees || 0).toLocaleString('en-PH');
        document.getElementById('benefits-plans').textContent = (data.benefits.active_plans || 0).toLocaleString('en-PH');
        document.getElementById('benefits-claims').textContent = '₱' + ((data.benefits.total_claims_value || 0) / 1000000).toFixed(1) + 'M';

    } catch (error) {
        console.error('Error loading dashboard data from API, falling back to static data:', error);

        // Fallback to static mock data so analytics are never empty
        const mockData = {
            success: true,
            data: {
                overview: {
                    total_employees: 156,
                    active_employees: 148,
                    inactive_employees: 8,
                    total_departments: 12,
                    total_payroll: 9600000,
                    pending_claims: 8
                },
                workforce: [
                    { department: 'Medical', count: 68 },
                    { department: 'Operations', count: 32 },
                    { department: 'Administration', count: 21 },
                    { department: 'IT', count: 15 },
                    { department: 'Finance', count: 12 },
                    { department: 'HR', count: 8 }
                ],
                payroll: {
                    total_gross: 9600000,
                    total_deductions: 1200000,
                    total_net: 8400000,
                    average_salary: 61538
                },
                benefits: {
                    enrolled_employees: 156,
                    active_plans: 5,
                    total_claims_value: 2500000,
                    pending_claims_value: 450000
                }
            }
        };

        const result = mockData;
        const data = result.data;

        // Populate KPI cards with fallback data
        document.getElementById('total-emp').textContent = data.overview.total_employees.toLocaleString('en-PH');
        document.getElementById('active-emp').textContent = data.overview.active_employees.toLocaleString('en-PH');
        document.getElementById('total-payroll').textContent = '₱' + (data.overview.total_payroll / 1000000).toFixed(1) + 'M';
        document.getElementById('hmo-enroll').textContent = data.overview.total_employees.toLocaleString('en-PH');
        document.getElementById('active-plans').textContent = '5';
        document.getElementById('pending-claims').textContent = data.overview.pending_claims.toLocaleString('en-PH');

        // Populate Workforce table (fallback)
        let workforceHtml = '';
        for (let dept of data.workforce) {
            workforceHtml += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; color: #374151;">${dept.department}</td>
                    <td style="padding: 12px; text-align: right; color: #374151; font-weight: 500;">${dept.count}</td>
                </tr>
            `;
        }
        document.getElementById('workforce-table').innerHTML = workforceHtml;

        // Populate Payroll Summary (fallback)
        document.getElementById('payroll-gross').textContent = '₱' + data.payroll.total_gross.toLocaleString('en-PH');
        document.getElementById('payroll-deductions').textContent = '₱' + data.payroll.total_deductions.toLocaleString('en-PH');
        document.getElementById('payroll-avg').textContent = '₱' + data.payroll.average_salary.toLocaleString('en-PH');

        // Populate Benefits Summary (fallback)
        document.getElementById('benefits-enrolled').textContent = data.benefits.enrolled_employees.toLocaleString('en-PH');
        document.getElementById('benefits-plans').textContent = data.benefits.active_plans.toLocaleString('en-PH');
        document.getElementById('benefits-claims').textContent = '₱' + (data.benefits.total_claims_value / 1000000).toFixed(1) + 'M';

        showError('Live analytics are temporarily unavailable. Showing static demo data instead.');
    }
}

/**
 * Display Analytics Reports Section
 */
async function displayAnalyticsDashboard() {
    return displayHRAnalyticsDashboard();
}

/**
 * Display Analytics Reports with detailed report views
 */
async function displayAnalyticsReports() {
    try {
        const authToken = localStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!authToken || !userData.id) {
            console.warn('[Analytics] User not authenticated');
            window.location.href = '/hospital_4/public/login.html';
            return;
        }
        
        const activeSection = document.querySelector('.page-section.active');
        let container = document.getElementById('analytics-reports-content');
        
        if (!container && activeSection) {
            container = activeSection.querySelector('#analytics-reports-content') || activeSection.querySelector('#main-content-area');
        }
        
        if (!container) {
            container = document.getElementById('main-content-area');
        }
        
        if (!container) {
            console.error('[Analytics Reports] No container found');
            return;
        }
        
        container.innerHTML = '';
        
        container.innerHTML = `
            <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 24px 0; color: #1f2937;">Reports</h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px;">
                    <!-- Employee Report Card -->
                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                        <div style="font-size: 24px; margin-bottom: 8px;">👥</div>
                        <h3 style="margin: 0 0 8px 0; color: #1f2937;">Employee Report</h3>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Workforce demographics and headcount analysis</p>
                        <button onclick="generateEmployeeReport()" style="margin-top: 12px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Generate Report</button>
                    </div>
                    
                    <!-- Payroll Report Card -->
                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                        <div style="font-size: 24px; margin-bottom: 8px;">💰</div>
                        <h3 style="margin: 0 0 8px 0; color: #1f2937;">Payroll Report</h3>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Salary, deductions, and payroll summaries</p>
                        <button onclick="generatePayrollReport()" style="margin-top: 12px; padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">Generate Report</button>
                    </div>
                    
                    <!-- Benefits Report Card -->
                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                        <div style="font-size: 24px; margin-bottom: 8px;">🏥</div>
                        <h3 style="margin: 0 0 8px 0; color: #1f2937;">Benefits Report</h3>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">HMO enrollments and claims data</p>
                        <button onclick="generateBenefitsReport()" style="margin-top: 12px; padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer;">Generate Report</button>
                    </div>
                    
                    <!-- Attendance Report Card -->
                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                        <div style="font-size: 24px; margin-bottom: 8px;">📅</div>
                        <h3 style="margin: 0 0 8px 0; color: #1f2937;">Attendance Report</h3>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Attendance records and leave statistics</p>
                        <button onclick="generateAttendanceReport()" style="margin-top: 12px; padding: 8px 16px; background: #8b5cf6; color: white; border: none; border-radius: 6px; cursor: pointer;">Generate Report</button>
                    </div>
                    
                    <!-- Compliance Report Card -->
                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                        <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
                        <h3 style="margin: 0 0 8px 0; color: #1f2937;">Compliance Report</h3>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Tax and compliance filing status</p>
                        <button onclick="generateComplianceReport()" style="margin-top: 12px; padding: 8px 16px; background: #ec4899; color: white; border: none; border-radius: 6px; cursor: pointer;">Generate Report</button>
                    </div>
                </div>
                
                <div id="report-content" style="margin-top: 24px;"></div>
            </div>
        `;
        
        console.log('[Analytics Reports] Section displayed');
    } catch (error) {
        console.error('[Analytics Reports] Error:', error);
    }
}

/**
 * Display Analytics Metrics with key performance indicators
 */
async function displayAnalyticsMetrics() {
    try {
        const authToken = localStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!authToken || !userData.id) {
            console.warn('[Analytics] User not authenticated');
            window.location.href = '/hospital_4/public/login.html';
            return;
        }
        
        const activeSection = document.querySelector('.page-section.active');
        let container = document.getElementById('analytics-metrics-content');
        
        if (!container && activeSection) {
            container = activeSection.querySelector('#analytics-metrics-content') || activeSection.querySelector('#main-content-area');
        }
        
        if (!container) {
            container = document.getElementById('main-content-area');
        }
        
        if (!container) {
            console.error('[Analytics Metrics] No container found');
            return;
        }
        
        container.innerHTML = '';
        
        container.innerHTML = `
            <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 24px 0; color: #1f2937;">Key Performance Indicators (KPIs)</h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 32px;">
                    <!-- HR Metrics -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white;">
                        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 12px; font-weight: 600;">EMPLOYEE TURNOVER</div>
                        <div style="font-size: 36px; font-weight: bold; margin-bottom: 8px;" id="metric-turnover">5.2%</div>
                        <div style="font-size: 12px; opacity: 0.8;">Year-to-date</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px; color: white;">
                        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 12px; font-weight: 600;">EMPLOYEE SATISFACTION</div>
                        <div style="font-size: 36px; font-weight: bold; margin-bottom: 8px;" id="metric-satisfaction">8.5/10</div>
                        <div style="font-size: 12px; opacity: 0.8;">Latest survey</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 8px; color: white;">
                        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 12px; font-weight: 600;">TRAINING HOURS</div>
                        <div style="font-size: 36px; font-weight: bold; margin-bottom: 8px;" id="metric-training">2,450</div>
                        <div style="font-size: 12px; opacity: 0.8;">Per month average</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 20px; border-radius: 8px; color: white;">
                        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 12px; font-weight: 600;">PRODUCTIVITY INDEX</div>
                        <div style="font-size: 36px; font-weight: bold; margin-bottom: 8px;" id="metric-productivity">92%</div>
                        <div style="font-size: 12px; opacity: 0.8;">Target achievement</div>
                    </div>
                </div>
                
                <!-- Detailed Metrics Table -->
                <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">Detailed Metrics</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Metric</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Current Value</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Target</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Status</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 12px; color: #374151;">Employee Retention Rate</td>
                                <td style="padding: 12px; color: #1f2937; font-weight: 600;">94.8%</td>
                                <td style="padding: 12px; color: #6b7280;">95%</td>
                                <td style="padding: 12px;"><span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">On Track</span></td>
                                <td style="padding: 12px; color: #10b981;">↑ +0.5%</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 12px; color: #374151;">Average Salary Growth</td>
                                <td style="padding: 12px; color: #1f2937; font-weight: 600;">3.2%</td>
                                <td style="padding: 12px; color: #6b7280;">3.5%</td>
                                <td style="padding: 12px;"><span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">Below Target</span></td>
                                <td style="padding: 12px; color: #f97316;">↓ -0.3%</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 12px; color: #374151;">Training Coverage</td>
                                <td style="padding: 12px; color: #1f2937; font-weight: 600;">87%</td>
                                <td style="padding: 12px; color: #6b7280;">85%</td>
                                <td style="padding: 12px;"><span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">Exceeding</span></td>
                                <td style="padding: 12px; color: #10b981;">↑ +2.1%</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 12px; color: #374151;">Benefits Utilization</td>
                                <td style="padding: 12px; color: #1f2937; font-weight: 600;">78%</td>
                                <td style="padding: 12px; color: #6b7280;">80%</td>
                                <td style="padding: 12px;"><span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">On Track</span></td>
                                <td style="padding: 12px; color: #f97316;">↓ -1.2%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        console.log('[Analytics Metrics] Section displayed');
    } catch (error) {
        console.error('[Analytics Metrics] Error:', error);
    }
}

/**
 * Get current filter values
 */
function getFilters() {
    return {
        department_id: document.getElementById('dept-filter')?.value || '',
        branch_id: document.getElementById('branch-filter')?.value || '',
        months: document.getElementById('period-filter')?.value || '12'
    };
}

/**
 * Render overview KPI cards
 */
function renderOverviewKPIs(overview) {
    const container = document.getElementById('overview-kpis');
    if (!container) return;

    container.innerHTML = `
        <!-- Total Active Employees -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-xl shadow-lg text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium uppercase tracking-wider opacity-90">Total Active Employees</p>
                    <p class="text-3xl font-bold mt-2">${formatNumber(overview.total_active_employees || 0)}</p>
                    <p class="text-xs mt-1 opacity-75">
                        <span class="text-green-300">+${overview.monthly_new_hires || 0}</span> new hires this month
                    </p>
                </div>
                <div class="bg-white/20 p-3 rounded-full">
                    <i class="fas fa-users fa-2x"></i>
                </div>
            </div>
        </div>

        <!-- Turnover Rate -->
        <div class="bg-gradient-to-br from-red-500 to-red-700 p-6 rounded-xl shadow-lg text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium uppercase tracking-wider opacity-90">Annual Turnover Rate</p>
                    <p class="text-3xl font-bold mt-2">${formatNumber(overview.annual_turnover_rate || 0)}%</p>
                    <p class="text-xs mt-1 opacity-75">
                        ${overview.monthly_separations || 0} separations this month
                    </p>
                </div>
                <div class="bg-white/20 p-3 rounded-full">
                    <i class="fas fa-exchange-alt fa-2x"></i>
                </div>
            </div>
        </div>

        <!-- Monthly Payroll Cost -->
        <div class="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-xl shadow-lg text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium uppercase tracking-wider opacity-90">Monthly Payroll Cost</p>
                    <p class="text-3xl font-bold mt-2">₱${formatNumber(overview.total_monthly_payroll_cost || 0, 2)}</p>
                    <p class="text-xs mt-1 opacity-75">
                        Avg: ₱${formatNumber(overview.avg_salary || 0, 2)} per employee
                    </p>
                </div>
                <div class="bg-white/20 p-3 rounded-full">
                    <i class="fas fa-money-bill-wave fa-2x"></i>
                </div>
            </div>
        </div>

        <!-- HMO Benefits Cost -->
        <div class="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-xl shadow-lg text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium uppercase tracking-wider opacity-90">HMO Benefits Cost</p>
                    <p class="text-3xl font-bold mt-2">₱${formatNumber(overview.total_monthly_hmo_cost || 0, 2)}</p>
                    <p class="text-xs mt-1 opacity-75">
                        ${overview.active_hmo_enrollments || 0} active enrollments
                    </p>
                </div>
                <div class="bg-white/20 p-3 rounded-full">
                    <i class="fas fa-briefcase-medical fa-2x"></i>
                </div>
            </div>
        </div>

        <!-- Average Tenure -->
        <div class="bg-gradient-to-br from-yellow-500 to-yellow-700 p-6 rounded-xl shadow-lg text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium uppercase tracking-wider opacity-90">Avg Employee Tenure</p>
                    <p class="text-3xl font-bold mt-2">${formatNumber(overview.avg_employee_tenure_years || 0, 1)} yrs</p>
                    <p class="text-xs mt-1 opacity-75">
                        Retention is key to success
                    </p>
                </div>
                <div class="bg-white/20 p-3 rounded-full">
                    <i class="fas fa-user-clock fa-2x"></i>
                </div>
            </div>
        </div>

        <!-- Attendance Rate -->
        <div class="bg-gradient-to-br from-teal-500 to-teal-700 p-6 rounded-xl shadow-lg text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium uppercase tracking-wider opacity-90">Attendance Rate</p>
                    <p class="text-3xl font-bold mt-2">${formatNumber(100 - (overview.absenteeism_rate || 0), 1)}%</p>
                    <p class="text-xs mt-1 opacity-75">
                        ${formatNumber(overview.absenteeism_rate || 0, 1)}% absenteeism
                    </p>
                </div>
                <div class="bg-white/20 p-3 rounded-full">
                    <i class="fas fa-calendar-check fa-2x"></i>
                </div>
            </div>
        </div>

        <!-- Pending Leave Requests -->
        <div class="bg-gradient-to-br from-orange-500 to-orange-700 p-6 rounded-xl shadow-lg text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium uppercase tracking-wider opacity-90">Pending Leave Requests</p>
                    <p class="text-3xl font-bold mt-2">${overview.pending_leave_requests || 0}</p>
                    <p class="text-xs mt-1 opacity-75">
                        Requires approval
                    </p>
                </div>
                <div class="bg-white/20 p-3 rounded-full">
                    <i class="fas fa-clipboard-list fa-2x"></i>
                </div>
            </div>
        </div>

        <!-- Training Completion -->
        <div class="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium uppercase tracking-wider opacity-90">Training Completion</p>
                    <p class="text-3xl font-bold mt-2">${formatNumber(overview.avg_training_completion_rate || 0, 1)}%</p>
                    <p class="text-xs mt-1 opacity-75">
                        ${overview.trainings_this_year || 0} trainings this year
                    </p>
                </div>
                <div class="bg-white/20 p-3 rounded-full">
                    <i class="fas fa-graduation-cap fa-2x"></i>
                </div>
            </div>
        </div>
    `;
}

/**
 * Switch between tabs
 */
async function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.analytics-tab').forEach(tab => {
        tab.classList.remove('active', 'border-[#594423]', 'text-[#594423]');
        tab.classList.add('border-transparent', 'text-gray-500');
    });
    
    const activeTab = document.querySelector(`.analytics-tab[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active', 'border-[#594423]', 'text-[#594423]');
        activeTab.classList.remove('border-transparent', 'text-gray-500');
    }

    // Show loading state
    const contentContainer = document.getElementById('analytics-tab-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = `
        <div class="flex items-center justify-center py-12">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin fa-3x text-gray-400 mb-4"></i>
                <p class="text-gray-500">Loading ${tabName} analytics...</p>
            </div>
        </div>
    `;

    // Load tab-specific data
    try {
        const filters = getFilters();
        const queryString = new URLSearchParams(filters).toString();
        
        const response = await fetch(`${REST_API_URL}hr-analytics/${tabName}?${queryString}`, {
            credentials: 'include'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to load analytics');

        renderTabContent(tabName, { [tabName]: result.data });

    } catch (error) {
        console.error(`Error loading ${tabName} tab:`, error);
        contentContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle fa-3x text-red-500 mb-4"></i>
                <p class="text-red-600">Failed to load ${tabName} analytics</p>
                <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-[#594423] text-white rounded-md">
                    Retry
                </button>
            </div>
        `;
    }
}

/**
 * Render tab content based on selected tab
 */
function renderTabContent(tabName, data) {
    const contentContainer = document.getElementById('analytics-tab-content');
    if (!contentContainer) return;

    // Clean up existing charts
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    chartInstances = {};

    switch (tabName) {
        case 'overview':
            renderOverviewTab(contentContainer, data);
            break;
        case 'workforce':
            renderWorkforceTab(contentContainer, data.workforce);
            break;
        case 'payroll':
            renderPayrollTab(contentContainer, data.payroll);
            break;
        case 'benefits':
            renderBenefitsTab(contentContainer, data.benefits);
            break;
        case 'training':
            renderTrainingTab(contentContainer, data.training);
            break;
        case 'attendance':
            renderAttendanceTab(contentContainer, data.attendance);
            break;
        default:
            renderOverviewTab(contentContainer, data);
    }
}

/**
 * Render Overview Tab
 */
function renderOverviewTab(container, data) {
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Headcount Trend -->
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold mb-4">Headcount Trend</h3>
                <canvas id="headcount-trend-chart" height="250"></canvas>
            </div>

            <!-- Department Distribution -->
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold mb-4">Headcount by Department</h3>
                <canvas id="dept-distribution-chart" height="250"></canvas>
            </div>

            <!-- Payroll Cost Trend -->
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold mb-4">Payroll Cost Trend</h3>
                <canvas id="payroll-trend-chart" height="250"></canvas>
            </div>

            <!-- Turnover Analysis -->
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold mb-4">Turnover by Department</h3>
                <canvas id="turnover-dept-chart" height="250"></canvas>
            </div>
        </div>
    `;

    // Render charts
    if (data.workforce?.headcount_trend) {
        renderLineChart('headcount-trend-chart', data.workforce.headcount_trend, 'month_name', 'headcount', 'Headcount');
    }

    if (data.workforce?.headcount_by_department) {
        renderBarChart('dept-distribution-chart', data.workforce.headcount_by_department, 'department_name', 'headcount', 'Employees');
    }

    if (data.payroll?.cost_trend) {
        renderLineChart('payroll-trend-chart', data.payroll.cost_trend, 'month_name', 'total_gross', 'Cost (₱)', true);
    }

    if (data.workforce?.turnover_by_department) {
        renderBarChart('turnover-dept-chart', data.workforce.turnover_by_department, 'department_name', 'turnover_rate', 'Turnover %');
    }
}

/**
 * Render Workforce Tab
 */
function renderWorkforceTab(container, workforce) {
    if (!workforce) {
        container.innerHTML = '<p class="text-center text-gray-500 py-12">No workforce data available</p>';
        return;
    }

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Headcount Metrics -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Headcount by Employment Type -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Employment Type Distribution</h3>
                    <canvas id="employment-type-chart" height="200"></canvas>
                </div>

                <!-- Gender Distribution -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Gender Distribution</h3>
                    <canvas id="gender-distribution-chart" height="200"></canvas>
                </div>

                <!-- Age Distribution -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Age Distribution</h3>
                    <canvas id="age-distribution-chart" height="200"></canvas>
                </div>
            </div>

            <!-- Hiring Trends -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- New Hires Trend -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">New Hires Trend</h3>
                    <canvas id="new-hires-trend-chart" height="250"></canvas>
                </div>

                <!-- Separations Trend -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Separations Trend</h3>
                    <canvas id="separations-trend-chart" height="250"></canvas>
                </div>
            </div>
        </div>
    `;

    // Render charts
    if (workforce.headcount_by_employment_type) {
        renderPieChart('employment-type-chart', workforce.headcount_by_employment_type, 'employment_type', 'headcount');
    }

    if (workforce.gender_distribution) {
        renderPieChart('gender-distribution-chart', workforce.gender_distribution, 'gender', 'count');
    }

    if (workforce.age_distribution) {
        renderBarChart('age-distribution-chart', workforce.age_distribution, 'age_range', 'count', 'Employees');
    }

    if (workforce.new_hires_trend) {
        renderLineChart('new-hires-trend-chart', workforce.new_hires_trend, 'month_name', 'new_hires', 'New Hires');
    }

    if (workforce.separations_trend) {
        renderLineChart('separations-trend-chart', workforce.separations_trend, 'month_name', 'separations', 'Separations');
    }
}

/**
 * Render Payroll Tab
 */
function renderPayrollTab(container, payroll) {
    if (!payroll) {
        container.innerHTML = '<p class="text-center text-gray-500 py-12">No payroll data available</p>';
        return;
    }

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Cost Analysis -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Cost by Department -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Payroll Cost by Department</h3>
                    <canvas id="payroll-dept-chart" height="300"></canvas>
                </div>

                <!-- Cost Composition -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Cost Composition</h3>
                    <canvas id="cost-composition-chart" height="300"></canvas>
                </div>
            </div>

            <!-- Deductions & Bonuses -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Deduction Breakdown -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Deduction Breakdown</h3>
                    <canvas id="deduction-breakdown-chart" height="300"></canvas>
                </div>

                <!-- Bonus Analysis -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Bonus Distribution</h3>
                    <canvas id="bonus-analysis-chart" height="300"></canvas>
                </div>
            </div>
        </div>
    `;

    // Render charts
    if (payroll.cost_by_department) {
        renderBarChart('payroll-dept-chart', payroll.cost_by_department, 'department_name', 'total_base_salary', 'Cost (₱)', true);
    }

    if (payroll.cost_composition) {
        renderPieChart('cost-composition-chart', payroll.cost_composition, 'component', 'amount', true);
    }

    if (payroll.deduction_breakdown) {
        renderBarChart('deduction-breakdown-chart', payroll.deduction_breakdown, 'DeductionType', 'total_amount', 'Amount (₱)', true);
    }

    if (payroll.bonus_analysis) {
        renderBarChart('bonus-analysis-chart', payroll.bonus_analysis, 'BonusType', 'total_amount', 'Amount (₱)', true);
    }
}

/**
 * Render Benefits Tab
 */
function renderBenefitsTab(container, benefits) {
    if (!benefits) {
        container.innerHTML = '<p class="text-center text-gray-500 py-12">No benefits data available</p>';
        return;
    }

    container.innerHTML = `
        <div class="space-y-6">
            <!-- HMO Overview Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-gradient-to-br from-blue-400 to-blue-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Active Enrollments</p>
                    <p class="text-2xl font-bold">${benefits.hmo_overview?.active_enrollments || 0}</p>
                </div>
                <div class="bg-gradient-to-br from-green-400 to-green-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Pending Claims</p>
                    <p class="text-2xl font-bold">${benefits.hmo_overview?.pending_claims || 0}</p>
                </div>
                <div class="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Monthly HMO Cost</p>
                    <p class="text-2xl font-bold">₱${formatNumber(benefits.hmo_overview?.monthly_premium_cost || 0, 2)}</p>
                </div>
                <div class="bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Avg Processing Time</p>
                    <p class="text-2xl font-bold">${formatNumber(benefits.hmo_overview?.avg_processing_days || 0)} days</p>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- HMO by Department -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">HMO Cost by Department</h3>
                    <canvas id="hmo-dept-chart" height="300"></canvas>
                </div>

                <!-- Provider Utilization -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Plan Utilization</h3>
                    <canvas id="provider-util-chart" height="300"></canvas>
                </div>
            </div>
        </div>
    `;

    // Render charts
    if (benefits.hmo_by_department) {
        renderBarChart('hmo-dept-chart', benefits.hmo_by_department, 'DepartmentName', 'monthly_premium_cost', 'Cost (₱)', true);
    }

    if (benefits.provider_utilization) {
        renderBarChart('provider-util-chart', benefits.provider_utilization, 'PlanName', 'enrollment_count', 'Enrollments');
    }
}

/**
 * Render Training Tab
 */
function renderTrainingTab(container, training) {
    if (!training || !training.training_completion) {
        container.innerHTML = '<p class="text-center text-gray-500 py-12">No training data available</p>';
        return;
    }

    const completion = training.training_completion;
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Training Overview Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-gradient-to-br from-indigo-400 to-indigo-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Total Trainings</p>
                    <p class="text-2xl font-bold">${completion.total_trainings || 0}</p>
                </div>
                <div class="bg-gradient-to-br from-teal-400 to-teal-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Employees Trained</p>
                    <p class="text-2xl font-bold">${completion.employees_trained || 0}</p>
                </div>
                <div class="bg-gradient-to-br from-pink-400 to-pink-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Completion Rate</p>
                    <p class="text-2xl font-bold">${formatNumber(completion.completion_rate || 0, 1)}%</p>
                </div>
                <div class="bg-gradient-to-br from-orange-400 to-orange-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Total Hours</p>
                    <p class="text-2xl font-bold">${formatNumber(completion.total_training_hours || 0)}</p>
                </div>
            </div>

            <!-- Training Hours by Department -->
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold mb-4">Training Hours by Department</h3>
                <canvas id="training-dept-chart" height="300"></canvas>
            </div>
        </div>
    `;

    // Render chart
    if (training.training_hours_by_department) {
        renderBarChart('training-dept-chart', training.training_hours_by_department, 'department_name', 'total_hours', 'Hours');
    }
}

/**
 * Render Attendance Tab
 */
function renderAttendanceTab(container, attendance) {
    if (!attendance) {
        container.innerHTML = '<p class="text-center text-gray-500 py-12">No attendance data available</p>';
        return;
    }

    const rate = attendance.attendance_rate || {};
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Attendance Overview Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-gradient-to-br from-green-400 to-green-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Attendance Rate</p>
                    <p class="text-2xl font-bold">${formatNumber(rate.attendance_rate || 0, 1)}%</p>
                </div>
                <div class="bg-gradient-to-br from-red-400 to-red-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Absenteeism Rate</p>
                    <p class="text-2xl font-bold">${formatNumber(rate.absenteeism_rate || 0, 1)}%</p>
                </div>
                <div class="bg-gradient-to-br from-blue-400 to-blue-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Present Days</p>
                    <p class="text-2xl font-bold">${rate.present_count || 0}</p>
                </div>
                <div class="bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 rounded-lg text-white">
                    <p class="text-sm opacity-90">Absent Days</p>
                    <p class="text-2xl font-bold">${rate.absent_count || 0}</p>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Absenteeism Trend -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Absenteeism Trend</h3>
                    <canvas id="absenteeism-trend-chart" height="300"></canvas>
                </div>

                <!-- Attendance by Department -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 class="text-lg font-semibold mb-4">Attendance by Department</h3>
                    <canvas id="attendance-dept-chart" height="300"></canvas>
                </div>
            </div>

            <!-- Leave Utilization -->
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold mb-4">Leave Utilization</h3>
                <canvas id="leave-util-chart" height="300"></canvas>
            </div>
        </div>
    `;

    // Render charts
    if (attendance.absenteeism_trend) {
        renderLineChart('absenteeism-trend-chart', attendance.absenteeism_trend, 'month_name', 'absenteeism_rate', 'Absenteeism %');
    }

    if (attendance.attendance_by_department) {
        renderBarChart('attendance-dept-chart', attendance.attendance_by_department, 'department_name', 'attendance_rate', 'Attendance %');
    }

    if (attendance.leave_utilization) {
        renderBarChart('leave-util-chart', attendance.leave_utilization, 'LeaveTypeName', 'total_days_used', 'Days');
    }
}

// =====================================================
// CHART RENDERING FUNCTIONS
// =====================================================

/**
 * Render line chart
 */
function renderLineChart(canvasId, data, labelKey, valueKey, label, isCurrency = false) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || !data) return;

    const labels = data.map(item => item[labelKey]);
    const values = data.map(item => parseFloat(item[valueKey]) || 0);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: values,
                borderColor: 'rgb(89, 68, 35)',
                backgroundColor: 'rgba(89, 68, 35, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let value = context.parsed.y;
                            if (isCurrency) {
                                return label + ': ₱' + formatNumber(value, 2);
                            }
                            return label + ': ' + formatNumber(value);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (isCurrency) {
                                return '₱' + formatNumber(value);
                            }
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render bar chart
 */
function renderBarChart(canvasId, data, labelKey, valueKey, label, isCurrency = false) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || !data) return;

    const labels = data.map(item => item[labelKey]);
    const values = data.map(item => parseFloat(item[valueKey]) || 0);

    const colors = labels.map((_, i) => `hsl(${(i * 360 / labels.length)}, 70%, 60%)`);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: values,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('60%)', '50%)')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let value = context.parsed.y;
                            if (isCurrency) {
                                return label + ': ₱' + formatNumber(value, 2);
                            }
                            return label + ': ' + formatNumber(value);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (isCurrency) {
                                return '₱' + formatNumber(value);
                            }
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render pie chart
 */
function renderPieChart(canvasId, data, labelKey, valueKey, isCurrency = false) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || !data) return;

    const labels = data.map(item => item[labelKey]);
    const values = data.map(item => parseFloat(item[valueKey]) || 0);

    const colors = labels.map((_, i) => `hsl(${(i * 360 / labels.length)}, 70%, 60%)`);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let value = context.parsed;
                            let label = context.label;
                            if (isCurrency) {
                                return label + ': ₱' + formatNumber(value, 2);
                            }
                            return label + ': ' + formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

/**
 * Export data in various formats
 */
async function exportData(format) {
    const filters = getFilters();
    const activeTab = document.querySelector('.analytics-tab.active')?.dataset.tab || 'overview';

    try {
        const endpoint = format === 'PDF' ? 'export-pdf' : format === 'Excel' ? 'export-excel' : 'export-csv';
        
        const response = await fetch(`${REST_API_URL}hr-analytics/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                report_type: activeTab,
                filters: filters
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        
        if (format === 'CSV' && result.success && result.data.csv_data) {
            // Download CSV
            const blob = new Blob([result.data.csv_data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hr_analytics_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showSuccess(`${format} report downloaded successfully`);
        } else if (format === 'PDF' && result.success && result.data.html_content) {
            // Download HTML content that can be printed to PDF
            const blob = new Blob([result.data.html_content], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.data.filename || `hr_analytics_${activeTab}_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showSuccess(`${format} report downloaded successfully (HTML format - use browser print to PDF)`);
        } else {
            showSuccess(`${format} export prepared successfully`);
        }

    } catch (error) {
        console.error('Error exporting data:', error);
        showError(`Failed to export ${format} report`);
    }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Format number with commas and decimals
 */
function formatNumber(value, decimals = 0) {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Show success message with toast notification
 */
function showSuccess(message) {
    showToast(message, 'success');
}

/**
 * Load fallback analytics data when API is unavailable
 */
function loadFallbackAnalyticsData() {
    const mockData = {
        success: true,
        data: {
            overview: {
                total_employees: 156,
                active_employees: 148,
                inactive_employees: 8,
                total_departments: 12,
                total_payroll: 9600000,
                pending_claims: 8
            },
            workforce: [
                { department: 'Medical', count: 68 },
                { department: 'Operations', count: 32 },
                { department: 'Administration', count: 21 },
                { department: 'IT', count: 15 },
                { department: 'Finance', count: 12 },
                { department: 'HR', count: 8 }
            ],
            payroll: {
                total_gross: 9600000,
                total_deductions: 1200000,
                total_net: 8400000,
                average_salary: 61538
            },
            benefits: {
                enrolled_employees: 156,
                active_plans: 5,
                total_claims_value: 2500000,
                pending_claims_value: 450000
            }
        }
    };

    const result = mockData;
    const data = result.data;

    // Populate KPI cards with fallback data
    if (document.getElementById('total-emp')) {
        document.getElementById('total-emp').textContent = data.overview.total_employees.toLocaleString('en-PH');
    }
    if (document.getElementById('active-emp')) {
        document.getElementById('active-emp').textContent = data.overview.active_employees.toLocaleString('en-PH');
    }
    if (document.getElementById('total-payroll')) {
        document.getElementById('total-payroll').textContent = '₱' + (data.overview.total_payroll / 1000000).toFixed(1) + 'M';
    }
    if (document.getElementById('hmo-enroll')) {
        document.getElementById('hmo-enroll').textContent = data.overview.total_employees.toLocaleString('en-PH');
    }
    if (document.getElementById('active-plans')) {
        document.getElementById('active-plans').textContent = '5';
    }
    if (document.getElementById('pending-claims')) {
        document.getElementById('pending-claims').textContent = data.overview.pending_claims.toLocaleString('en-PH');
    }

    // Populate Workforce table (fallback)
    let workforceHtml = '';
    for (let dept of data.workforce) {
        workforceHtml += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px; color: #374151;">${dept.department}</td>
                <td style="padding: 12px; text-align: right; color: #374151; font-weight: 500;">${dept.count}</td>
            </tr>
        `;
    }
    if (document.getElementById('workforce-table')) {
        document.getElementById('workforce-table').innerHTML = workforceHtml;
    }

    // Populate Payroll Summary (fallback)
    if (document.getElementById('payroll-gross')) {
        document.getElementById('payroll-gross').textContent = '₱' + data.payroll.total_gross.toLocaleString('en-PH');
    }
    if (document.getElementById('payroll-deductions')) {
        document.getElementById('payroll-deductions').textContent = '₱' + data.payroll.total_deductions.toLocaleString('en-PH');
    }
    if (document.getElementById('payroll-avg')) {
        document.getElementById('payroll-avg').textContent = '₱' + data.payroll.average_salary.toLocaleString('en-PH');
    }

    // Populate Benefits Summary (fallback)
    if (document.getElementById('benefits-enrolled')) {
        document.getElementById('benefits-enrolled').textContent = data.benefits.enrolled_employees.toLocaleString('en-PH');
    }
    if (document.getElementById('benefits-plans')) {
        document.getElementById('benefits-plans').textContent = data.benefits.active_plans.toLocaleString('en-PH');
    }
    if (document.getElementById('benefits-claims')) {
        document.getElementById('benefits-claims').textContent = '₱' + (data.benefits.total_claims_value / 1000000).toFixed(1) + 'M';
    }

    showError('Live analytics are temporarily unavailable. Showing static demo data instead.');
}

/**
 * Show error message with toast notification
 */
function showError(message) {
    showToast(message, 'error');
}

/**
 * Display a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of notification: 'success', 'error', 'info', 'warning'
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px;';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ';
    
    toast.style.cssText = `
        background: ${bgColor};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        max-width: 300px;
        font-size: 14px;
        line-height: 1.5;
        animation: slideIn 0.3s ease-in-out;
    `;
    toast.textContent = `${icon} ${message}`;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations for toast notifications
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Report Generation Functions
 */
function generateEmployeeReport() {
    const reportContent = document.getElementById('report-content');
    if (reportContent) {
        reportContent.innerHTML = `
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 12px 0; color: #1f2937;">Employee Report - Generated on ${new Date().toLocaleDateString()}</h4>
                <p style="color: #6b7280; margin: 0 0 8px 0;">Total Employees: 156 | Active: 148 | Inactive: 8</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                    <thead>
                        <tr style="background: #e5e7eb;">
                            <th style="padding: 8px; text-align: left;">Department</th>
                            <th style="padding: 8px; text-align: right;">Count</th>
                            <th style="padding: 8px; text-align: right;">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px;">Medical</td><td style="padding: 8px; text-align: right;">68</td><td style="padding: 8px; text-align: right;">43.6%</td></tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px;">Operations</td><td style="padding: 8px; text-align: right;">32</td><td style="padding: 8px; text-align: right;">20.5%</td></tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px;">Administration</td><td style="padding: 8px; text-align: right;">21</td><td style="padding: 8px; text-align: right;">13.5%</td></tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px;">IT</td><td style="padding: 8px; text-align: right;">15</td><td style="padding: 8px; text-align: right;">9.6%</td></tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px;">Finance</td><td style="padding: 8px; text-align: right;">12</td><td style="padding: 8px; text-align: right;">7.7%</td></tr>
                        <tr><td style="padding: 8px;">HR</td><td style="padding: 8px; text-align: right;">8</td><td style="padding: 8px; text-align: right;">5.1%</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    showError('Employee Report generated successfully');
}

function generatePayrollReport() {
    const reportContent = document.getElementById('report-content');
    if (reportContent) {
        reportContent.innerHTML = `
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 12px 0; color: #1f2937;">Payroll Report - Generated on ${new Date().toLocaleDateString()}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                        <div style="font-size: 12px; color: #6b7280;">Total Gross Payroll</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">₱9,600,000</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #10b981;">
                        <div style="font-size: 12px; color: #6b7280;">Total Deductions</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">₱1,200,000</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                        <div style="font-size: 12px; color: #6b7280;">Average Salary</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">₱61,538</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
                        <div style="font-size: 12px; color: #6b7280;">Total Net Pay</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">₱8,400,000</div>
                    </div>
                </div>
            </div>
        `;
    }
    showError('Payroll Report generated successfully');
}

function generateBenefitsReport() {
    const reportContent = document.getElementById('report-content');
    if (reportContent) {
        reportContent.innerHTML = `
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 12px 0; color: #1f2937;">Benefits Report - Generated on ${new Date().toLocaleDateString()}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                        <div style="font-size: 12px; color: #6b7280;">Enrolled Employees</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">156</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #10b981;">
                        <div style="font-size: 12px; color: #6b7280;">Active Plans</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">5</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                        <div style="font-size: 12px; color: #6b7280;">Total Claims Value</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">₱2.5M</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
                        <div style="font-size: 12px; color: #6b7280;">Pending Claims</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">8</div>
                    </div>
                </div>
            </div>
        `;
    }
    showError('Benefits Report generated successfully');
}

function generateAttendanceReport() {
    const reportContent = document.getElementById('report-content');
    if (reportContent) {
        reportContent.innerHTML = `
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 12px 0; color: #1f2937;">Attendance Report - Generated on ${new Date().toLocaleDateString()}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                        <div style="font-size: 12px; color: #6b7280;">Present This Month</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">145</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #10b981;">
                        <div style="font-size: 12px; color: #6b7280;">On Leave</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">8</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                        <div style="font-size: 12px; color: #6b7280;">Absent</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">3</div>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
                        <div style="font-size: 12px; color: #6b7280;">Attendance Rate</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">96.8%</div>
                    </div>
                </div>
            </div>
        `;
    }
    showError('Attendance Report generated successfully');
}

function generateComplianceReport() {
    const reportContent = document.getElementById('report-content');
    if (reportContent) {
        reportContent.innerHTML = `
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 12px 0; color: #1f2937;">Compliance Report - Generated on ${new Date().toLocaleDateString()}</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #e5e7eb;">
                            <th style="padding: 8px; text-align: left;">Compliance Item</th>
                            <th style="padding: 8px; text-align: left;">Status</th>
                            <th style="padding: 8px; text-align: left;">Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px;">BIR Filing</td><td style="padding: 8px;"><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Completed</span></td><td style="padding: 8px;">2026-01-31</td></tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px;">SSS Contributions</td><td style="padding: 8px;"><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Completed</span></td><td style="padding: 8px;">2026-02-10</td></tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px;">Health Insurance</td><td style="padding: 8px;"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Due Soon</span></td><td style="padding: 8px;">2026-02-15</td></tr>
                        <tr><td style="padding: 8px;">Payroll Audit</td><td style="padding: 8px;"><span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Pending</span></td><td style="padding: 8px;">2026-03-31</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    showError('Compliance Report generated successfully');
}

