/**
 * HR Core Module - Employee Management
 * Full CRUD operations for employee records
 */

const REST_API_URL = window.REST_API_URL || '/hospital_4/api/';
const API_BASE_URL = window.API_BASE_URL || '/hospital_4/api';

let employeesCache = [];
let departmentsCache = [];
let positionsCache = [];
let salaryGradesCache = [];
let archivedEmployeesCache = [];
let currentEmployeeTab = 'active';

// Keep only this file's content - replacing everything

/**
 * Display Employees Section
 */
export async function displayEmployeesSection() {
    console.log("[HR Core] Displaying Employees Section...");
    
    const container = document.getElementById('hrcoreEmployeesContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Employee Directory (Read-Only)</h2>
                    </div>
                    <button onclick="showArchiveModal()" style="padding: 10px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; color: #374151; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
                        📦 Archive
                    </button>
                </div>

                <!-- Employee Count & Search -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #6b7280;">
                        <span style="font-size: 18px;">👥</span>
                        <span>Total Employee: <strong id="total-employees-count">0 employees</strong></span>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                        <input type="text" id="employee-search-input" placeholder="Search employee" 
                               style="padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; min-width: 250px;"
                               onkeyup="applyEmployeeFilters()">
                        
                        <button onclick="showEmployeeFilter()" style="padding: 10px 20px; background: white; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; color: #374151;">
                            ⬇️ Filter
                        </button>
                    </div>
                </div>
            </div>

            <!-- Advanced Filters (Hidden by default) -->
            <div id="employee-filter-panel" style="padding: 15px 20px; background: #f9fafb; border-bottom: 1px solid #e2e8f0; display: none;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <select id="employee-department-filter" style="padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;" onchange="applyEmployeeFilters()">
                        <option value="">All Departments</option>
                    </select>
                    
                    <select id="employee-status-filter" style="padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;" onchange="applyEmployeeFilters()">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    
                    <button onclick="clearEmployeeFilters()" style="padding: 10px 20px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        ✕ Clear
                    </button>
                </div>
            </div>

            <!-- Employees Table -->
            <div style="padding: 0; overflow-x: auto;">
                <div id="employees-list-container">
                    <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                        <p>Loading employees...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupEmployeeEventListeners();
    await loadDepartments();
    await loadEmployees();
}

/**
 * Toggle employee tab between active and archived
 */
window.switchEmployeeTab = function(tab) {
    currentEmployeeTab = tab;
    
    // Update tab UI
    const activeTab = document.getElementById('active-employees-tab');
    const archivedTab = document.getElementById('archived-employees-tab');
    
    if (tab === 'active') {
        activeTab.style.background = 'white';
        activeTab.style.color = '#667eea';
        activeTab.style.borderBottomColor = '#667eea';
        archivedTab.style.background = '#f9fafb';
        archivedTab.style.color = '#6b7280';
        archivedTab.style.borderBottomColor = 'transparent';
        
        document.getElementById('employee-section-title').textContent = 'Employee Directory (Read-Only)';
        document.getElementById('employee-count-text').innerHTML = '👥 <span>Total Employee: <strong id="total-employees-count">0 employees</strong></span>';
    } else {
        activeTab.style.background = '#f9fafb';
        activeTab.style.color = '#6b7280';
        activeTab.style.borderBottomColor = 'transparent';
        archivedTab.style.background = 'white';
        archivedTab.style.color = '#667eea';
        archivedTab.style.borderBottomColor = '#667eea';
        
        document.getElementById('employee-section-title').textContent = 'Deleted Employees Archive';
        document.getElementById('employee-count-text').innerHTML = '📦 <span>Archived: <strong id="total-employees-count">0 employees</strong></span>';
    }
    
    renderEmployeesTable(tab === 'archived' ? archivedEmployeesCache : employeesCache);
};

/**
 * Toggle employee filter panel
 */
window.showEmployeeFilter = function() {
    const filterPanel = document.getElementById('employee-filter-panel');
    if (filterPanel) {
        filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
    }
};

/**
 * Setup event listeners
 */
function setupEmployeeEventListeners() {
    const searchInput = document.getElementById('employee-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyEmployeeFilters();
            }
        });
    }
}

/**
 * Load departments for filter dropdown
 */
async function loadDepartments() {
    try {
        const response = await fetch(window.getApiUrl('/HRCORE/?resource=departments'), {
            credentials: 'include'
        });
        
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Invalid API response');
        }
        
        if (response.ok) {
            departmentsCache = result.data || [];
        } else {
            throw new Error(result.message || `HTTP ${response.status}`);
        }
        
        const select = document.getElementById('employee-department-filter');
        if (select) {
            select.innerHTML = '<option value="">All Departments</option>' +
                departmentsCache.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        
        // Fallback departments
        departmentsCache = [
            { id: '1', name: 'Administration' },
            { id: '2', name: 'Finance' },
            { id: '3', name: 'Human Resources' }
        ];
        
        const select = document.getElementById('employee-department-filter');
        if (select) {
            select.innerHTML = '<option value="">All Departments</option>' +
                departmentsCache.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('');
        }
    }
}

/**
 * Load employees
 */
async function loadEmployees() {
    const container = document.getElementById('employees-list-container');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #64748b;"><p>Loading employees...</p></div>';
    
    try {
        const search = document.getElementById('employee-search-input')?.value || '';
        const status = document.getElementById('employee-status-filter')?.value || '';
        const department = document.getElementById('employee-department-filter')?.value || '';
        const employmentType = document.getElementById('employee-type-filter')?.value || '';
        
        const params = new URLSearchParams();
        params.append('resource', 'employees');
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (department) params.append('department_id', department);
        if (employmentType) params.append('employment_type', employmentType);
        
        const url = window.getApiUrl(`/HRCORE/?${params.toString()}`);
        
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('API returned invalid JSON:', responseText);
            throw new Error('Invalid API response: ' + responseText.substring(0, 200));
        }
        
        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}`);
        }
        
        let allEmployees = result.data || [];
        
        // Separate active and archived employees
        employeesCache = allEmployees.filter(emp => !emp.deleted_at);
        archivedEmployeesCache = allEmployees.filter(emp => emp.deleted_at);
        
        if (employeesCache.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
                    <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                    <p style="font-size: 16px; margin-bottom: 8px;">No employees found</p>
                    <p style="font-size: 14px; color: #6b7280;">Try adjusting your filters or add a new employee</p>
                </div>
            `;
            return;
        }
        
        renderEmployeesTable(employeesCache);
    } catch (error) {
        console.error('Error loading employees:', error);
        
        // Fallback to sample data
        const fallbackEmployees = [
            {
                id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@hospital.com',
                department_name: 'Administration',
                employment_type: 'full-time',
                status: 'active',
                position: 'Manager',
                hire_date: '2023-01-15'
            },
            {
                id: 'EMP002',
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@hospital.com',
                department_name: 'Finance',
                employment_type: 'full-time',
                status: 'active',
                position: 'Accountant',
                hire_date: '2023-03-20'
            }
        ];
        
        employeesCache = fallbackEmployees;
        archivedEmployeesCache = [];
        renderEmployeesTable(fallbackEmployees);
        
        // Show warning about API error
        const warning = document.createElement('div');
        warning.style.cssText = 'padding: 12px 20px; background: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e; margin-bottom: 20px; border-radius: 4px;';
        warning.innerHTML = '⚠️ Using sample data - API error: ' + error.message;
        container.insertBefore(warning, container.firstChild);
    }
}

/**
 * Render employees table with CRUD actions
 */
function renderEmployeesTable(employees) {
    const container = document.getElementById('employees-list-container');
    if (!container) return;
    
    // Update total count
    const countElement = document.getElementById('total-employees-count');
    if (countElement) {
        countElement.textContent = employees.length + ' employee' + (employees.length !== 1 ? 's' : '');
    }
    
    if (employees.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
                <p style="font-size: 16px;">No employees found</p>
            </div>
        `;
        return;
    }
    
    const getInitials = (firstName, lastName) => {
        return ((firstName || '').charAt(0) + (lastName || '').charAt(0)).toUpperCase();
    };
    
    const getAvatarColor = (index) => {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4f46e5', '#7c3aed', '#06b6d4', '#0ea5e9', '#3b82f6'];
        return colors[index % colors.length];
    };
    
    const tableHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
                <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px;">NAME</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px;">DEPARTMENT</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px;">POSITION</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px;">STATUS</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px;">JOIN DATE</th>
                    <th style="padding: 12px 16px; text-align: center; font-weight: 600; color: #6b7280; font-size: 12px;">ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                ${employees.map((emp, index) => `
                    <tr style="border-bottom: 1px solid #e5e7eb; background: white;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                        <td style="padding: 12px 16px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${getAvatarColor(index)}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
                                    ${getInitials(emp.first_name, emp.last_name)}
                                </div>
                                <div>
                                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 2px;">${emp.first_name} ${emp.last_name}</div>
                                    <div style="font-size: 12px; color: #6b7280;">${emp.email || 'N/A'}</div>
                                </div>
                            </div>
                        </td>
                        <td style="padding: 12px 16px; color: #3b82f6; font-weight: 500;">
                            ${emp.department_name || '-'}
                        </td>
                        <td style="padding: 12px 16px; color: #374151;">
                            ${emp.position || 'N/A'}
                        </td>
                        <td style="padding: 12px 16px;">
                            <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background: #d1fae5; color: #065f46; font-weight: 500; font-size: 12px;">
                                ${emp.status === 'active' ? 'Active' : emp.status || 'Active'}
                            </span>
                        </td>
                        <td style="padding: 12px 16px; color: #6b7280;">
                            ${emp.join_date ? new Date(emp.join_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </td>
                        <td style="padding: 12px 16px; text-align: center;">
                            <button onclick="showEmployeeMenu(event, '${emp.id}')" title="More" style="padding: 6px 12px; background: #e5e7eb; color: #374151; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">⋮</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

/**
 * Global functions for buttons
 */
window.refreshEmployees = loadEmployees;
window.clearEmployeeFilters = function() {
    document.getElementById('employee-search-input').value = '';
    document.getElementById('employee-status-filter').value = '';
    document.getElementById('employee-department-filter').value = '';
    loadEmployees();
};

window.applyEmployeeFilters = function() {
    const searchText = (document.getElementById('employee-search-input')?.value || '').toLowerCase();
    const departmentId = document.getElementById('employee-department-filter')?.value || '';
    const status = document.getElementById('employee-status-filter')?.value || '';
    
    let filtered = employeesCache;
    
    if (searchText) {
        filtered = filtered.filter(emp => 
            (emp.first_name + ' ' + emp.last_name).toLowerCase().includes(searchText) ||
            (emp.email || '').toLowerCase().includes(searchText) ||
            (emp.id || '').toLowerCase().includes(searchText)
        );
    }
    
    if (departmentId) {
        filtered = filtered.filter(emp => emp.department_id === departmentId);
    }
    
    if (status) {
        filtered = filtered.filter(emp => emp.status === status);
    }
    
    renderEmployeesTable(filtered);
};

window.showEmployeeMenu = function(event, employeeId, isArchived = false) {
    event.stopPropagation();
    const menu = document.createElement('div');
    menu.style.cssText = 'position: fixed; background: white; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000;';
    
    menu.innerHTML = `
        <button onclick="viewEmployee('${employeeId}')" style="display: block; width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 14px; color: #374151;">👁️ View</button>
        <button onclick="editEmployee('${employeeId}')" style="display: block; width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 14px; color: #374151;">✏️ Edit</button>
        <button onclick="deleteEmployee('${employeeId}')" style="display: block; width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 14px; color: #ef4444;">🗑️ Delete</button>
    `;
    
    const rect = event.target.getBoundingClientRect();
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.left = (rect.left - 80) + 'px';
    
    document.body.appendChild(menu);
    
    setTimeout(() => {
        document.addEventListener('click', function removeMenu() {
            if (document.body.contains(menu)) {
                menu.remove();
            }
            document.removeEventListener('click', removeMenu);
        });
    }, 0);
};

window.viewEmployee = async function(employeeId) {
    try {
        const response = await fetch(window.getApiUrl(`/HRCORE/?resource=employees&id=${employeeId}`), {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        const employee = result.data;
        
        showEmployeeModal(employee, false);
    } catch (error) {
        alert('Error loading employee: ' + error.message);
    }
};

window.editEmployee = async function(employeeId) {
    try {
        const response = await fetch(window.getApiUrl(`/HRCORE/?resource=employees&id=${employeeId}`), {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        const employee = result.data;
        
        showEmployeeModal(employee, true);
    } catch (error) {
        alert('Error loading employee: ' + error.message);
    }
};

window.deleteEmployee = async function(employeeId) {
    if (!confirm('Are you sure you want to delete this employee? You can restore them later from the archive.')) {
        return;
    }
    
    try {
        const response = await fetch(window.getApiUrl(`/HRCORE/?resource=employees&id=${employeeId}`), {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        alert('Employee archived successfully');
        loadEmployees();
    } catch (error) {
        alert('Error deleting employee: ' + error.message);
    }
};

/**
 * Restore archived employee
 */
window.restoreEmployee = async function(employeeId) {
    if (!confirm('Restore this employee to active records?')) {
        return;
    }
    
    try {
        const response = await fetch(window.getApiUrl(`/HRCORE/?resource=employees&id=${employeeId}&action=restore`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ deleted_at: null })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        alert('Employee restored successfully');
        loadEmployees();
    } catch (error) {
        alert('Error restoring employee: ' + error.message);
    }
};

/**
 * Permanently delete archived employee
 */
window.permanentlyDeleteEmployee = async function(employeeId) {
    if (!confirm('⚠️ WARNING: This will permanently delete the employee record. This action cannot be undone. Are you sure?')) {
        return;
    }
    
    try {
        const response = await fetch(window.getApiUrl(`/HRCORE/?resource=employees&id=${employeeId}&permanent=true`), {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        alert('Employee permanently deleted');
        // Refresh archive modal
        const archiveList = document.getElementById('archive-employees-list');
        if (archiveList) {
            renderArchiveEmployeesTable();
        } else {
            loadEmployees();
        }
    } catch (error) {
        alert('Error permanently deleting employee: ' + error.message);
    }
};

/**
 * Show archive modal
 */
window.showArchiveModal = function() {
    const modal = document.createElement('div');
    modal.id = 'archive-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-width: 900px; width: 100%; max-height: 85vh; overflow-y: auto;">
            <!-- Header -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; border-radius: 10px 10px 0 0;">
                <div>
                    <h3 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0;">📦 Deleted Employees Archive</h3>
                    <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0;">Manage archived employees - restore or permanently delete</p>
                </div>
                <button onclick="document.getElementById('archive-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
            </div>
            
            <!-- Content -->
            <div style="padding: 20px;">
                <div id="archive-employees-list" style="background: #f9fafb; border-radius: 8px; padding: 20px;">
                    <div style="text-align: center; color: #6b7280;">
                        <p>Loading archived employees...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    renderArchiveEmployeesTable();
};

/**
 * Render archived employees table in modal
 */
function renderArchiveEmployeesTable() {
    const container = document.getElementById('archive-employees-list');
    if (!container) return;
    
    if (archivedEmployeesCache.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #9ca3af;">
                <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                <p style="font-size: 16px; margin-bottom: 8px;">No archived employees</p>
                <p style="font-size: 14px; color: #6b7280;">Deleted employees will appear here</p>
            </div>
        `;
        return;
    }
    
    const getInitials = (firstName, lastName) => {
        return ((firstName || '').charAt(0) + (lastName || '').charAt(0)).toUpperCase();
    };
    
    const getAvatarColor = (index) => {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4f46e5', '#7c3aed', '#06b6d4', '#0ea5e9', '#3b82f6'];
        return colors[index % colors.length];
    };
    
    const tableHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
                <tr style="background: white; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px;">NAME</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px;">DEPARTMENT</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px;">POSITION</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px;">DELETED DATE</th>
                    <th style="padding: 12px 16px; text-align: center; font-weight: 600; color: #6b7280; font-size: 12px;">ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                ${archivedEmployeesCache.map((emp, index) => `
                    <tr style="border-bottom: 1px solid #e5e7eb; background: white;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">
                        <td style="padding: 12px 16px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${getAvatarColor(index)}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; opacity: 0.6;">
                                    ${getInitials(emp.first_name, emp.last_name)}
                                </div>
                                <div>
                                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 2px; text-decoration: line-through; opacity: 0.7;">${emp.first_name} ${emp.last_name}</div>
                                    <div style="font-size: 12px; color: #6b7280;">${emp.email || 'N/A'}</div>
                                </div>
                            </div>
                        </td>
                        <td style="padding: 12px 16px; color: #6b7280;">
                            ${emp.department_name || '-'}
                        </td>
                        <td style="padding: 12px 16px; color: #6b7280;">
                            ${emp.position || 'N/A'}
                        </td>
                        <td style="padding: 12px 16px; color: #6b7280; font-size: 13px;">
                            ${emp.deleted_at ? new Date(emp.deleted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </td>
                        <td style="padding: 12px 16px; text-align: center;">
                            <div style="display: flex; gap: 6px; justify-content: center;">
                                <button onclick="restoreEmployee('${emp.id}')" title="Restore" style="padding: 6px 12px; background: #d1fae5; color: #065f46; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 500; transition: all 0.2s ease;" onmouseover="this.style.background='#a7f3d0'" onmouseout="this.style.background='#d1fae5'">↩️ Restore</button>
                                <button onclick="if(confirm('⚠️ Permanently delete this employee?')) { permanentlyDeleteEmployee('${emp.id}'); }" title="Delete" style="padding: 6px 12px; background: #fee2e2; color: #991b1b; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 500; transition: all 0.2s ease;" onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'">🗑️ Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

window.showAddEmployeeModal = function() {
    showEmployeeModal(null, true);
};

/**
 * Show employee modal (view/edit/add)
 */
function showEmployeeModal(employee, isEdit) {
    const modal = document.createElement('div');
    modal.id = 'employee-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto;">
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0;">
                    ${isEdit ? (employee ? 'Edit Employee' : 'Add Employee') : 'View Employee'}
                </h3>
                <button onclick="document.getElementById('employee-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
            </div>
            
            <form id="employee-form" style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">First Name *</label>
                        <input type="text" name="first_name" value="${employee?.first_name || ''}" required 
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" ${!isEdit ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Last Name *</label>
                        <input type="text" name="last_name" value="${employee?.last_name || ''}" required 
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" ${!isEdit ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Email *</label>
                        <input type="email" name="email" value="${employee?.email || ''}" required 
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" ${!isEdit ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Phone</label>
                        <input type="tel" name="phone" value="${employee?.phone || ''}" 
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" ${!isEdit ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Department *</label>
                        <select name="department_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" ${!isEdit ? 'disabled' : ''}>
                            <option value="">Select Department</option>
                            ${departmentsCache.map(dept => `<option value="${dept.id}" ${employee?.department_id === dept.id ? 'selected' : ''}>${dept.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Hire Date *</label>
                        <input type="date" name="hire_date" value="${employee?.hire_date || ''}" required 
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" ${!isEdit ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Status</label>
                        <select name="status" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" ${!isEdit ? 'disabled' : ''}>
                            <option value="active" ${employee?.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${employee?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="on_leave" ${employee?.status === 'on_leave' ? 'selected' : ''}>On Leave</option>
                            <option value="resigned" ${employee?.status === 'resigned' ? 'selected' : ''}>Resigned</option>
                            <option value="terminated" ${employee?.status === 'terminated' ? 'selected' : ''}>Terminated</option>
                        </select>
                    </div>
                </div>
                
                ${isEdit ? `
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" onclick="document.getElementById('employee-modal').remove()" style="padding: 10px 20px; background: white; border: 1px solid #d1d5db; border-radius: 6px; color: #374151; font-size: 14px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                            ${employee ? 'Update Employee' : 'Create Employee'}
                        </button>
                    </div>
                ` : `
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" onclick="document.getElementById('employee-modal').remove()" style="padding: 10px 20px; background: white; border: 1px solid #d1d5db; border-radius: 6px; color: #374151; font-size: 14px; cursor: pointer;">Close</button>
                        <button type="button" onclick="editEmployee('${employee?.id}')" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Edit</button>
                    </div>
                `}
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (isEdit) {
        const form = document.getElementById('employee-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveEmployee(employee?.id, new FormData(form));
        });
    }
}

/**
 * Save employee (create or update)
 */
async function saveEmployee(employeeId, formData) {
    try {
        const data = Object.fromEntries(formData);
        
        const url = employeeId 
            ? `${API_BASE_URL}/HRCORE/?resource=employees&id=${employeeId}`
            : `${API_BASE_URL}/HRCORE/?resource=employees`;
        
        const method = employeeId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save employee');
        }
        
        alert(employeeId ? 'Employee updated successfully' : 'Employee created successfully');
        document.getElementById('employee-modal').remove();
        loadEmployees();
    } catch (error) {
        alert('Error saving employee: ' + error.message);
    }
}
