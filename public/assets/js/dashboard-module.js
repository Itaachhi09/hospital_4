/**
 * Dashboard Module
 * Handles display of summary information and key metrics on the dashboard.
 * v2.0 - Converted to REST API, modern Tailwind dashboard integration
 * - Displays role-based dashboard summaries
 * - Updates stat cards with real-time data
 * - Renders Chart.js visualizations for analytics
 * - Employee quick actions integration
 */

// API Configuration
const API_BASE_URL = window.API_BASE_URL || '/hospital_4/api';
const REST_API_URL = `${API_BASE_URL}/`;

// --- DOM Element References ---
let mainContentArea;
let dashboardSummaryContainer;
let dashboardChartsContainer;
let dashboardQuickActionsContainer;

// Store chart instances to destroy them before re-rendering
let employeeStatusChartInstance = null;
let leaveRequestsChartInstance = null;
let departmentDistributionChartInstance = null;
let myLeaveSummaryChartInstance = null;

/**
 * Initializes dashboard elements
 */
function initializeDashboardElements() {
    mainContentArea = document.getElementById('main-content-area');
    if (!mainContentArea) {
        console.error("Dashboard Module: main-content-area not found!");
        return false;
    }
    return true;
}

/**
 * Displays the dashboard with role-based content
 */
export async function displayDashboardSection() {
    console.log("[Dashboard] Displaying Dashboard Section...");
    if (!initializeDashboardElements()) return;

    // Get user data from window or localStorage
    let user = window.currentUser || JSON.parse(localStorage.getItem('userData') || '{}');
    
    console.log("[Dashboard] User data retrieved:", user);
    
    // Handle both role_name and role properties
    const userRole = user.role_name || user.role;
    
    if (!user || !userRole) {
        mainContentArea.innerHTML = '<p style="color: #ef4444; padding: 16px;">Error: User role not found. Please login again.</p>';
        console.error("Dashboard Error: User role not found.", user);
        return;
    }
    
    console.log("[Dashboard] Current user:", user, "Role:", userRole);

    try {
        // Fetch dashboard data from REST API
        // Try simple path first: /api/dashboard
        let apiUrl = `${REST_API_URL}dashboard?role=${encodeURIComponent(userRole)}`;
        console.log(`[Dashboard] Fetching data from: ${apiUrl}`);
        
        let response = await fetch(apiUrl, { credentials: 'include' });
        
        // If 404, try versioned path
        if (response.status === 404) {
            apiUrl = `${REST_API_URL}v1/dashboard?role=${encodeURIComponent(userRole)}`;
            console.log(`[Dashboard] Trying versioned endpoint: ${apiUrl}`);
            response = await fetch(apiUrl, { credentials: 'include' });
        }
        
        const responseText = await response.text();
        
        console.log(`[Dashboard] Response status: ${response.status}, text length: ${responseText.length}`);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error("[Dashboard] Response text:", responseText.substring(0, 500));
            throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
        
        if (!response.ok) {
            throw new Error(result.error || result.message || `HTTP ${response.status}`);
        }
        
        if (!result.success || !result.data) {
            throw new Error('Invalid response format: missing success or data field');
        }
        
        const dashboardData = result.data;
        console.log("[Dashboard] Dashboard data loaded:", dashboardData);

        // Render the dashboard with fetched data
        renderDashboard(dashboardData, userRole);
        
    } catch (error) {
        console.error('[Dashboard] Error loading dashboard:', error);
        mainContentArea.innerHTML = `
            <div style="padding: 20px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; color: #92400e;">
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">⚠️ Dashboard Error</div>
                <p style="margin: 8px 0;">${error.message}</p>
                <p style="margin: 8px 0; font-size: 14px;">The dashboard data could not be loaded. Please ensure the database is running and try again.</p>
            </div>
        `;
    }
}

/**
 * Render the complete dashboard
 */
function renderDashboard(data, userRole) {
    mainContentArea.innerHTML = `
        <div style="padding: 20px;">
            <!-- Dashboard Header -->
            <div style="margin-bottom: 24px;">
                <h1 style="font-size: 28px; font-weight: bold; color: #ffffff; margin-bottom: 4px;">Dashboard</h1>
                <p style="color: #cbd5e1;">Welcome back! Here's your system overview</p>
            </div>

            <!-- Summary Stats Grid -->
            <div id="dashboard-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
                <!-- Stats will be rendered here -->
            </div>

            <!-- Charts and Additional Content -->
            <div id="dashboard-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
                <!-- Charts will be rendered here -->
            </div>

            <!-- Quick Actions for Employees -->
            <div id="dashboard-quick-actions" style="margin-top: 24px;">
                <!-- Quick actions will be rendered here -->
            </div>
        </div>
    `;

    // Render statistics
    renderStats(data, userRole);

    // Render charts and additional content
    renderCharts(data, userRole);

    // Render quick actions if employee
    if (userRole === 'Employee') {
        renderEmployeeQuickActions();
    }
}

/**
 * Render summary statistics cards
 */
function renderStats(data, userRole) {
    const statsContainer = document.getElementById('dashboard-stats');
    if (!statsContainer) {
        console.error('[Dashboard] Stats container not found');
        return;
    }
    
    // Use either data.stats or data.overview depending on API response format
    const stats_data = data.stats || data.overview || {};
    console.log('[Dashboard] Rendering stats with data:', stats_data);

    const stats = [];

    if (userRole === 'System Admin' || userRole === 'admin' || userRole === 'HR Admin' || userRole === 'HR Manager') {
        // Admin view stats
        stats.push({
            label: 'Total Employees',
            value: stats_data.total_employees || 0,
            icon: '👥',
            bgColor: '#667eea'
        });
        stats.push({
            label: 'On Leave',
            value: stats_data.on_leave_employees || 0,
            icon: '📅',
            bgColor: '#f59e0b'
        });
        stats.push({
            label: 'Pending Requests',
            value: stats_data.pending_requests || 0,
            icon: '📋',
            bgColor: '#ef4444'
        });
        stats.push({
            label: 'Active Payroll Runs',
            value: stats_data.active_payroll_runs || 0,
            icon: '💰',
            bgColor: '#10b981'
        });
    } else if (userRole === 'Employee') {
        // Employee view stats
        stats.push({
            label: 'Total Employees',
            value: stats_data.total_employees || 0,
            icon: '👥',
            bgColor: '#3b82f6'
        });
        stats.push({
            label: 'On Leave',
            value: stats_data.on_leave_employees || 0,
            icon: '📅',
            bgColor: '#f59e0b'
        });
        stats.push({
            label: 'Active Payroll',
            value: stats_data.active_payroll_runs || 0,
            icon: '💳',
            bgColor: '#8b5cf6'
        });
        stats.push({
            label: 'Departments',
            value: (data.charts?.department_distribution?.length || 0),
            icon: '🏢',
            bgColor: '#06b6d4'
        });
    }

    statsContainer.innerHTML = stats.map(stat => `
        <div style="background: ${stat.bgColor}; color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; margin-bottom: 8px;">${stat.icon}</div>
            <p style="font-size: 12px; opacity: 0.9; margin-bottom: 8px; font-weight: 500;">${stat.label}</p>
            <p style="font-size: 32px; font-weight: bold;">${stat.value}</p>
        </div>
    `).join('');
}

/**
 * Render charts and analytics
 */
function renderCharts(data, userRole) {
    const chartsContainer = document.getElementById('dashboard-content');
    if (!chartsContainer) return;

    // Destroy previous chart instances
    destroyChartInstances();

    if (userRole === 'System Admin' || userRole === 'admin' || userRole === 'HR Admin' || userRole === 'HR Manager') {
        chartsContainer.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-height: 350px; overflow: hidden;">
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">Employee Status Distribution</h3>
                <div style="position: relative; height: 250px;">
                    <canvas id="employee-status-chart"></canvas>
                </div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-height: 350px; overflow: hidden;">
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">Department Distribution</h3>
                <div style="position: relative; height: 250px;">
                    <canvas id="department-chart"></canvas>
                </div>
            </div>
        `;

        // Render employee status chart
        if (data.charts?.employee_status && Array.isArray(data.charts.employee_status)) {
            renderEmployeeStatusChart(data.charts.employee_status);
        }

        // Render department distribution chart
        if (data.charts?.department_distribution && Array.isArray(data.charts.department_distribution)) {
            renderDepartmentChart(data.charts.department_distribution);
        }
    } else if (userRole === 'Employee') {
        chartsContainer.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-height: 350px; overflow: hidden;">
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">Company Overview</h3>
                <div style="position: relative; height: 250px;">
                    <canvas id="employee-status-chart"></canvas>
                </div>
            </div>
        `;

        if (data.charts?.employee_status && Array.isArray(data.charts.employee_status)) {
            renderEmployeeStatusChart(data.charts.employee_status);
        }
    }
}

/**
 * Render Employee Status Chart
 */
function renderEmployeeStatusChart(statusData) {
    const ctx = document.getElementById('employee-status-chart');
    if (!ctx) return;

    const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];
    const labels = statusData.map(item => item.status || 'Unknown');
    const counts = statusData.map(item => item.count || 0);
    
    employeeStatusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, labels.length),
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
                }
            }
        }
    });
}

/**
 * Render Department Chart
 */
function renderDepartmentChart(deptData) {
    const ctx = document.getElementById('department-chart');
    if (!ctx) return;

    const labels = deptData.map(item => item.department || 'Unknown');
    const counts = deptData.map(item => item.count || 0);

    departmentDistributionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Employees',
                data: counts,
                backgroundColor: '#594423',
                borderColor: '#4E3B2A',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Render My Leave Summary Chart
 */
function renderMyLeaveSummaryChart(chartData) {
    const ctx = document.getElementById('my-leave-chart');
    if (!ctx) return;

    myLeaveSummaryChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels || [],
            datasets: [{
                label: 'Days',
                data: chartData.data || [],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                borderColor: '#1f2937',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Render Employee Quick Actions
 */
function renderEmployeeQuickActions() {
    const quickActionsContainer = document.getElementById('dashboard-quick-actions');
    if (!quickActionsContainer) return;

    quickActionsContainer.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">Quick Actions</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                <button id="quick-action-view-profile" style="padding: 12px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px; justify-content: center;">
                    <span>👤</span>
                    <span>View Profile</span>
                </button>
                <button id="quick-action-submit-leave" style="padding: 12px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px; justify-content: center;">
                    <span>📅</span>
                    <span>Submit Leave</span>
                </button>
                <button id="quick-action-submit-claim" style="padding: 12px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px; justify-content: center;">
                    <span>💳</span>
                    <span>Submit Claim</span>
                </button>
                <button id="quick-action-view-payslips" style="padding: 12px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px; justify-content: center;">
                    <span>📄</span>
                    <span>View Payslips</span>
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('quick-action-view-profile')?.addEventListener('click', () => {
        navigateToSection('profile');
    });

    document.getElementById('quick-action-submit-leave')?.addEventListener('click', () => {
        // Navigate to leave requests - adjust based on your menu structure
        const leaveLink = document.querySelector('[data-section="leave-requests"]');
        if (leaveLink) leaveLink.click();
    });

    document.getElementById('quick-action-submit-claim')?.addEventListener('click', () => {
        // Navigate to claims - adjust based on your menu structure
        const claimLink = document.querySelector('[data-section="submit-claim"]');
        if (claimLink) claimLink.click();
    });

    document.getElementById('quick-action-view-payslips')?.addEventListener('click', () => {
        // Navigate to payslips
        navigateToSection('payslips');
    });
}

/**
 * Destroy all chart instances
 */
function destroyChartInstances() {
    if (employeeStatusChartInstance) {
        employeeStatusChartInstance.destroy();
        employeeStatusChartInstance = null;
    }
    if (leaveRequestsChartInstance) {
        leaveRequestsChartInstance.destroy();
        leaveRequestsChartInstance = null;
    }
    if (departmentDistributionChartInstance) {
        departmentDistributionChartInstance.destroy();
        departmentDistributionChartInstance = null;
    }
    if (myLeaveSummaryChartInstance) {
        myLeaveSummaryChartInstance.destroy();
        myLeaveSummaryChartInstance = null;
    }
}

/**
 * Get Mock Dashboard Data - Fallback when API endpoint not available
 */
function getMockDashboardData(userRole) {
    console.log("[Mock Data] Generating mock dashboard data for role:", userRole);
    
    if (userRole === 'System Admin' || userRole === 'admin' || userRole === 'HR Admin' || userRole === 'HR Manager') {
        return {
            overview: {
                total_employees: 156,
                active_employees: 148,
                pending_leave_requests: 12,
                recent_hires_last_30_days: 8
            },
            charts: {
                employee_status: {
                    labels: ["Active", "Inactive", "On Leave"],
                    data: [148, 6, 2]
                },
                departments: {
                    labels: ["IT", "HR", "Finance", "Operations", "Marketing"],
                    data: [38, 22, 25, 42, 29]
                },
                salary_range: {
                    labels: ["0-30K", "30-50K", "50-75K", "75-100K", "100K+"],
                    data: [15, 38, 52, 35, 16]
                }
            },
            data: {
                recent_employees: [
                    { name: "John Smith", position: "Software Engineer", joining_date: "2024-01-15" },
                    { name: "Sarah Johnson", position: "HR Manager", joining_date: "2024-01-10" },
                    { name: "Mike Davis", position: "Data Analyst", joining_date: "2024-01-05" }
                ]
            }
        };
    } else if (userRole === 'Employee') {
        return {
            overview: {
                my_leave_balance: 18,
                my_pending_leaves: 2,
                my_pending_reimbursements: 1,
                my_pending_approvals: 0
            },
            charts: {
                my_leave_summary: {
                    labels: ["Used", "Remaining", "Pending"],
                    data: [7, 18, 2]
                },
                monthly_attendance: {
                    labels: ["Present", "Absent", "Half Day"],
                    data: [20, 1, 2]
                }
            },
            data: {
                quick_actions: [
                    { id: 1, title: "Apply Leave", icon: "calendar" },
                    { id: 2, title: "Submit Reimbursement", icon: "receipt" },
                    { id: 3, title: "View Payslip", icon: "file" },
                    { id: 4, title: "Update Profile", icon: "user" }
                ]
            }
        };
    } else {
        // Default mock data
        return {
            overview: {},
            charts: {},
            data: {}
        };
    }
}

/**
 * Handle API response
 */
async function handleApiResponse(response) {
    const contentType = response.headers.get("content-type");
    let data;

    const rawText = await response.text().catch(e => {
        console.error("[API Response] Error reading response text:", e);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}. Failed to read response body.`);
        }
        return "[[Failed to read response body]]";
    });

    console.log(`[API Response] Status ${response.status}:`, rawText.substring(0, 500) + (rawText.length > 500 ? "..." : ""));

    if (!response.ok) {
        let errorPayload = { error: `HTTP error! Status: ${response.status}` };
        if (contentType && contentType.includes("application/json")) {
            try {
                data = JSON.parse(rawText);
                errorPayload.error = data.error || data.message || errorPayload.error;
                errorPayload.details = data.details;
            } catch (jsonError) {
                console.error("[API Response] Failed to parse JSON error response:", jsonError);
                errorPayload.error += ` (Non-JSON error response)`;
            }
        }
        const error = new Error(errorPayload.error);
        error.details = errorPayload.details;
        throw error;
    }

    try {
        if (response.status === 204) {
            console.log("[API Response] Received 204 No Content");
            return { message: "Operation completed successfully" };
        }
        if (!rawText || !rawText.trim()) {
            console.warn("[API Response] Response body was empty");
            return {};
        }
        try {
            data = JSON.parse(rawText);
            console.log("[API Response] Successfully parsed JSON data");
            return data;
        } catch (jsonError) {
            console.error("[API Response] Failed to parse response as JSON:", jsonError);
            throw new Error("Failed to parse response as JSON");
        }
    } catch (e) {
        console.error("[API Response] Error processing response:", e);
        throw e;
    }
}
