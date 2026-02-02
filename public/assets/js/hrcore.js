/**
 * HRCORE Module - Employees Management
 * Manages employee data viewing, filtering, searching, and basic operations
 * Adapted for Hospital HR Management System
 */

let allEmployeesData = [];
let departmentNameToId = {};
let departmentIdToName = {};
let currentSort = { key: null, dir: 'asc' };
let searchDebounceTimer;
const API_BASE_URL = '/api';
const HRCORE_API = `${API_BASE_URL}/HRCORE/employees.php`;
const HRCORE_DOCS_API = `${API_BASE_URL}/HRCORE/documents.php`;

/**
 * Initialize HRCORE Employees Section
 */
export async function displayHRCoreSection() {
    console.log("[HRCORE] Initializing Employees Section...");
    
    const container = document.getElementById('employeesContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header with Search and Filter -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 14px; color: #64748b;">Total Employees:</span>
                        <span style="font-size: 18px; font-weight: 700; color: #0f172a;" id="total-employee-count">0</span>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <div style="position: relative;">
                            <input 
                                id="emp-search-input" 
                                type="text" 
                                placeholder="Search employees..." 
                                style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; width: 250px; font-size: 14px;">
                        </div>
                        <button 
                            id="emp-filter-toggle" 
                            style="padding: 8px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-weight: 500; color: #0f172a;">
                            🔽 Filter
                        </button>
                    </div>
                </div>

                <!-- Advanced Filters (Hidden by default) -->
                <div id="advanced-filters" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">Department</label>
                            <select id="emp-filter-dept" style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                                <option value="">All Departments</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">Status</label>
                            <select id="emp-filter-status" style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button id="emp-apply-filters" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Apply</button>
                        <button id="emp-clear-filters" style="padding: 8px 16px; background: #e2e8f0; color: #0f172a; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Clear</button>
                    </div>
                </div>
            </div>

            <!-- Employee Table -->
            <div id="employee-list-container" style="overflow-x: auto;">
                <p style="text-align: center; padding: 40px 20px; color: #64748b;">Loading employees...</p>
            </div>
        </div>
    `;

    // Setup event listeners
    setupFilterListeners();
    
    // Load employees data
    await loadEmployees();
}

/**
 * Setup filter and search listeners
 */
function setupFilterListeners() {
    const filterToggle = document.getElementById('emp-filter-toggle');
    const advancedFilters = document.getElementById('advanced-filters');
    const applyBtn = document.getElementById('emp-apply-filters');
    const clearBtn = document.getElementById('emp-clear-filters');
    const searchInput = document.getElementById('emp-search-input');

    if (filterToggle && advancedFilters) {
        filterToggle.addEventListener('click', () => {
            const isHidden = advancedFilters.style.display === 'none';
            advancedFilters.style.display = isHidden ? 'block' : 'none';
            filterToggle.textContent = isHidden ? '🔼 Hide Filters' : '🔽 Filter';
        });
    }

    if (applyBtn) applyBtn.addEventListener('click', () => loadEmployees(buildFilterParams()));
    if (clearBtn) clearBtn.addEventListener('click', () => { resetFilters(); loadEmployees(); });
    
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') loadEmployees(buildFilterParams());
        });
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => loadEmployees(buildFilterParams()), 350);
        });
    }

    // Populate department filter
    populateDepartmentFilter();
}

/**
 * Build filter parameters from UI
 */
function buildFilterParams() {
    const params = {};
    const search = document.getElementById('emp-search-input')?.value?.trim();
    const dept = document.getElementById('emp-filter-dept')?.value;
    const status = document.getElementById('emp-filter-status')?.value;

    if (search) params.search = search;
    if (dept) params.department = dept;
    if (status) params.status = status;

    return params;
}

/**
 * Reset all filters
 */
function resetFilters() {
    const elements = ['emp-search-input', 'emp-filter-dept', 'emp-filter-status'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

/**
 * Populate department filter dropdown
 */
async function populateDepartmentFilter() {
    const select = document.getElementById('emp-filter-dept');
    if (!select) return;

    try {
        const response = await fetch(`${API_BASE_URL}/HRCORE/departments.php`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
            data.data.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id || dept.name;
                option.textContent = dept.name;
                select.appendChild(option);
                departmentNameToId[dept.name] = dept.id;
                departmentIdToName[dept.id] = dept.name;
            });
        }
    } catch (err) {
        console.warn('Failed to load departments:', err);
    }
}

/**
 * Load employees from API
 */
async function loadEmployees(params = null) {
    console.log("[HRCORE] Loading employees...");
    
    const container = document.getElementById('employee-list-container');
    if (!container) return;

    try {
        let url = HRCORE_API;
        if (params && Object.keys(params).length > 0) {
            const qs = new URLSearchParams(params).toString();
            url += `?${qs}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            window.location.href = '/index.php';
            return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
            allEmployeesData = data.data;
            renderEmployeeTable(data.data);
        } else {
            throw new Error(data.message || 'Failed to load employees');
        }
    } catch (error) {
        console.error('[HRCORE] Error loading employees:', error);
        container.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: #ef4444;">Error loading employees: ${error.message}</div>`;
    }
}

/**
 * Render employee table
 */
function renderEmployeeTable(employees) {
    console.log("[HRCORE] Rendering employee table...");
    
    const container = document.getElementById('employee-list-container');
    if (!container) return;

    const totalCount = document.getElementById('total-employee-count');
    if (totalCount) totalCount.textContent = employees.length;

    if (!employees || employees.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <p style="font-size: 18px; color: #64748b;">No employees found</p>
                <p style="font-size: 14px; color: #94a3b8; margin-top: 8px;">Try adjusting your search filters</p>
            </div>
        `;
        return;
    }

    let rowsHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <tr>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #64748b;">Employee ID</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #64748b; cursor: pointer;">Name</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #64748b;">Department</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #64748b;">Position</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #64748b;">Status</th>
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #64748b;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    employees.forEach(emp => {
        const statusColor = emp.status === 'active' ? '#10b981' : '#ef4444';
        const statusBg = emp.status === 'active' ? '#dcfce7' : '#fee2e2';
        
        rowsHTML += `
            <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.2s;">
                <td style="padding: 12px 16px; font-size: 13px; color: #0f172a;">${emp.id}</td>
                <td style="padding: 12px 16px; font-size: 13px; color: #0f172a; font-weight: 500;">${emp.name || 'N/A'}</td>
                <td style="padding: 12px 16px; font-size: 13px; color: #0f172a;">${emp.department || 'N/A'}</td>
                <td style="padding: 12px 16px; font-size: 13px; color: #0f172a;">${emp.position || 'N/A'}</td>
                <td style="padding: 12px 16px;">
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: ${statusBg}; color: ${statusColor}; text-transform: capitalize;">
                        ${emp.status || 'inactive'}
                    </span>
                </td>
                <td style="padding: 12px 16px;">
                    <button onclick="viewEmployeeDetail('${String(emp.id).replace(/'/g, "\\'")}')" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 6px;">View</button>
                    <button onclick="editEmployee('${String(emp.id).replace(/'/g, "\\'")}')" style="padding: 6px 12px; background: #60a5fa; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Edit</button>
                </td>
            </tr>
        `;
    });

    rowsHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = rowsHTML;
}

/**
 * Open employee profile modal - edit functionality can be added to the modal
 */
window.viewEmployeeDetail = function(employeeId) {
    openEmployeeProfileModal(employeeId);
};

/**
 * Edit employee
 */
window.editEmployee = function(employeeId) {
    alert(`Edit functionality for employee ${employeeId} will be added next (backend PUT already implemented).`);
};

function ensureEmployeeModalShell() {
    if (document.getElementById('employeeProfileModal')) return;

    const modal = document.createElement('div');
    modal.id = 'employeeProfileModal';
    modal.style.cssText = 'position:fixed; inset:0; background: rgba(15,23,42,0.55); display:none; align-items:center; justify-content:center; z-index: 9999; padding: 18px;';
    modal.innerHTML = `
        <div style="width: min(1100px, 100%); background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 18px 60px rgba(0,0,0,0.25); max-height: 92vh; display:flex; flex-direction: column;">
            <div style="padding: 16px 18px; display:flex; justify-content: space-between; align-items:center; border-bottom: 1px solid #e2e8f0; background:#f8fafc;">
                <div>
                    <div style="font-weight:800; color:#0f172a; font-size: 16px;" id="emp-modal-title">Employee</div>
                    <div style="font-size: 12px; color:#64748b;" id="emp-modal-subtitle"></div>
                </div>
                <button id="emp-modal-close" style="border:none; background: transparent; cursor:pointer; font-size: 18px; padding: 6px 10px;">✕</button>
            </div>

            <div style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0;">
                <div style="display:flex; gap: 8px; flex-wrap: wrap;">
                    <button class="emp-tab-btn" data-tab="profile" style="padding: 8px 12px; border: 1px solid #3b82f6; background:#3b82f6; color:white; border-radius: 8px; cursor:pointer; font-weight:600; font-size: 13px;">Profile</button>
                    <button class="emp-tab-btn" data-tab="documents" style="padding: 8px 12px; border: 1px solid #e2e8f0; background:white; color:#0f172a; border-radius: 8px; cursor:pointer; font-weight:600; font-size: 13px;">Documents</button>
                </div>
            </div>

            <div style="padding: 18px; overflow:auto;" id="emp-modal-body">
                <div style="color:#64748b; padding: 24px 0;">Loading…</div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEmployeeProfileModal();
    });
    modal.querySelector('#emp-modal-close')?.addEventListener('click', closeEmployeeProfileModal);

    modal.querySelectorAll('.emp-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => setEmployeeModalTab(btn.getAttribute('data-tab')));
    });
}

function closeEmployeeProfileModal() {
    const modal = document.getElementById('employeeProfileModal');
    if (modal) modal.style.display = 'none';
}

function setEmployeeModalTab(tab) {
    const modal = document.getElementById('employeeProfileModal');
    if (!modal) return;

    modal.querySelectorAll('.emp-tab-btn').forEach(b => {
        const isActive = b.getAttribute('data-tab') === tab;
        b.style.background = isActive ? '#3b82f6' : 'white';
        b.style.borderColor = isActive ? '#3b82f6' : '#e2e8f0';
        b.style.color = isActive ? 'white' : '#0f172a';
    });

    const state = modal.__empState;
    if (!state) return;

    if (tab === 'profile') renderEmployeeProfileTab(state);
    if (tab === 'documents') renderEmployeeDocumentsTab(state);
}

async function openEmployeeProfileModal(employeeId) {
    ensureEmployeeModalShell();
    const modal = document.getElementById('employeeProfileModal');
    if (!modal) return;

    modal.style.display = 'flex';
    modal.__empState = { employeeId, employee: null, documents: null, docsLoading: false };
    document.getElementById('emp-modal-title').textContent = `Employee ${employeeId}`;
    document.getElementById('emp-modal-subtitle').textContent = '';
    document.getElementById('emp-modal-body').innerHTML = `<div style="color:#64748b; padding: 24px 0;">Loading employee details…</div>`;

    try {
        const resp = await fetch(`${HRCORE_API}/${encodeURIComponent(employeeId)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || `HTTP ${resp.status}`);

        modal.__empState.employee = data.data;

        document.getElementById('emp-modal-title').textContent = `${data.data.name || (data.data.first_name + ' ' + data.data.last_name)}`;
        document.getElementById('emp-modal-subtitle').textContent = `${data.data.id} • ${data.data.department || data.data.department_name || 'No department'} • ${data.data.position || 'No position'}`;

        setEmployeeModalTab('profile');
    } catch (e) {
        document.getElementById('emp-modal-body').innerHTML = `<div style="color:#ef4444; padding: 24px 0;">Failed to load employee: ${e.message}</div>`;
    }
}

function renderEmployeeProfileTab(state) {
    const body = document.getElementById('emp-modal-body');
    if (!body) return;
    const e = state.employee;
    if (!e) {
        body.innerHTML = `<div style="color:#64748b; padding: 24px 0;">No employee data.</div>`;
        return;
    }

    const badge = (text, bg, color) => `<span style="display:inline-block; padding:4px 10px; border-radius:999px; background:${bg}; color:${color}; font-size:12px; font-weight:700; text-transform:capitalize;">${text}</span>`;
    const status = (e.status || 'inactive');
    const statusBadge = status === 'active'
        ? badge(status, '#dcfce7', '#166534')
        : badge(status, '#fee2e2', '#991b1b');

    body.innerHTML = `
        <div style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap: 14px;">
            <div style="border:1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
                <div style="font-weight:800; color:#0f172a; margin-bottom: 10px;">Personal Information</div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                    <div><div style="color:#64748b; font-weight:600; font-size: 12px;">First Name</div><div style="color:#0f172a;">${e.first_name || ''}</div></div>
                    <div><div style="color:#64748b; font-weight:600; font-size: 12px;">Last Name</div><div style="color:#0f172a;">${e.last_name || ''}</div></div>
                    <div><div style="color:#64748b; font-weight:600; font-size: 12px;">Email</div><div style="color:#0f172a;">${e.email || ''}</div></div>
                    <div><div style="color:#64748b; font-weight:600; font-size: 12px;">Phone</div><div style="color:#0f172a;">${e.phone || ''}</div></div>
                    <div><div style="color:#64748b; font-weight:600; font-size: 12px;">Date of Birth</div><div style="color:#0f172a;">${e.date_of_birth || ''}</div></div>
                    <div><div style="color:#64748b; font-weight:600; font-size: 12px;">Gender</div><div style="color:#0f172a; text-transform: capitalize;">${e.gender || ''}</div></div>
                </div>
            </div>
            <div style="border:1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
                <div style="font-weight:800; color:#0f172a; margin-bottom: 10px;">Employment</div>
                <div style="display:grid; grid-template-columns: 1fr; gap: 10px; font-size: 13px;">
                    <div><div style="color:#64748b; font-weight:600; font-size: 12px;">Department</div><div style="color:#0f172a;">${e.department || e.department_name || ''}</div></div>
                    <div><div style="color:#64748b; font-weight:600; font-size: 12px;">Position</div><div style="color:#0f172a;">${e.position || ''}</div></div>
                    <div><div style="color:#64748b; font-weight:600; font-size: 12px;">Hire Date</div><div style="color:#0f172a;">${e.hire_date || ''}</div></div>
                    <div><div style="color:#64748b; font-weight:600; font-size: 12px;">Status</div><div>${statusBadge}</div></div>
                </div>
            </div>
        </div>
    `;
}

async function renderEmployeeDocumentsTab(state) {
    const body = document.getElementById('emp-modal-body');
    if (!body) return;

    const employeeId = state.employeeId;
    body.innerHTML = `
        <div style="display:flex; justify-content: space-between; align-items:flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;">
            <div>
                <div style="font-weight:800; color:#0f172a;">Documents</div>
                <div style="font-size: 12px; color:#64748b;">Upload and manage employee documents. Expired documents are highlighted.</div>
            </div>
            <div style="display:flex; gap: 8px; flex-wrap: wrap;">
                <select id="emp-doc-filter-category" style="padding: 8px; border:1px solid #e2e8f0; border-radius: 8px; font-size: 13px;">
                    <option value="">All Categories</option>
                    ${DOCUMENT_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <select id="emp-doc-filter-status" style="padding: 8px; border:1px solid #e2e8f0; border-radius: 8px; font-size: 13px;">
                    <option value="">All Status</option>
                    <option value="valid">Valid</option>
                    <option value="expired">Expired</option>
                    <option value="pending">Pending</option>
                    <option value="missing">Missing</option>
                </select>
                <button id="emp-doc-refresh" style="padding: 8px 12px; border:1px solid #e2e8f0; border-radius: 8px; background:white; cursor:pointer; font-weight:700; font-size: 13px;">Refresh</button>
            </div>
        </div>

        <div style="border:1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 12px;">
            <div style="font-weight:800; color:#0f172a; margin-bottom: 10px;">Upload Documents</div>
            <div style="display:grid; grid-template-columns: 1.2fr 0.8fr 0.8fr; gap: 10px;">
                <div>
                    <div style="font-size: 12px; font-weight:700; color:#64748b; margin-bottom: 6px;">Files (PDF/JPG/PNG/DOCX)</div>
                    <input id="emp-doc-files" type="file" multiple style="width:100%;" />
                </div>
                <div>
                    <div style="font-size: 12px; font-weight:700; color:#64748b; margin-bottom: 6px;">Category</div>
                    <select id="emp-doc-category" style="width:100%; padding: 8px; border:1px solid #e2e8f0; border-radius: 8px; font-size: 13px;">
                        ${DOCUMENT_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <div style="font-size: 12px; font-weight:700; color:#64748b; margin-bottom: 6px;">Document Type</div>
                    <select id="emp-doc-type" style="width:100%; padding: 8px; border:1px solid #e2e8f0; border-radius: 8px; font-size: 13px;">
                        ${DOCUMENT_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <div style="font-size: 12px; font-weight:700; color:#64748b; margin-bottom: 6px;">Issue Date</div>
                    <input id="emp-doc-issue" type="date" style="width:100%; padding: 8px; border:1px solid #e2e8f0; border-radius: 8px; font-size: 13px;" />
                </div>
                <div>
                    <div style="font-size: 12px; font-weight:700; color:#64748b; margin-bottom: 6px;">Expiry Date</div>
                    <input id="emp-doc-expiry" type="date" style="width:100%; padding: 8px; border:1px solid #e2e8f0; border-radius: 8px; font-size: 13px;" />
                </div>
                <div style="display:flex; align-items:flex-end;">
                    <button id="emp-doc-upload" style="width:100%; padding: 10px 12px; border:none; border-radius: 8px; background:#10b981; color:white; cursor:pointer; font-weight:800;">Upload</button>
                </div>
            </div>
            <div id="emp-doc-upload-msg" style="margin-top: 10px; font-size: 13px; color:#64748b;"></div>
        </div>

        <div id="emp-docs-table" style="border:1px solid #e2e8f0; border-radius: 10px; overflow:hidden;">
            <div style="padding: 16px; color:#64748b;">Loading documents…</div>
        </div>
    `;

    const refreshBtn = document.getElementById('emp-doc-refresh');
    const filterCategory = document.getElementById('emp-doc-filter-category');
    const filterStatus = document.getElementById('emp-doc-filter-status');
    const uploadBtn = document.getElementById('emp-doc-upload');

    refreshBtn?.addEventListener('click', () => loadEmployeeDocuments(employeeId));
    filterCategory?.addEventListener('change', () => loadEmployeeDocuments(employeeId));
    filterStatus?.addEventListener('change', () => loadEmployeeDocuments(employeeId));
    uploadBtn?.addEventListener('click', () => uploadEmployeeDocuments(employeeId));

    await loadEmployeeDocuments(employeeId);
}

async function loadEmployeeDocuments(employeeId) {
    const table = document.getElementById('emp-docs-table');
    if (!table) return;

    const category = document.getElementById('emp-doc-filter-category')?.value || '';
    const status = document.getElementById('emp-doc-filter-status')?.value || '';
    const qs = new URLSearchParams({ employee_id: employeeId });
    if (category) qs.set('category', category);
    if (status) qs.set('status', status);

    table.innerHTML = `<div style="padding: 16px; color:#64748b;">Loading documents…</div>`;

    try {
        const resp = await fetch(`${HRCORE_DOCS_API}?${qs.toString()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || `HTTP ${resp.status}`);

        renderDocumentsTable(employeeId, data.data || []);
    } catch (e) {
        table.innerHTML = `<div style="padding: 16px; color:#ef4444;">Failed to load documents: ${e.message}</div>`;
    }
}

function renderDocumentsTable(employeeId, docs) {
    const table = document.getElementById('emp-docs-table');
    if (!table) return;

    if (!docs || docs.length === 0) {
        table.innerHTML = `<div style="padding: 24px; color:#64748b;">No documents uploaded yet.</div>`;
        return;
    }

    const statusBadge = (s) => {
        const st = (s || '').toLowerCase();
        const map = {
            valid: ['#dcfce7', '#166534'],
            expired: ['#fee2e2', '#991b1b'],
            pending: ['#fef9c3', '#854d0e'],
            missing: ['#e2e8f0', '#0f172a']
        };
        const [bg, fg] = map[st] || ['#e2e8f0', '#0f172a'];
        return `<span style="display:inline-block; padding:4px 10px; border-radius:999px; background:${bg}; color:${fg}; font-size:12px; font-weight:800; text-transform:capitalize;">${st || 'unknown'}</span>`;
    };

    table.innerHTML = `
        <table style="width:100%; border-collapse: collapse;">
            <thead style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                <tr>
                    <th style="padding: 12px; text-align:left; font-size:12px; color:#64748b;">Document Name</th>
                    <th style="padding: 12px; text-align:left; font-size:12px; color:#64748b;">Category</th>
                    <th style="padding: 12px; text-align:left; font-size:12px; color:#64748b;">Type</th>
                    <th style="padding: 12px; text-align:left; font-size:12px; color:#64748b;">Issue</th>
                    <th style="padding: 12px; text-align:left; font-size:12px; color:#64748b;">Expiry</th>
                    <th style="padding: 12px; text-align:left; font-size:12px; color:#64748b;">Status</th>
                    <th style="padding: 12px; text-align:left; font-size:12px; color:#64748b;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${docs.map(d => {
                    const rowBg = (String(d.status || '').toLowerCase() === 'expired') ? 'background:#fff1f2;' : '';
                    const viewUrl = `${HRCORE_DOCS_API}?action=view&id=${encodeURIComponent(d.id)}`;
                    const dlUrl = `${HRCORE_DOCS_API}?action=download&id=${encodeURIComponent(d.id)}`;
                    return `
                        <tr style="border-bottom:1px solid #e2e8f0; ${rowBg}">
                            <td style="padding: 12px; font-size:13px; color:#0f172a; font-weight:600;">${escapeHtml(d.display_name || d.id)}</td>
                            <td style="padding: 12px; font-size:13px; color:#0f172a;">${escapeHtml(d.category || '')}</td>
                            <td style="padding: 12px; font-size:13px; color:#0f172a;">${escapeHtml(d.document_type || '')}</td>
                            <td style="padding: 12px; font-size:13px; color:#0f172a;">${escapeHtml(d.issue_date || '')}</td>
                            <td style="padding: 12px; font-size:13px; color:#0f172a;">${escapeHtml(d.expiry_date || '')}</td>
                            <td style="padding: 12px;">${statusBadge(d.status)}</td>
                            <td style="padding: 12px;">
                                <button onclick="window.open('${viewUrl}', '_blank')" style="padding:6px 10px; border:none; border-radius:6px; background:#3b82f6; color:white; cursor:pointer; font-weight:800; font-size:12px; margin-right:6px;">View</button>
                                <button onclick="window.open('${dlUrl}', '_blank')" style="padding:6px 10px; border:none; border-radius:6px; background:#0ea5e9; color:white; cursor:pointer; font-weight:800; font-size:12px; margin-right:6px;">Download</button>
                                <button onclick="deleteEmployeeDocument('${String(d.id).replace(/'/g, "\\'")}', '${String(employeeId).replace(/'/g, "\\'")}')" style="padding:6px 10px; border:none; border-radius:6px; background:#ef4444; color:white; cursor:pointer; font-weight:800; font-size:12px;">Delete</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function uploadEmployeeDocuments(employeeId) {
    const msg = document.getElementById('emp-doc-upload-msg');
    const filesEl = document.getElementById('emp-doc-files');
    const categoryEl = document.getElementById('emp-doc-category');
    const typeEl = document.getElementById('emp-doc-type');
    const issueEl = document.getElementById('emp-doc-issue');
    const expiryEl = document.getElementById('emp-doc-expiry');

    const files = filesEl?.files ? Array.from(filesEl.files) : [];
    if (files.length === 0) {
        if (msg) msg.innerHTML = `<span style="color:#ef4444; font-weight:700;">Please select at least one file.</span>`;
        return;
    }

    const fd = new FormData();
    files.forEach(f => fd.append('files[]', f));
    fd.append('category', categoryEl?.value || 'Other Files');
    fd.append('document_type', typeEl?.value || 'other');
    if (issueEl?.value) fd.append('issue_date', issueEl.value);
    if (expiryEl?.value) fd.append('expiry_date', expiryEl.value);

    if (msg) msg.textContent = 'Uploading…';
    try {
        const resp = await fetch(`${HRCORE_DOCS_API}?employee_id=${encodeURIComponent(employeeId)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            body: fd
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || `HTTP ${resp.status}`);

        if (msg) msg.innerHTML = `<span style="color:#10b981; font-weight:800;">Upload successful.</span>`;
        if (filesEl) filesEl.value = '';
        await loadEmployeeDocuments(employeeId);
    } catch (e) {
        if (msg) msg.innerHTML = `<span style="color:#ef4444; font-weight:800;">Upload failed: ${e.message}</span>`;
    }
}

window.deleteEmployeeDocument = async function(documentId, employeeId) {
    if (!confirm('Delete this document? (Admin only)')) return;
    try {
        const resp = await fetch(`${HRCORE_DOCS_API}?id=${encodeURIComponent(documentId)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || `HTTP ${resp.status}`);
        await loadEmployeeDocuments(employeeId);
    } catch (e) {
        alert(`Delete failed: ${e.message}`);
    }
};

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const DOCUMENT_CATEGORIES = [
    'Personal Documents',
    'Government Compliance',
    'Employment Records',
    'Medical Records',
    'Professional Licenses',
    'Training & Certifications',
    'Other Files'
];

// Document types (PH hospital context)
const DOCUMENT_TYPES = [
    'Resume / Curriculum Vitae (CV)',
    'Application Form',
    'Birth Certificate (PSA)',
    'Government-issued ID',
    'Barangay Clearance',
    'NBI Clearance',
    'Police Clearance',
    'Marriage Certificate',
    'TIN (BIR)',
    'SSS Number',
    'PhilHealth Number',
    'Pag-IBIG (HDMF) Number',
    'BIR Form 1902 / 1905',
    'Certificate of Employment',
    'Employment Contract',
    'Job Offer Letter',
    'Job Description',
    'Employee Handbook Acknowledgment',
    'Medical Examination Report',
    'PRC License',
    'Board Rating / Certificate of Registration',
    'Professional ID',
    'Orientation Certificate',
    'BLS/ACLS/PALS Certificates',
    'Infection Control Training',
    'Safety Training Certificates',
    'Continuing Professional Development (CPD) Records',
    'Memoranda',
    'Incident Reports',
    'Leave Records',
    'Overtime Approvals',
    'Resignation Letter',
    'Other'
];

/**
 * Edit employee
 */
window.editEmployee = function(employeeId) {
    alert(`Edit functionality for employee ${employeeId} coming soon!`);
};

/**
 * Display HRCORE Departments Section
 */
export async function displayHRCoreDepartmentsSection() {
    console.log("[HRCORE] Initializing Departments Section...");
    
    const container = document.getElementById('departmentsContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header with Search and Filter -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 14px; color: #64748b;">Total Departments:</span>
                        <span style="font-size: 18px; font-weight: 700; color: #0f172a;" id="total-dept-count">0</span>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <div style="position: relative;">
                            <input 
                                id="dept-search-input" 
                                type="text" 
                                placeholder="Search departments..." 
                                style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; width: 250px; font-size: 14px;">
                        </div>
                        <button 
                            id="dept-filter-toggle" 
                            style="padding: 8px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-weight: 500; color: #0f172a;">
                            ➕ Add Department
                        </button>
                    </div>
                </div>
            </div>

            <!-- Departments List Container -->
            <div id="dept-list-container" style="padding: 20px; background: white;"></div>
        </div>
    `;

    // Load departments data
    loadDepartments();
    setupDepartmentListeners();
}

/**
 * Load departments from API
 */
async function loadDepartments() {
    console.log("[HRCORE] Loading departments...");
    
    const container = document.getElementById('dept-list-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/HRCORE/departments.php`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            window.location.href = '/index.php';
            return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
            renderDepartmentTable(data.data);
        } else {
            throw new Error(data.message || 'Failed to load departments');
        }
    } catch (error) {
        console.error('[HRCORE] Error loading departments:', error);
        container.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: #ef4444;">Error loading departments: ${error.message}</div>`;
    }
}

/**
 * Render department table
 */
function renderDepartmentTable(departments) {
    console.log("[HRCORE] Rendering departments table...");
    
    const container = document.getElementById('dept-list-container');
    if (!container) return;

    const totalCount = document.getElementById('total-dept-count');
    if (totalCount) totalCount.textContent = departments.length;

    if (!departments || departments.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <p style="font-size: 18px; color: #64748b;">No departments found</p>
                <p style="font-size: 14px; color: #94a3b8; margin-top: 8px;">Click the "Add Department" button to create one</p>
            </div>
        `;
        return;
    }

    let rowsHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <tr>
                    <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #0f172a; text-transform: uppercase;">ID</th>
                    <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #0f172a; text-transform: uppercase;">Name</th>
                    <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #0f172a; text-transform: uppercase;">Manager</th>
                    <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #0f172a; text-transform: uppercase;">Employees</th>
                    <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #0f172a; text-transform: uppercase;">Budget</th>
                    <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #0f172a; text-transform: uppercase;">Status</th>
                    <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: #0f172a; text-transform: uppercase;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    departments.forEach((dept, idx) => {
        const statusColor = dept.status === 'active' ? '#10b981' : '#ef4444';
        const statusBg = dept.status === 'active' ? '#ecfdf5' : '#fef2f2';
        rowsHTML += `
            <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background: #f8fafc;' : ''}">
                <td style="padding: 12px; font-size: 13px; color: #0f172a; font-weight: 500;">${dept.id || 'N/A'}</td>
                <td style="padding: 12px; font-size: 13px; color: #0f172a;">${dept.name || 'N/A'}</td>
                <td style="padding: 12px; font-size: 13px; color: #0f172a;">${dept.manager || 'N/A'}</td>
                <td style="padding: 12px; font-size: 13px; color: #0f172a;">${dept.employee_count || 0}</td>
                <td style="padding: 12px; font-size: 13px; color: #0f172a;">$${(dept.budget || 0).toLocaleString()}</td>
                <td style="padding: 12px;">
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; background: ${statusBg}; color: ${statusColor}; font-size: 12px; font-weight: 600; text-transform: capitalize;">
                        ${dept.status || 'unknown'}
                    </span>
                </td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="viewDepartment(${dept.id || idx})" style="padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 4px;">👁️ View</button>
                    <button onclick="editDepartment(${dept.id || idx})" style="padding: 4px 8px; background: #60a5fa; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">✏️ Edit</button>
                </td>
            </tr>
        `;
    });

    rowsHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = rowsHTML;
}

/**
 * Setup department event listeners
 */
function setupDepartmentListeners() {
    const searchInput = document.getElementById('dept-search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') loadDepartments();
        });
    }
}

/**
 * View department details
 */
window.viewDepartment = function(deptId) {
    alert(`View department ${deptId} - functionality coming soon!`);
};

/**
 * Edit department
 */
window.editDepartment = function(deptId) {
    alert(`Edit department ${deptId} - functionality coming soon!`);
};

