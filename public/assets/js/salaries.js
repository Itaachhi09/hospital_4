/**
 * PAYROLL Module - Salaries Section
 * Manages employee salary information, rates, and adjustments
 */

const API_BASE_URL = '/api';

// Fallback helper functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

/**
 * Displays the Salaries section
 */
export async function displaySalariesSection() {
    console.log("[Salaries] Displaying Salaries Section...");

    const container = document.getElementById('salariesContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header with Actions -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: #f0fdf4;">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <h3 style="font-size: 20px; font-weight: 600; color: #166534; margin: 0;">Employee Salaries</h3>
                        <p style="font-size: 14px; color: #15803d; margin-top: 5px;">View salary information, rates, and adjustments from HR1/HR2/HR3 modules</p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="refreshSalaries()" style="padding: 8px 16px; border: 1px solid #86efac; border-radius: 6px; background: white; color: #166534; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            🔄 Refresh
                        </button>
                        <button onclick="exportSalaryData()" style="padding: 8px 16px; background: #16a34a; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            📊 Export
                        </button>
                        <button onclick="showSalaryComparison()" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            📈 Comparison
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div style="padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <input id="salary-search-input" type="text" placeholder="Search by name, employee number, department..." 
                           style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; flex: 1; min-width: 200px; font-size: 14px;">
                    
                    <select id="branch-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Branches</option>
                    </select>
                    
                    <select id="department-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Departments</option>
                    </select>
                    
                    <select id="position-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Positions</option>
                    </select>
                    
                    <button onclick="applySalaryFilters()" style="padding: 8px 16px; background: #16a34a; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        🔍 Filter
                    </button>
                    
                    <button onclick="clearSalaryFilters()" style="padding: 8px 16px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        ✕ Clear
                    </button>
                </div>
            </div>

            <!-- Salaries Table -->
            <div style="padding: 20px; overflow-x: auto;">
                <div id="salaries-list-container" style="text-align: center; padding: 30px;">
                    <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #16a34a; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="color: #9ca3af; margin-top: 15px;">Loading salary information...</p>
                </div>
            </div>
        </div>

        <!-- Salary Details Modal -->
        <div id="salary-details-modal" style="position: fixed; inset: 0; z-index: 50; display: none; overflow-y: auto; background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: flex-start; justify-content: center; min-height: 100vh; padding: 15px;">
                <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 900px; margin-top: 20px;">
                    <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
                        <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Employee Salary Details</h3>
                        <button type="button" onclick="closeSalaryDetailsModal()" style="background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer;">✕</button>
                    </div>
                    
                    <!-- Salary Summary -->
                    <div style="padding: 20px; background: linear-gradient(to right, #f0fdf4, #f0fdf4); border-bottom: 1px solid #86efac;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; color: #16a34a;" id="employee-name">Employee Name</div>
                                <div style="font-size: 12px; color: #9ca3af;">Employee</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 16px; font-weight: 600; color: #111827;" id="employee-number">N/A</div>
                                <div style="font-size: 12px; color: #9ca3af;">Employee Number</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 16px; font-weight: 600; color: #111827;" id="department">N/A</div>
                                <div style="font-size: 12px; color: #9ca3af;">Department</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 16px; font-weight: 600; color: #111827;" id="position">N/A</div>
                                <div style="font-size: 12px; color: #9ca3af;">Position</div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; padding-top: 15px; border-top: 1px solid #86efac;">
                            <div style="text-align: center;">
                                <div style="font-size: 20px; font-weight: 700; color: #16a34a;" id="base-salary">₱0.00</div>
                                <div style="font-size: 12px; color: #9ca3af;">Base Salary</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 20px; font-weight: 700; color: #0369a1;" id="total-allowances">₱0.00</div>
                                <div style="font-size: 12px; color: #9ca3af;">Total Allowances</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 20px; font-weight: 700; color: #7c3aed;" id="gross-salary">₱0.00</div>
                                <div style="font-size: 12px; color: #9ca3af;">Gross Salary</div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="padding: 15px 20px; background: #f8fafc; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="exportSalaryDetails()" style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; font-size: 13px; cursor: pointer;">
                            📥 Export Details
                        </button>
                        <button onclick="viewSalaryHistory()" style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; font-size: 13px; cursor: pointer;">
                            📋 View History
                        </button>
                    </div>

                    <!-- Salary Details Content -->
                    <div id="salary-details-content" style="padding: 20px;">
                        Loading details...
                    </div>
                    
                    <div style="padding: 15px 20px; background: #f3f4f6; text-align: right;">
                        <button type="button" onclick="closeSalaryDetailsModal()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Salary Comparison Modal -->
        <div id="salary-comparison-modal" style="position: fixed; inset: 0; z-index: 50; display: none; overflow-y: auto; background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: flex-start; justify-content: center; min-height: 100vh; padding: 15px;">
                <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 900px; margin-top: 20px;">
                    <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
                        <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Salary Comparison Analysis</h3>
                        <button type="button" onclick="closeSalaryComparisonModal()" style="background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer;">✕</button>
                    </div>

                    <!-- Comparison Summary -->
                    <div style="padding: 20px; background: linear-gradient(to right, #faf5ff, #faf5ff); border-bottom: 1px solid #e9d5ff;">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; color: #7c3aed;" id="total-employees">0</div>
                                <div style="font-size: 12px; color: #9ca3af;">Total Employees</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; color: #16a34a;" id="average-salary">₱0.00</div>
                                <div style="font-size: 12px; color: #9ca3af;">Average Salary</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; color: #0369a1;" id="salary-range">₱0.00 - ₱0.00</div>
                                <div style="font-size: 12px; color: #9ca3af;">Salary Range</div>
                            </div>
                        </div>
                    </div>

                    <!-- Comparison Controls -->
                    <div style="padding: 15px 20px; background: #f8fafc; display: flex; gap: 10px; flex-wrap: wrap;">
                        <select id="comparison-department" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                            <option value="">All Departments</option>
                        </select>
                        <select id="comparison-position" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                            <option value="">All Positions</option>
                        </select>
                        <button onclick="updateComparison()" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                            📈 Update Analysis
                        </button>
                        <button onclick="exportComparison()" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; font-size: 14px; cursor: pointer;">
                            📥 Export
                        </button>
                    </div>

                    <!-- Comparison Content -->
                    <div id="salary-comparison-content" style="padding: 20px;">
                        Loading comparison...
                    </div>

                    <div style="padding: 15px 20px; background: #f3f4f6; text-align: right;">
                        <button type="button" onclick="closeSalaryComparisonModal()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>`;

    setupSalaryEventListeners();
    await loadFilterOptions();
    await loadSalaries();
}

function setupSalaryEventListeners() {
    const searchInput = document.getElementById('salary-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applySalaryFilters, 500));
    }
    
    const branchFilter = document.getElementById('branch-filter');
    const deptFilter = document.getElementById('department-filter');
    const posFilter = document.getElementById('position-filter');
    
    if (branchFilter) branchFilter.addEventListener('change', applySalaryFilters);
    if (deptFilter) deptFilter.addEventListener('change', applySalaryFilters);
    if (posFilter) posFilter.addEventListener('change', applySalaryFilters);
}

async function loadSalaries() {
    console.log("[Load] Loading Salaries...");
    const container = document.getElementById('salaries-list-container');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 30px;"><div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #16a34a; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div><p style="color: #9ca3af; margin-top: 15px;">Loading salary information...</p></div>';

    const params = new URLSearchParams();
    const branchFilter = document.getElementById('branch-filter')?.value;
    const deptFilter = document.getElementById('department-filter')?.value;
    const posFilter = document.getElementById('position-filter')?.value;
    const searchTerm = document.getElementById('salary-search-input')?.value;
    
    if (branchFilter) params.set('branch_id', branchFilter);
    if (deptFilter) params.set('department_id', deptFilter);
    if (posFilter) params.set('position_id', posFilter);
    if (searchTerm) params.set('search', searchTerm);
    
    params.set('page', '1');
    params.set('limit', '50');

    try {
        const response = await fetch(`${API_BASE_URL}/payroll/salaries.php?${params}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/index.php';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
            renderSalariesTable(result.data.salaries || []);
        } else {
            throw new Error(result.message || 'Failed to load salaries');
        }
    } catch (error) {
        console.error('Error loading salaries:', error);
        container.innerHTML = `<div style="text-align: center; padding: 30px;"><i style="font-size: 40px; color: #dc2626;">⚠️</i><p style="color: #dc2626; margin-top: 15px;">Error loading salaries: ${error.message}</p><button onclick="loadSalaries()" style="margin-top: 15px; padding: 10px 16px; background: #16a34a; color: white; border: none; border-radius: 6px; cursor: pointer;">🔄 Retry</button></div>`;
    }
}

function renderSalariesTable(salaries) {
    const container = document.getElementById('salaries-list-container');
    if (!container) return;

    if (!salaries || salaries.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 30px;"><i style="font-size: 50px; color: #d1d5db;">👥</i><h3 style="font-size: 18px; font-weight: 500; color: #111827; margin: 15px 0 10px 0;">No salary information found</h3><p style="color: #9ca3af; margin: 0;">No employees found matching the current filters.</p></div>`;
        return;
    }

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    const headerRow = table.createTHead().insertRow();
    headerRow.style.background = '#f0fdf4';
    headerRow.style.borderBottom = '2px solid #e2e8f0';
    
    const headers = ['Employee', 'Department', 'Position', 'Base Salary', 'Hourly Rate', 'Daily Rate', 'Adjustments', 'Actions'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.cssText = 'padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;';
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    tbody.style.borderTop = '1px solid #e2e8f0';

    salaries.forEach((salary, index) => {
        const row = tbody.insertRow();
        row.style.borderBottom = '1px solid #f3f4f6';
        row.style.background = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        
        // Employee
        const empCell = row.insertCell();
        empCell.style.cssText = 'padding: 12px 15px; font-size: 13px;';
        empCell.innerHTML = `<div style="font-weight: 500; color: #111827;">${salary.employee_name || 'N/A'}</div><div style="font-size: 12px; color: #9ca3af;">ID: ${salary.EmployeeNumber || 'N/A'}</div>`;
        
        // Department
        const deptCell = row.insertCell();
        deptCell.style.cssText = 'padding: 12px 15px; font-size: 13px; color: #374151;';
        deptCell.textContent = salary.DepartmentName || 'N/A';
        
        // Position
        const posCell = row.insertCell();
        posCell.style.cssText = 'padding: 12px 15px; font-size: 13px; color: #374151;';
        posCell.textContent = salary.PositionName || 'N/A';
        
        // Base Salary
        const baseSalary = parseFloat(salary.BaseSalary || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
        const baseCell = row.insertCell();
        baseCell.style.cssText = 'padding: 12px 15px; font-size: 13px; color: #0369a1; font-weight: 600;';
        baseCell.textContent = baseSalary;
        
        // Hourly Rate
        const hourly = parseFloat(salary.hourly_rate || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
        const hourlyCell = row.insertCell();
        hourlyCell.style.cssText = 'padding: 12px 15px; font-size: 13px; color: #16a34a; font-weight: 500;';
        hourlyCell.textContent = hourly;
        
        // Daily Rate
        const daily = parseFloat(salary.daily_rate || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
        const dailyCell = row.insertCell();
        dailyCell.style.cssText = 'padding: 12px 15px; font-size: 13px; color: #7c3aed; font-weight: 500;';
        dailyCell.textContent = daily;
        
        // Adjustments
        const adjustments = parseFloat(salary.total_adjustments || 0);
        const adjText = adjustments.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
        const adjColor = adjustments >= 0 ? '#16a34a' : '#dc2626';
        const adjCell = row.insertCell();
        adjCell.style.cssText = `padding: 12px 15px; font-size: 13px; color: ${adjColor}; font-weight: 500;`;
        adjCell.textContent = adjText;
        
        // Actions
        const actionsCell = row.insertCell();
        actionsCell.style.cssText = 'padding: 12px 15px; font-size: 13px;';
        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '8px';
        
        const viewBtn = document.createElement('button');
        viewBtn.innerHTML = '👁️ Details';
        viewBtn.style.cssText = 'background: none; border: none; color: #16a34a; cursor: pointer; font-size: 12px; text-decoration: underline;';
        viewBtn.onclick = () => viewSalaryDetails(salary.EmployeeID);
        
        const deducBtn = document.createElement('button');
        deducBtn.innerHTML = '📋 Deductions';
        deducBtn.style.cssText = 'background: none; border: none; color: #0369a1; cursor: pointer; font-size: 12px; text-decoration: underline;';
        deducBtn.onclick = () => viewEmployeeDeductions(salary.EmployeeID);
        
        actionsDiv.appendChild(viewBtn);
        actionsDiv.appendChild(deducBtn);
        actionsCell.appendChild(actionsDiv);
    });

    container.innerHTML = '';
    container.appendChild(table);
}

async function loadFilterOptions() {
    try {
        const branches = [{ BranchID: 1, BranchName: 'Main Hospital' }];
        const departments = [
            { DepartmentID: 1, DepartmentName: 'Administration' },
            { DepartmentID: 2, DepartmentName: 'Nursing' },
            { DepartmentID: 3, DepartmentName: 'Medical' },
            { DepartmentID: 4, DepartmentName: 'Finance' }
        ];
        const positions = [
            { PositionID: 1, PositionName: 'Manager' },
            { PositionID: 2, PositionName: 'Nurse' },
            { PositionID: 3, PositionName: 'Doctor' },
            { PositionID: 4, PositionName: 'Clerk' }
        ];
        
        const branchFilter = document.getElementById('branch-filter');
        if (branchFilter) {
            branchFilter.innerHTML = '<option value="">All Branches</option>' + 
                branches.map(b => `<option value="${b.BranchID}">${b.BranchName}</option>`).join('');
        }
        
        const deptFilter = document.getElementById('department-filter');
        if (deptFilter) {
            deptFilter.innerHTML = '<option value="">All Departments</option>' + 
                departments.map(d => `<option value="${d.DepartmentID}">${d.DepartmentName}</option>`).join('');
        }
        
        const posFilter = document.getElementById('position-filter');
        if (posFilter) {
            posFilter.innerHTML = '<option value="">All Positions</option>' + 
                positions.map(p => `<option value="${p.PositionID}">${p.PositionName}</option>`).join('');
        }

        const compDeptFilter = document.getElementById('comparison-department');
        if (compDeptFilter) {
            compDeptFilter.innerHTML = '<option value="">All Departments</option>' + 
                departments.map(d => `<option value="${d.DepartmentID}">${d.DepartmentName}</option>`).join('');
        }

        const compPosFilter = document.getElementById('comparison-position');
        if (compPosFilter) {
            compPosFilter.innerHTML = '<option value="">All Positions</option>' + 
                positions.map(p => `<option value="${p.PositionID}">${p.PositionName}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

async function viewSalaryDetails(employeeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/payroll/salaries.php?id=${employeeId}&action=details`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) throw new Error('Failed to load salary details');

        const result = await response.json();
        
        if (result.success) {
            const salary = result.data;
            updateSalarySummary(salary);
            
            const content = document.getElementById('salary-details-content');
            content.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div style="padding: 15px; background: #f8fafc; border-radius: 6px;">
                        <h4 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">📋 Basic Information</h4>
                        <div style="font-size: 13px;">
                            <div style="display: flex; justify-content: space-between; margin: 8px 0;"><span style="color: #9ca3af;">Employee Number:</span><span style="color: #111827; font-weight: 500;">${salary.EmployeeNumber || 'N/A'}</span></div>
                            <div style="display: flex; justify-content: space-between; margin: 8px 0;"><span style="color: #9ca3af;">Department:</span><span style="color: #111827; font-weight: 500;">${salary.DepartmentName || 'N/A'}</span></div>
                            <div style="display: flex; justify-content: space-between; margin: 8px 0;"><span style="color: #9ca3af;">Position:</span><span style="color: #111827; font-weight: 500;">${salary.PositionName || 'N/A'}</span></div>
                            <div style="display: flex; justify-content: space-between; margin: 8px 0;"><span style="color: #9ca3af;">Branch:</span><span style="color: #111827; font-weight: 500;">${salary.BranchName || 'N/A'}</span></div>
                            <div style="display: flex; justify-content: space-between; margin: 8px 0;"><span style="color: #9ca3af;">Hire Date:</span><span style="color: #111827; font-weight: 500;">${salary.HireDate || 'N/A'}</span></div>
                        </div>
                    </div>
                    
                    <div style="padding: 15px; background: #f8fafc; border-radius: 6px;">
                        <h4 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">💰 Salary Breakdown</h4>
                        <div style="font-size: 13px;">
                            <div style="display: flex; justify-content: space-between; margin: 8px 0;"><span style="color: #9ca3af;">Base Salary:</span><span style="color: #111827; font-weight: 600;">${parseFloat(salary.BaseSalary || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span></div>
                            <div style="display: flex; justify-content: space-between; margin: 8px 0;"><span style="color: #9ca3af;">Pay Frequency:</span><span style="color: #111827;">${salary.PayFrequency || 'N/A'}</span></div>
                            <div style="display: flex; justify-content: space-between; margin: 8px 0;"><span style="color: #9ca3af;">Hourly Rate:</span><span style="color: #111827;">${parseFloat(salary.hourly_rate || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span></div>
                            <div style="display: flex; justify-content: space-between; margin: 8px 0;"><span style="color: #9ca3af;">Daily Rate:</span><span style="color: #111827;">${parseFloat(salary.daily_rate || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span></div>
                            <div style="display: flex; justify-content: space-between; margin: 8px 0;"><span style="color: #9ca3af;">Effective Date:</span><span style="color: #111827;">${salary.EffectiveDate ? new Date(salary.EffectiveDate).toLocaleDateString() : 'N/A'}</span></div>
                        </div>
                    </div>
                </div>
                
                ${salary.adjustments && salary.adjustments.length > 0 ? `
                <div>
                    <h4 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px;">📊 Recent Adjustments</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f8fafc;">
                            <tr style="border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Type</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Amount</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Date</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${salary.adjustments.map(adj => `
                                <tr style="border-bottom: 1px solid #e5e7eb;">
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${adj.AdjustmentType}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: ${parseFloat(adj.Amount) >= 0 ? '#16a34a' : '#dc2626'}; font-weight: 600;">${parseFloat(adj.Amount).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${new Date(adj.AdjustmentDate).toLocaleDateString()}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${adj.Reason || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}

                <div style="margin-top: 20px; padding: 15px; background: #fef2f2; border-radius: 6px; border-left: 4px solid #dc2626;">
                    <h4 style="font-size: 14px; font-weight: 600; color: #991b1b; margin: 0 0 12px 0;">💳 Philippine Statutory Contributions & Taxes</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px;">
                        <div>
                            <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: 500;">SSS (Social Security System)</p>
                            <p style="margin: 0; color: #6b7280;">Employee: 3.63% | Employer: 5.45%</p>
                        </div>
                        <div>
                            <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: 500;">PhilHealth</p>
                            <p style="margin: 0; color: #6b7280;">Employee: 2.75% | Employer: 2.75% (Cap: ₱100k)</p>
                        </div>
                        <div>
                            <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: 500;">Pag-IBIG</p>
                            <p style="margin: 0; color: #6b7280;">Employee: 1% | Employer: 2% (Cap: ₱5k)</p>
                        </div>
                        <div>
                            <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: 500;">BIR Withholding Tax (2026)</p>
                            <p style="margin: 0; color: #6b7280;">Progressive: 0% - 25% (Annual Exemption: ₱125k)</p>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px; padding: 15px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #16a34a;">
                    <h4 style="font-size: 14px; font-weight: 600; color: #166534; margin: 0 0 12px 0;">⏰ Overtime & Shift Rates (Philippines)</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px;">
                        <div>
                            <p style="margin: 0 0 8px 0; color: #166534; font-weight: 500;">Regular Overtime</p>
                            <p style="margin: 0; color: #6b7280;">1.25x hourly rate</p>
                        </div>
                        <div>
                            <p style="margin: 0 0 8px 0; color: #166534; font-weight: 500;">Holiday OT</p>
                            <p style="margin: 0; color: #6b7280;">1.69x hourly rate</p>
                        </div>
                        <div>
                            <p style="margin: 0 0 8px 0; color: #166534; font-weight: 500;">Special Holiday OT</p>
                            <p style="margin: 0; color: #6b7280;">1.95x hourly rate</p>
                        </div>
                        <div>
                            <p style="margin: 0 0 8px 0; color: #166534; font-weight: 500;">Night Shift Diff</p>
                            <p style="margin: 0; color: #6b7280;">+10% of hourly rate</p>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px; padding: 15px; background: #f0f7ff; border-radius: 6px; border-left: 4px solid #0369a1;">
                    <h4 style="font-size: 14px; font-weight: 600; color: #0369a1; margin: 0 0 12px 0;">🏥 Hospital-Specific Allowances</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px;">
                        <div>
                            <p style="margin: 0 0 8px 0; color: #0369a1; font-weight: 500;">Hazard Pay (Medical Staff)</p>
                            <p style="margin: 0; color: #6b7280;">+10% of base salary</p>
                        </div>
                        <div>
                            <p style="margin: 0 0 8px 0; color: #0369a1; font-weight: 500;">Meal & Transportation</p>
                            <p style="margin: 0; color: #6b7280;">Per hospital policy</p>
                        </div>
                        <div>
                            <p style="margin: 0 0 8px 0; color: #0369a1; font-weight: 500;">Holiday Pay Rates</p>
                            <p style="margin: 0; color: #6b7280;">Regular: 1x | Special: 1.3x</p>
                        </div>
                        <div>
                            <p style="margin: 0 0 8px 0; color: #0369a1; font-weight: 500;">Calculated Daily Rate</p>
                            <p style="margin: 0; color: #6b7280;">Base Salary ÷ 22 working days</p>
                        </div>
                    </div>
                </div>
            `;
            
            const modal = document.getElementById('salary-details-modal');
            if (modal) modal.style.display = 'block';
        } else {
            throw new Error(result.message || 'Failed to load salary details');
        }
    } catch (error) {
        console.error('Error loading salary details:', error);
        alert(`Error: ${error.message}`);
    }
}

async function viewEmployeeDeductions(employeeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/payroll/salaries.php?id=${employeeId}&action=deductions`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) throw new Error('Failed to load deductions');

        const result = await response.json();
        
        if (result.success) {
            const deductions = result.data;
            const content = document.getElementById('salary-details-content');
            
            content.innerHTML = `
                <div>
                    <h4 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px;">📋 Employee Deductions Overview</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f8fafc;">
                            <tr style="border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Deduction Type</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Rate</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Amount</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${deductions.map(ded => `
                                <tr style="border-bottom: 1px solid #e5e7eb;">
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${ded.deduction_type}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${ded.rate}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #dc2626; font-weight: 600;">${parseFloat(ded.amount).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${ded.category}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            const modal = document.getElementById('salary-details-modal');
            if (modal) modal.style.display = 'block';
        } else {
            throw new Error(result.message || 'Failed to load deductions');
        }
    } catch (error) {
        console.error('Error loading deductions:', error);
        alert(`Error: ${error.message}`);
    }
}

async function showSalaryComparison() {
    try {
        const response = await fetch(`${API_BASE_URL}/payroll/salaries.php?action=comparison`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) throw new Error('Failed to load comparison');

        const result = await response.json();
        
        if (result.success) {
            const comparison = result.data;
            
            document.getElementById('total-employees').textContent = comparison.total_employees || 0;
            document.getElementById('average-salary').textContent = parseFloat(comparison.average_salary || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
            document.getElementById('salary-range').textContent = `${parseFloat(comparison.lowest_salary || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })} - ${parseFloat(comparison.highest_salary || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}`;
            
            const content = document.getElementById('salary-comparison-content');
            content.innerHTML = `
                <div>
                    <h4 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px;">📊 Salary Comparison by Department & Position</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f8fafc;">
                            <tr style="border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Department</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Position</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Branch</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Employees</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Avg Salary</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Min Salary</th>
                                <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af;">Max Salary</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(comparison.comparisons || []).map(comp => `
                                <tr style="border-bottom: 1px solid #e5e7eb;">
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${comp.DepartmentName || 'N/A'}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${comp.PositionName || 'N/A'}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${comp.BranchName || 'N/A'}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${comp.employee_count}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #0369a1; font-weight: 600;">${parseFloat(comp.avg_salary || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${parseFloat(comp.min_salary || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                                    <td style="padding: 8px 12px; font-size: 13px; color: #111827;">${parseFloat(comp.max_salary || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            const modal = document.getElementById('salary-comparison-modal');
            if (modal) modal.style.display = 'block';
        } else {
            throw new Error(result.message || 'Failed to load comparison');
        }
    } catch (error) {
        console.error('Error loading salary comparison:', error);
        alert(`Error: ${error.message}`);
    }
}

// Global window functions
window.refreshSalaries = function() {
    loadSalaries();
};

window.applySalaryFilters = function() {
    loadSalaries();
};

window.clearSalaryFilters = function() {
    document.getElementById('salary-search-input').value = '';
    document.getElementById('branch-filter').value = '';
    document.getElementById('department-filter').value = '';
    document.getElementById('position-filter').value = '';
    loadSalaries();
};

window.exportSalaryData = function() {
    const rows = document.querySelectorAll('#salaries-list-container tbody tr');
    if (!rows || rows.length === 0) {
        alert('No salary data available to export.');
        return;
    }

    const headers = ['Employee Name', 'Employee Number', 'Department', 'Position', 'Base Salary', 'Hourly Rate', 'Daily Rate', 'Adjustments'];
    const csvContent = [
        headers.join(','),
        ...Array.from(rows).map(row => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).slice(0, -1).map(cell => `"${cell.textContent.trim()}"`).join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salary_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Salary data exported successfully!');
};

window.showSalaryComparison = function() {
    showSalaryComparison();
};

window.viewSalaryDetails = function(employeeId) {
    viewSalaryDetails(employeeId);
};

window.viewEmployeeDeductions = function(employeeId) {
    viewEmployeeDeductions(employeeId);
};

window.closeSalaryDetailsModal = function() {
    const modal = document.getElementById('salary-details-modal');
    if (modal) modal.style.display = 'none';
};

window.closeSalaryComparisonModal = function() {
    const modal = document.getElementById('salary-comparison-modal');
    if (modal) modal.style.display = 'none';
};

window.exportSalaryDetails = function() {
    alert('Exporting salary details...');
};

window.viewSalaryHistory = function() {
    alert('Loading salary history...');
};

window.updateComparison = function() {
    showSalaryComparison();
};

window.exportComparison = function() {
    alert('Exporting comparison data...');
};

function updateSalarySummary(salary) {
    document.getElementById('employee-name').textContent = salary.employee_name || 'N/A';
    document.getElementById('employee-number').textContent = salary.EmployeeNumber || 'N/A';
    document.getElementById('department').textContent = salary.DepartmentName || 'N/A';
    document.getElementById('position').textContent = salary.PositionName || 'N/A';
    
    document.getElementById('base-salary').textContent = parseFloat(salary.BaseSalary || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
    document.getElementById('total-allowances').textContent = parseFloat(salary.TotalAllowances || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
    document.getElementById('gross-salary').textContent = parseFloat(salary.GrossSalary || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
