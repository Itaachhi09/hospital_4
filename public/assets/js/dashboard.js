/**
 * Dashboard JavaScript
 * Handles navigation and data loading for the dashboard
 */

function setupMenuNavigation() {
    // Get all menu items (both nav-items from MAIN section and menu-items from MODULES)
    const allNavItems = document.querySelectorAll('.menu-item, .nav-item');
    console.log('[Navigation] Setting up event listeners for', allNavItems.length, 'menu items');
    
    allNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            console.log('[Navigation] Clicked item with section:', section);
            
            if (section) {
                navigateToSection(section);
            }
        });
    });
}

function navigateToSection(sectionId) {
    console.log('[Navigation] Navigating to section:', sectionId);
    
    // Hide all sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
        console.log('[Navigation] Showed section:', sectionId);
    } else {
        console.warn('[Navigation] Section not found:', sectionId);
    }
    
    // Update active menu item (both nav-items and menu-items)
    const allNavItems = document.querySelectorAll('.menu-item, .nav-item');
    allNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Load section-specific data
    loadSectionData(sectionId);
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'bonuses':
            loadPayrollBonuses();
            break;
        case 'deductions':
            loadPayrollDeductions();
            break;
        case 'payroll-runs':
            loadPayrollRuns();
            break;
        case 'payslips':
            loadPayslips();
            break;
        case 'salaries':
            loadSalaries();
            break;
        case 'hmo-providers':
            loadHMOProviders();
            break;
        case 'hmo-plans':
            loadHMOPlans();
            break;
        case 'hmo-enrollments':
            loadHMOEnrollments();
            break;
        case 'hmo-claims':
            loadHMOClaims();
            break;
        case 'compensation':
            loadCompensation();
            break;
        case 'comp-plans':
            loadCompensationPlans();
            break;
        case 'comp-adjustments':
            loadCompensationAdjustments();
            break;
        case 'comp-incentives':
            loadCompensationIncentives();
            break;
        case 'comp-bonds':
            loadCompensationBonds();
            break;
        case 'hrcore-employees':
            loadHRCoreEmployees();
            break;
        case 'hrcore-documents':
            loadHRCoreDocuments();
            break;
        case 'hmo':
            loadHMO();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'analytics-dashboard':
            loadAnalyticsDashboard();
            break;
        case 'analytics-reports':
            loadAnalyticsReports();
            break;
        case 'analytics-metrics':
            loadAnalyticsMetrics();
            break;
    }
}

function loadUserData() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            updateUserDisplay(user);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

function updateUserDisplay(user) {
    // Update header user display
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.querySelector('.user-role');
    const avatar = document.querySelector('.avatar');
    
    if (headerUserName) headerUserName.textContent = user.name || 'User';
    if (headerUserRole) headerUserRole.textContent = user.role || 'user';
    if (avatar) avatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
    
    // Update profile section
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const profileRoleDisplay = document.getElementById('profileRoleDisplay');
    const profileEmail = document.getElementById('profileEmail');
    const editUsername = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    
    if (profileName) profileName.textContent = user.name || 'User';
    if (profileRole) profileRole.textContent = formatRole(user.role);
    if (profileRoleDisplay) profileRoleDisplay.textContent = formatRole(user.role);
    if (profileEmail) profileEmail.textContent = user.email || 'N/A';
    if (editUsername) editUsername.value = user.name || '';
    if (editEmail) editEmail.value = user.email || '';
}

function formatRole(role) {
    if (!role) return 'User';
    return role.replace(/_/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

async function loadDashboardData() {
    console.log('Loading dashboard data...');
    // Import and display dashboard section with real data from REST API
    import('./dashboard-module.js?v=2.5').then(module => {
        module.displayDashboardSection();
    }).catch(err => {
        console.error('Failed to load dashboard module:', err);
        const container = document.getElementById('main-content-area');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading dashboard. Please try again.</div>';
        }
    });
}

async function loadNotifications() {
    console.log('Loading notifications...');
    // Import and display notifications section
    import('./notifications-module.js?v=1.0').then(module => {
        module.displayNotificationsSection();
    }).catch(err => {
        console.error('Failed to load notifications module:', err);
        const container = document.getElementById('main-content-area');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading notifications. Please try again.</div>';
        }
    });
}

async function loadPayrollBonuses() {
    console.log('Loading Payroll - Bonuses...');
    // Import and display Payroll bonuses section
    import('./payroll.js?v=2.5').then(module => {
        module.displayBonusesSection();
    }).catch(err => {
        console.error('Failed to load Payroll bonuses module:', err);
        const container = document.getElementById('bonusesContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading bonuses module</div>';
        }
    });
}

async function loadPayrollDeductions() {
    console.log('Loading Payroll - Deductions...');
    // Import and display Payroll deductions section
    import('./payroll.js?v=2.5').then(module => {
        module.displayDeductionsSection();
    }).catch(err => {
        console.error('Failed to load Payroll deductions module:', err);
        const container = document.getElementById('deductionsContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading deductions module</div>';
        }
    });
}

async function loadPayrollRuns() {
    console.log('Loading Payroll - Runs...');
    // Import and display Payroll runs section
    import('./payroll.js?v=2.5').then(module => {
        module.displayPayrollRunsSection();
    }).catch(err => {
        console.error('Failed to load Payroll runs module:', err);
        const container = document.getElementById('payrollRunsContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading payroll runs module</div>';
        }
    });
}

async function loadPayslips() {
    console.log('Loading Payroll - Payslips...');
    // Import and display Payslips section
    import('./payslips.js?v=2.5').then(module => {
        module.displayPayslipsSection();
    }).catch(err => {
        console.error('Failed to load Payslips module:', err);
        const container = document.getElementById('payslipsContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading payslips module</div>';
        }
    });
}

async function loadSalaries() {
    console.log('Loading Payroll - Salaries...');
    // Import and display Salaries section
    import('./salaries.js?v=2.5').then(module => {
        module.displaySalariesSection();
    }).catch(err => {
        console.error('Failed to load Salaries module:', err);
        const container = document.getElementById('salariesContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading salaries module</div>';
        }
    });
}

async function loadHMOProviders() {
    console.log('Loading HMO - Providers...');
    // Import and display HMO Providers section
    import('./hmo.js?v=2.1').then(module => {
        module.displayHMOProvidersSection();
    }).catch(err => {
        console.error('Failed to load HMO Providers module:', err);
        const container = document.getElementById('hmoProvidersContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading HMO providers module</div>';
        }
    });
}

async function loadHMOPlans() {
    console.log('Loading HMO - Plans...');
    // Import and display HMO Plans section
    import('./hmo.js?v=2.1').then(module => {
        module.displayHMOPlansSection();
    }).catch(err => {
        console.error('Failed to load HMO Plans module:', err);
        const container = document.getElementById('hmoPlansContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading HMO plans module</div>';
        }
    });
}

async function loadHMOEnrollments() {
    console.log('Loading HMO - Enrollments...');
    // Import and display HMO Enrollments section
    import('./enrollments.js?v=2.1').then(module => {
        module.displayHMOEnrollmentsSection();
    }).catch(err => {
        console.error('Failed to load HMO Enrollments module:', err);
        const container = document.getElementById('hmoEnrollmentsContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading HMO enrollments module</div>';
        }
    });
}

async function loadHMOClaims() {
    console.log('Loading HMO - Claims...');
    // Import and display HMO Claims section
    import('./claims.js?v=2.1').then(module => {
        module.displayHMOClaimsSection();
    }).catch(err => {
        console.error('Failed to load HMO Claims module:', err);
        const container = document.getElementById('hmoClaimsContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading HMO claims module</div>';
        }
    });
}

function loadPayroll() {
    const container = document.getElementById('payrollContainer');
    if (container) {
        container.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; color: #0f1f3d;">
                <p>Payroll management will be loaded here</p>
                <button class="btn btn-primary" style="margin-top: 10px;">➕ Create Payroll Run</button>
            </div>
        `;
    }
}

async function loadHRCoreEmployees() {
    console.log('Loading HR Core - Employees...');
    // Import and display HR Core Employees section
    import('./hrcore-employees.js?v=2.5').then(module => {
        module.displayEmployeesSection();
    }).catch(err => {
        console.error('Failed to load HR Core Employees module:', err);
        const container = document.getElementById('employeesContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading employees module</div>';
        }
    });
}

async function loadHRCoreDocuments() {
    console.log('Loading HR Core - Documents...');
    // Import and display HR CORE Document Library
    import('./hrcore-documents.js?v=2.5').then(module => {
        module.displayHRCoreDocumentLibrary();
    }).catch(err => {
        console.error('Failed to load HR Core Documents module:', err);
        const container = document.getElementById('employeeDocumentsContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading documents module</div>';
        }
    });
}

function loadCompensation() {
    console.log('Loading Compensation Section...');
    // Import and display compensation module
    import('./compensation-module.js?v=2.5').then(module => {
        module.displayCompensationSection();
    }).catch(err => {
        console.error('Failed to load compensation module:', err);
        const container = document.getElementById('compensationContainer');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading compensation module. Please try again.</div>';
        }
    });
}

function loadHMO() {
    const container = document.getElementById('hmoContainer');
    if (container) {
        container.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; color: #0f1f3d;">
                <p>HMO & health insurance management will be loaded here</p>
                <button class="btn btn-primary" style="margin-top: 10px;">⚙️ Manage Plans</button>
            </div>
        `;
    }
}

function loadAnalytics() {
    const container = document.getElementById('analyticsContainer');
    if (container) {
        container.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; color: #0f1f3d;">
                <p>Analytics & reports will be loaded here</p>
                <button class="btn btn-primary" style="margin-top: 10px;">📊 Generate Report</button>
            </div>
        `;
    }
}

async function loadAnalyticsDashboard() {
    console.log('Loading Analytics Dashboard...');
    
    // First check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!authToken || !userData.id) {
        console.warn('User not authenticated, redirecting to login');
        window.location.href = '/hospital_4/public/login.html';
        return;
    }
    
    console.log('User authenticated:', userData.email, 'Role:', userData.role_name || userData.role);
    
    // Import and display Analytics Dashboard section
    import('./analytics.js?v=2.5').then(module => {
        module.displayAnalyticsDashboardsSection().catch(err => {
            console.error('Error in displayAnalyticsDashboardsSection:', err);
            const container = document.getElementById('main-content-area');
            if (container) {
                container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading analytics dashboard: ' + err.message + '</div>';
            }
        });
    }).catch(err => {
        console.error('Failed to load Analytics Dashboard module:', err);
        const container = document.getElementById('main-content-area');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading analytics dashboard. Please try again.</div>';
        }
    });
}

async function loadAnalyticsReports() {
    console.log('Loading Analytics Reports...');
    // Import and display Analytics Reports section
    import('./analytics.js?v=2.5').then(module => {
        module.displayAnalyticsReportsSection().catch(err => {
            console.error('Error in displayAnalyticsReportsSection:', err);
            const container = document.getElementById('main-content-area');
            if (container) {
                container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading analytics reports: ' + err.message + '</div>';
            }
        });
    }).catch(err => {
        console.error('Failed to load Analytics Reports module:', err);
        const container = document.getElementById('main-content-area');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading analytics reports. Please try again.</div>';
        }
    });
}

async function loadAnalyticsMetrics() {
    console.log('Loading Analytics Metrics...');
    // Import and display Analytics Metrics section
    import('./analytics.js?v=2.5').then(module => {
        module.displayAnalyticsMetricsSection().catch(err => {
            console.error('Error in displayAnalyticsMetricsSection:', err);
            const container = document.getElementById('main-content-area');
            if (container) {
                container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading analytics metrics: ' + err.message + '</div>';
            }
        });
    }).catch(err => {
        console.error('Failed to load Analytics Metrics module:', err);
        const container = document.getElementById('main-content-area');
        if (container) {
            container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Error loading analytics metrics. Please try again.</div>';
        }
    });
}

function navigateToProfile() {
    navigateToSection('profile');
}

function navigateToDashboard() {
    navigateToSection('dashboard');
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar-menu');
    if (sidebar) {
        sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleMenuSection(element) {
    // Toggle the active/expanded state of a menu section
    if (element && element.parentElement) {
        const section = element.parentElement;
        section.classList.toggle('collapsed');
        section.classList.toggle('expanded');
        
        // Also toggle visibility of the submenu items
        const submenu = section.querySelector('.menu-items');
        if (submenu) {
            submenu.style.display = submenu.style.display === 'none' ? 'block' : 'none';
        }
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

/**
 * Notification Bell Functions
 */
async function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
        dropdown.style.display = 'block';
        loadDropdownNotifications();
        
        // Close when clicking outside
        document.addEventListener('click', closeNotificationDropdown);
    } else {
        closeNotificationDropdown();
    }
}

function closeNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.style.display = 'none';
    document.removeEventListener('click', closeNotificationDropdown);
}

async function loadDropdownNotifications() {
    try {
        const response = await fetch('/hospital_4/api/notifications/?per_page=5&filter=all');
        const result = await response.json();

        if (result.success) {
            const listContainer = document.getElementById('dropdownNotificationsList');
            const badge = document.getElementById('notificationBadge');
            
            // Update badge
            if (result.unread_count > 0) {
                badge.textContent = result.unread_count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }

            if (result.data.length === 0) {
                listContainer.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #cbd5e1;">
                        <p style="margin: 0;">📭 No notifications</p>
                    </div>
                `;
            } else {
                listContainer.innerHTML = result.data.map(notif => `
                    <div style="
                        padding: 12px;
                        border-bottom: 1px solid #334155;
                        cursor: pointer;
                        transition: all 0.2s;
                        background: ${notif.read ? 'transparent' : 'rgba(59, 130, 246, 0.1)'};
                    " onmouseover="this.style.background='rgba(59, 130, 246, 0.15)'" onmouseout="this.style.background='${notif.read ? 'transparent' : 'rgba(59, 130, 246, 0.1)'}'">
                        <div style="display: flex; gap: 10px; align-items: flex-start;">
                            <span style="font-size: 20px;">${notif.icon}</span>
                            <div style="flex: 1;">
                                <div style="
                                    font-weight: 600;
                                    color: #ffffff;
                                    font-size: 13px;
                                    display: flex;
                                    justify-content: space-between;
                                    gap: 8px;
                                ">
                                    <span>${notif.title}</span>
                                    ${!notif.read ? '<span style="background: #ef4444; width: 6px; height: 6px; border-radius: 50%; margin-top: 4px;"></span>' : ''}
                                </div>
                                <p style="
                                    color: #cbd5e1;
                                    font-size: 12px;
                                    margin: 4px 0 0 0;
                                    line-height: 1.4;
                                ">${notif.message.substring(0, 60)}...</p>
                                <span style="
                                    font-size: 11px;
                                    color: #94a3b8;
                                    display: inline-block;
                                    margin-top: 4px;
                                ">${getTimeAgo(notif.created_at)}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('[Notifications] Error loading dropdown:', error);
        document.getElementById('dropdownNotificationsList').innerHTML = `
            <div style="padding: 20px; text-align: center; color: #ef4444;">
                <p style="margin: 0;">❌ Error loading notifications</p>
            </div>
        `;
    }
}

function getTimeAgo(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return created.toLocaleDateString();
}

function goToNotificationsPage() {
    closeNotificationDropdown();
    navigateToSection('notifications');
}

// Make functions globally available
window.toggleMenuSection = toggleMenuSection;
window.logout = logout;
window.navigateToSection = navigateToSection;
window.loadSectionData = loadSectionData;
window.loadNotifications = loadNotifications;
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.closeNotificationDropdown = closeNotificationDropdown;
window.goToNotificationsPage = goToNotificationsPage;
window.loadDropdownNotifications = loadDropdownNotifications;

// Initialize when DOM is ready
function runDashboardInit() {
    console.log('%c[Dashboard] INIT START', 'color: blue; font-weight: bold; font-size: 16px;');
    
    // Helper to show debug info
    function debug(msg) {
        const panel = document.getElementById('debugPanel');
        const content = document.getElementById('debugContent');
        if (panel && content) {
            content.innerHTML += msg + '<br>';
            panel.style.display = 'block';
        }
    }
    
    try {
        // Get stored credentials
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        console.log('[Dashboard] Token in localStorage:', token ? 'YES ✓' : 'NO ✗');
        console.log('[Dashboard] User data in localStorage:', userData ? 'YES ✓' : 'NO ✗');
        
        // CRITICAL: If no token, redirect to login
        if (!token) {
            console.error('%c[Dashboard] FAIL: No token found', 'color: red; font-weight: bold;');
            debug('❌ NO TOKEN FOUND');
            localStorage.clear();
            setTimeout(() => { window.location.href = 'login.html'; }, 100);
            return false;
        }
        
        debug('✓ Token found');
        
        // CRITICAL: If no user data, redirect to login
        if (!userData) {
            console.error('%c[Dashboard] FAIL: No user data found', 'color: red; font-weight: bold;');
            debug('❌ NO USER DATA FOUND');
            localStorage.clear();
            setTimeout(() => { window.location.href = 'login.html'; }, 100);
            return false;
        }
        
        debug('✓ User data found');
        
        // Parse user data
        let user;
        try {
            user = JSON.parse(userData);
            console.log('[Dashboard] User data parsed successfully ✓');
            console.log('[Dashboard] User:', user.email);
            debug('✓ User: ' + user.email);
        } catch (parseError) {
            console.error('[Dashboard] FAIL: Invalid JSON', parseError);
            debug('❌ INVALID JSON: ' + parseError.message);
            localStorage.clear();
            setTimeout(() => { window.location.href = 'login.html'; }, 100);
            return false;
        }
        
        // Update display
        try {
            const avatarEl = document.getElementById('userAvatar');
            const nameEl = document.getElementById('headerUserName');
            const roleEl = document.getElementById('headerUserRole');
            
            if (avatarEl) avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
            if (nameEl) nameEl.textContent = user.name || 'User';
            if (roleEl) roleEl.textContent = user.role || 'N/A';
            
            console.log('[Dashboard] User display updated ✓');
            debug('✓ Display updated');
        } catch (displayError) {
            console.warn('[Dashboard] Display warning:', displayError.message);
        }
        
        // Setup menu
        try {
            if (typeof setupMenuNavigation === 'function') {
                setupMenuNavigation();
                console.log('[Dashboard] Menu setup ✓');
                debug('✓ Menu setup');
            }
        } catch (menuError) {
            console.warn('[Dashboard] Menu warning:', menuError.message);
        }
        
        console.log('%c[Dashboard] ✓✓✓ INIT COMPLETE ✓✓✓', 'color: green; font-weight: bold;');
        debug('✓✓✓ INITIALIZATION COMPLETE');
        
        // Auto-load dashboard section on page load
        setTimeout(() => {
            console.log('[Dashboard] Auto-loading dashboard section...');
            navigateToSection('dashboard');
        }, 300);
        
        // Auto-hide debug if successful
        setTimeout(() => {
            const panel = document.getElementById('debugPanel');
            if (panel && !panel.innerHTML.includes('❌')) {
                panel.style.display = 'none';
            }
        }, 2000);
        
        return true;
        
    } catch (error) {
        console.error('%c[Dashboard] CRITICAL ERROR', 'color: red; font-weight: bold;', error);
        debug('❌ CRITICAL: ' + error.message);
        localStorage.clear();
        setTimeout(() => { window.location.href = 'login.html'; }, 100);
        return false;
    }
}

// Execute initialization
console.log('[Dashboard] Script loaded, waiting for DOM...');

if (document.readyState === 'loading') {
    console.log('[Dashboard] DOM still loading, adding DOMContentLoaded listener');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[Dashboard] DOMContentLoaded fired');
        runDashboardInit();
    });
} else {
    console.log('[Dashboard] DOM already loaded, running init immediately');
    runDashboardInit();
}
