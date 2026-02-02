/**
 * PAYROLL Module - Bonuses Section
 * Manages bonuses, incentives, and allowances
 * Adapted for Hospital HR Management System
 */

const API_BASE_URL = '/api';
const PAYROLL_API = `${API_BASE_URL}/payroll/payroll.php`;

let allBonusesData = [];
let searchDebounceTimer = null;

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
 * Display Bonuses Section
 */
export async function displayBonusesSection() {
    console.log("[Bonuses] Displaying Bonuses Section...");
    
    const container = document.getElementById('bonusesContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header with Actions -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <h3 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0;">Bonuses & Incentives</h3>
                        <p style="font-size: 14px; color: #64748b; margin-top: 5px;">Manage all bonuses, incentives, and allowances</p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="refreshBonuses()" style="padding: 8px 16px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; color: #0f172a; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            🔄 Refresh
                        </button>
                        <button onclick="showComputeBonusesModal()" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            🧮 Compute Bonuses
                        </button>
                        <button onclick="showAddBonusModal()" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            ➕ Add Bonus
                        </button>
                        <button onclick="exportBonusData()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            📊 Export
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div style="padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <input id="bonus-search-input" type="text" placeholder="Search by employee, bonus type..." 
                           style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; flex: 1; min-width: 200px; font-size: 14px;">
                    
                    <select id="bonus-type-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Types</option>
                        <option value="Mid-Year Bonus">Mid-Year Bonus</option>
                        <option value="Year-End Bonus">Year-End Bonus</option>
                        <option value="Hazard Pay">Hazard Pay</option>
                        <option value="Night Differential">Night Differential</option>
                        <option value="Overtime Allowance">Overtime Allowance</option>
                        <option value="Performance Incentive">Performance Incentive</option>
                    </select>
                    
                    <select id="bonus-status-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                    
                    <button onclick="applyBonusFilters()" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        🔍 Filter
                    </button>
                    
                    <button onclick="clearBonusFilters()" style="padding: 8px 16px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        ✕ Clear
                    </button>
                </div>
            </div>

            <!-- Bonuses Table -->
            <div style="padding: 20px; overflow-x: auto;">
                <div id="bonuses-list-container">
                    <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                        <p>Loading bonuses and incentives...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Bonus Modal -->
        <div id="add-bonus-modal" style="display: none; position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
                <div style="background: white; border-radius: 10px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-width: 500px; width: 100%; overflow: hidden;">
                    <form id="add-bonus-form">
                        <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0;">Add Manual Bonus</h3>
                                <button type="button" onclick="closeAddBonusModal()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280;">✕</button>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Employee:</label>
                                    <select id="add-employee" name="employee_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                        <option value="">Select Employee</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Bonus Type:</label>
                                    <select id="add-bonus-type" name="bonus_type" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                        <option value="">Select Bonus Type</option>
                                        <option value="Mid-Year Bonus">Mid-Year Bonus</option>
                                        <option value="Year-End Bonus">Year-End Bonus</option>
                                        <option value="Hazard Pay">Hazard Pay</option>
                                        <option value="Night Differential">Night Differential</option>
                                        <option value="Overtime Allowance">Overtime Allowance</option>
                                        <option value="Performance Incentive">Performance Incentive</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Bonus Name:</label>
                                    <input type="text" id="add-bonus-name" name="bonus_name" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Amount:</label>
                                    <input type="number" id="add-amount" name="amount" required step="0.01" min="0" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Effective Date:</label>
                                    <input type="date" id="add-effective-date" name="effective_date" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Notes (Optional):</label>
                                    <textarea id="add-notes" name="notes" rows="3" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: inherit;"></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div style="padding: 15px 20px; background: #f3f4f6; display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" onclick="closeAddBonusModal()" style="padding: 8px 16px; background: white; border: 1px solid #d1d5db; border-radius: 6px; color: #374151; font-size: 14px; font-weight: 500; cursor: pointer;">
                                Cancel
                            </button>
                            <button type="submit" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                                Add Bonus
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Compute Bonuses Modal -->
        <div id="compute-bonuses-modal" style="display: none; position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
                <div style="background: white; border-radius: 10px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-width: 500px; width: 100%; overflow: hidden;">
                    <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0;">Compute Bonuses</h3>
                            <button type="button" onclick="closeComputeBonusesModal()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280;">✕</button>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <div>
                                <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Payroll Run:</label>
                                <select id="compute-payroll-run" name="payroll_run_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                    <option value="">Select Payroll Run</option>
                                </select>
                            </div>

                            <div>
                                <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Department:</label>
                                <select id="compute-department" name="department_id" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                    <option value="">All Departments</option>
                                </select>
                            </div>
                            
                            <div style="background: #eff6ff; padding: 15px; border-radius: 6px; border: 1px solid #bfdbfe;">
                                <h4 style="font-size: 14px; font-weight: 600; color: #1e40af; margin: 0 0 10px 0;">Computation Rules:</h4>
                                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e40af;">
                                    <li>Mid-Year Bonus: 25% of base salary</li>
                                    <li>Year-End Bonus: 50% of base salary</li>
                                    <li>Hazard Pay: Fixed amount</li>
                                    <li>Night Differential: 10% of base salary</li>
                                    <li>Overtime Allowance: Fixed amount</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div style="padding: 15px 20px; background: #f3f4f6; display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" onclick="closeComputeBonusesModal()" style="padding: 8px 16px; background: white; border: 1px solid #d1d5db; border-radius: 6px; color: #374151; font-size: 14px; font-weight: 500; cursor: pointer;">
                            Cancel
                        </button>
                        <button onclick="executeBonusComputation()" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                            Compute Bonuses
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

    // Set up event listeners
    setupBonusEventListeners();
    
    // Load initial data
    await loadBonuses();
}

/**
 * Set up event listeners for bonuses
 */
function setupBonusEventListeners() {
    const searchInput = document.getElementById('bonus-search-input');
    if (searchInput) {
        // Remove existing listener first to prevent duplicates
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        const updatedSearchInput = document.getElementById('bonus-search-input');
        updatedSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => loadBonuses(), 500);
        });
    }

    const addBonusForm = document.getElementById('add-bonus-form');
    if (addBonusForm) {
        // Remove existing listener first
        const newForm = addBonusForm.cloneNode(true);
        addBonusForm.parentNode.replaceChild(newForm, addBonusForm);
        
        const updatedForm = document.getElementById('add-bonus-form');
        updatedForm.addEventListener('submit', handleAddBonus);
    }
}

/**
 * Load bonuses from API
 */
async function loadBonuses() {
    console.log("[Bonuses] Loading bonuses...");
    const container = document.getElementById('bonuses-list-container');
    if (!container) return;
    
    // Bonuses and incentives are managed through payroll computation
    allBonusesData = [];
    renderBonusesTable([]);
    
    // Show informational message
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = 'padding: 20px; background: #dbeafe; border: 1px solid #93c5fd; border-radius: 6px; margin-top: 15px;';
    msgDiv.innerHTML = `
        <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
            💡 <strong>Note:</strong> Bonuses and incentives are computed as part of the <strong>Payroll Processing</strong> workflow. 
            Go to <strong>Payroll Runs</strong> section to manage payroll and view computed bonuses.
        </p>
    `;
    container.parentNode.insertBefore(msgDiv, container.nextSibling);
}

/**
 * Render bonuses table
 */
function renderBonusesTable(bonuses) {
    console.log("[Bonuses] Rendering table...");
    const container = document.getElementById('bonuses-list-container');
    if (!container) return;

    if (!bonuses || bonuses.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: #64748b;"><p>No bonuses found</p></div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Effective Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    bonuses.forEach((bonus) => {
        const statusClass = bonus.status === 'active' ? 'status-badge-active' : 'status-badge-inactive';
        
        html += `
            <tr>
                <td>${bonus.employee_name || 'N/A'}</td>
                <td>
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; background: #f0f4ff; color: #3b82f6; font-size: 12px; font-weight: 500;">
                        ${bonus.bonus_type || 'N/A'}
                    </span>
                </td>
                <td>${bonus.bonus_name || 'N/A'}</td>
                <td style="color: #10b981; font-weight: 600;">₱${parseFloat(bonus.amount || 0).toLocaleString('en-PH')}</td>
                <td>${bonus.effective_date ? new Date(bonus.effective_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <span class="${statusClass}">
                        ${bonus.status || 'unknown'}
                    </span>
                </td>
                <td style="text-align: center;">
                    <button onclick="viewBonusDetails(${bonus.id || 0})" class="action-btn">👁️ View</button>
                    <button onclick="editBonusModal(${bonus.id || 0})" class="action-btn">✏️ Edit</button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

/**
 * Handle add bonus form
 */
async function handleAddBonus(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(PAYROLL_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();

        if (result.success) {
            alert('Bonus added successfully!');
            closeAddBonusModal();
            loadBonuses();
        } else {
            throw new Error(result.message || 'Failed to add bonus');
        }
    } catch (error) {
        console.error('Error adding bonus:', error);
        alert('Error adding bonus: ' + error.message);
    }
}

/**
 * Execute bonus computation
 */
async function executeBonusComputation() {
    const payrollRunId = document.getElementById('compute-payroll-run').value;
    const departmentId = document.getElementById('compute-department').value;
    
    if (!payrollRunId) {
        alert('Please select a payroll run');
        return;
    }
    
    try {
        const response = await fetch(`${PAYROLL_API}?action=compute`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payroll_run_id: payrollRunId,
                department_id: departmentId || null
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        
        if (result.success) {
            alert('Bonuses computed successfully!');
            closeComputeBonusesModal();
            loadBonuses();
        } else {
            throw new Error(result.message || 'Failed to compute bonuses');
        }
    } catch (error) {
        console.error('Error computing bonuses:', error);
        alert('Error computing bonuses: ' + error.message);
    }
}

// Global window functions for event handlers
window.refreshBonuses = function() {
    loadBonuses();
};

window.applyBonusFilters = function() {
    loadBonuses();
};

window.clearBonusFilters = function() {
    document.getElementById('bonus-search-input').value = '';
    document.getElementById('bonus-type-filter').value = '';
    document.getElementById('bonus-status-filter').value = '';
    loadBonuses();
};

window.showAddBonusModal = function() {
    document.getElementById('add-bonus-modal').style.display = 'flex';
};

window.closeAddBonusModal = function() {
    document.getElementById('add-bonus-modal').style.display = 'none';
    document.getElementById('add-bonus-form').reset();
};

window.showComputeBonusesModal = function() {
    document.getElementById('compute-bonuses-modal').style.display = 'flex';
};

window.closeComputeBonusesModal = function() {
    document.getElementById('compute-bonuses-modal').style.display = 'none';
};

window.viewBonusDetails = function(bonusId) {
    alert(`Viewing bonus ${bonusId} - functionality coming soon!`);
};

window.editBonusModal = function(bonusId) {
    alert(`Editing bonus ${bonusId} - functionality coming soon!`);
};

window.exportBonusData = function() {
    if (!allBonusesData || allBonusesData.length === 0) {
        alert('No bonus data available to export.');
        return;
    }

    const headers = ['Employee', 'Type', 'Name', 'Amount', 'Effective Date', 'Status'];
    const csvContent = [
        headers.join(','),
        ...allBonusesData.map(bonus => [
            bonus.employee_name || '',
            bonus.bonus_type || '',
            bonus.bonus_name || '',
            bonus.amount || '',
            bonus.effective_date || '',
            bonus.status || ''
        ].map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bonuses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

window.executeBonusComputation = function() {
    executeBonusComputation();
};
/**
 * ===== DEDUCTIONS SECTION =====
 * Manages statutory and voluntary deductions
 */

const DEDUCTIONS_API = `${API_BASE_URL}/payroll/payroll.php`;

let allDeductionsData = [];
let deductionSearchDebounceTimer = null;

/**
 * Display Deductions Section
 */
export async function displayDeductionsSection() {
    console.log("[Deductions] Displaying Deductions Section...");
    
    const container = document.getElementById('deductionsContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header with Actions -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: #fef2f2;">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <h3 style="font-size: 20px; font-weight: 600; color: #7f1d1d; margin: 0;">Deductions Management</h3>
                        <p style="font-size: 14px; color: #991b1b; margin-top: 5px;">Manage statutory and voluntary deductions</p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="refreshDeductions()" style="padding: 8px 16px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; color: #0f172a; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            🔄 Refresh
                        </button>
                        <button onclick="showAddDeductionModal()" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            ➕ Add Deduction
                        </button>
                        <button onclick="showComputeDeductionsModal()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            🧮 Compute Deductions
                        </button>
                        <button onclick="exportDeductionsData()" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            📊 Export
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div style="padding: 15px 20px; background: #f9fafb; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <input id="deduction-search-input" type="text" placeholder="Search by employee, deduction type..." 
                           style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; flex: 1; min-width: 200px; font-size: 14px;">
                    
                    <select id="deduction-type-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Types</option>
                        <option value="SSS">SSS</option>
                        <option value="PhilHealth">PhilHealth</option>
                        <option value="Pag-IBIG">Pag-IBIG</option>
                        <option value="Tax">Tax</option>
                        <option value="HMO">HMO</option>
                        <option value="Loan">Loan</option>
                        <option value="Cash Advance">Cash Advance</option>
                    </select>
                    
                    <select id="deduction-category-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Categories</option>
                        <option value="statutory">Statutory</option>
                        <option value="voluntary">Voluntary</option>
                    </select>
                    
                    <button onclick="applyDeductionFilters()" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        🔍 Filter
                    </button>
                    
                    <button onclick="clearDeductionFilters()" style="padding: 8px 16px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        ✕ Clear
                    </button>
                </div>
            </div>

            <!-- Deductions Table -->
            <div style="padding: 20px; overflow-x: auto;">
                <div id="deductions-list-container">
                    <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                        <p>Loading deductions...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Deduction Modal -->
        <div id="add-deduction-modal" style="display: none; position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
                <div style="background: white; border-radius: 10px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-width: 500px; width: 100%; overflow: hidden;">
                    <form id="add-deduction-form">
                        <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0;">Add Deduction</h3>
                                <button type="button" onclick="closeAddDeductionModal()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280;">✕</button>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Employee:</label>
                                    <select id="add-deduction-employee" name="employee_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                        <option value="">Select Employee</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Deduction Type:</label>
                                    <select id="add-deduction-type" name="deduction_type" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                        <option value="">Select Type</option>
                                        <option value="HMO">HMO Premium</option>
                                        <option value="Loan">Loan Payment</option>
                                        <option value="Cash Advance">Cash Advance</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Amount:</label>
                                    <input type="number" id="add-deduction-amount" name="amount" required step="0.01" min="0" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Effective Date:</label>
                                    <input type="date" id="add-deduction-effective-date" name="effective_date" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Notes (Optional):</label>
                                    <textarea id="add-deduction-notes" name="notes" rows="3" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: inherit;"></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div style="padding: 15px 20px; background: #f3f4f6; display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" onclick="closeAddDeductionModal()" style="padding: 8px 16px; background: white; border: 1px solid #d1d5db; border-radius: 6px; color: #374151; font-size: 14px; font-weight: 500; cursor: pointer;">
                                Cancel
                            </button>
                            <button type="submit" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                                Add Deduction
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Compute Deductions Modal -->
        <div id="compute-deductions-modal" style="display: none; position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
                <div style="background: white; border-radius: 10px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-width: 500px; width: 100%; overflow: hidden;">
                    <form id="compute-deductions-form">
                        <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0;">Compute Deductions</h3>
                                <button type="button" onclick="closeComputeDeductionsModal()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280;">✕</button>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Payroll Run:</label>
                                    <select id="compute-deduction-payroll-run" name="payroll_run_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                        <option value="">Select Payroll Run</option>
                                    </select>
                                </div>

                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Department (Optional):</label>
                                    <select id="compute-deduction-department" name="department_id" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                        <option value="">All Departments</option>
                                    </select>
                                </div>
                                
                                <div style="background: #dbeafe; padding: 12px; border-radius: 6px; border: 1px solid #93c5fd;">
                                    <p style="margin: 0; font-size: 13px; color: #1e40af;">
                                        <strong>Note:</strong> This will compute all statutory deductions (SSS, PhilHealth, Pag-IBIG, Tax) and apply existing voluntary deductions.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="padding: 15px 20px; background: #f3f4f6; display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" onclick="closeComputeDeductionsModal()" style="padding: 8px 16px; background: white; border: 1px solid #d1d5db; border-radius: 6px; color: #374151; font-size: 14px; font-weight: 500; cursor: pointer;">
                                Cancel
                            </button>
                            <button type="submit" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                                Compute Deductions
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

    setupDeductionEventListeners();
    await loadDeductions();
}

/**
 * Setup deduction event listeners
 */
function setupDeductionEventListeners() {
    const searchInput = document.getElementById('deduction-search-input');
    if (searchInput) {
        // Remove existing listener first to prevent duplicates
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        const updatedSearchInput = document.getElementById('deduction-search-input');
        updatedSearchInput.addEventListener('input', () => {
            clearTimeout(deductionSearchDebounceTimer);
            deductionSearchDebounceTimer = setTimeout(() => loadDeductions(), 500);
        });
    }

    const addDeductionForm = document.getElementById('add-deduction-form');
    if (addDeductionForm) {
        const newForm = addDeductionForm.cloneNode(true);
        addDeductionForm.parentNode.replaceChild(newForm, addDeductionForm);
        
        const updatedForm = document.getElementById('add-deduction-form');
        updatedForm.addEventListener('submit', handleAddDeduction);
    }

    const computeDeductionsForm = document.getElementById('compute-deductions-form');
    if (computeDeductionsForm) {
        const newForm = computeDeductionsForm.cloneNode(true);
        computeDeductionsForm.parentNode.replaceChild(newForm, computeDeductionsForm);
        
        const updatedForm = document.getElementById('compute-deductions-form');
        updatedForm.addEventListener('submit', handleComputeDeductions);
    }
}

/**
 * Load deductions from API
 */
async function loadDeductions() {
    console.log("[Deductions] Loading deductions...");
    const container = document.getElementById('deductions-list-container');
    if (!container) return;
    
    // Deductions are managed through payroll computation
    allDeductionsData = [];
    renderDeductionsTable([]);
    
    // Show informational message
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = 'padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; margin-top: 15px;';
    msgDiv.innerHTML = `
        <p style="margin: 0; color: #991b1b; font-size: 14px;">
            💡 <strong>Note:</strong> Statutory deductions (SSS, PhilHealth, Pag-IBIG, BIR Tax) are automatically computed as part of <strong>Payroll Processing</strong>. 
            Go to <strong>Payroll Runs</strong> section to manage payroll and view detailed deductions.
        </p>
    `;
    container.parentNode.insertBefore(msgDiv, container.nextSibling);
}

/**
 * Render deductions table
 */
function renderDeductionsTable(deductions) {
    console.log("[Deductions] Rendering table...");
    const container = document.getElementById('deductions-list-container');
    if (!container) return;

    if (!deductions || deductions.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: #64748b;"><p>No deductions found</p></div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Effective Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    deductions.forEach((deduction) => {
        const categoryColor = deduction.category === 'statutory' ? '#dc2626' : '#3b82f6';
        const categoryBg = deduction.category === 'statutory' ? '#fee2e2' : '#dbeafe';
        const statusClass = deduction.status === 'active' ? 'status-badge-active' : 'status-badge-inactive';
        
        html += `
            <tr>
                <td>${deduction.employee_name || 'N/A'}</td>
                <td>
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; background: #f0f4ff; color: #3b82f6; font-size: 12px; font-weight: 500;">
                        ${deduction.deduction_type || 'N/A'}
                    </span>
                </td>
                <td style="color: #ef4444; font-weight: 600;">₱${parseFloat(deduction.amount || 0).toLocaleString('en-PH')}</td>
                <td>
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; background: ${categoryBg}; color: ${categoryColor}; font-size: 12px; font-weight: 500; text-transform: capitalize;">
                        ${deduction.category || 'unknown'}
                    </span>
                </td>
                <td>${deduction.effective_date ? new Date(deduction.effective_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <span class="${statusClass}">
                        ${deduction.status || 'unknown'}
                    </span>
                </td>
                <td style="text-align: center;">
                    <button onclick="viewDeductionDetails(${deduction.id || 0})" class="action-btn">👁️ View</button>
                    ${deduction.category === 'voluntary' ? `<button onclick="editDeductionModal(${deduction.id || 0})" class="action-btn">✏️ Edit</button>` : ''}
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

/**
 * Handle add deduction form
 */
async function handleAddDeduction(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(DEDUCTIONS_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();

        if (result.success) {
            alert('Deduction added successfully!');
            closeAddDeductionModal();
            loadDeductions();
        } else {
            throw new Error(result.message || 'Failed to add deduction');
        }
    } catch (error) {
        console.error('Error adding deduction:', error);
        alert('Error adding deduction: ' + error.message);
    }
}

/**
 * Handle compute deductions form
 */
async function handleComputeDeductions(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(`${DEDUCTIONS_API}?action=compute`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        
        if (result.success) {
            alert('Deductions computed successfully!');
            closeComputeDeductionsModal();
            loadDeductions();
        } else {
            throw new Error(result.message || 'Failed to compute deductions');
        }
    } catch (error) {
        console.error('Error computing deductions:', error);
        alert('Error computing deductions: ' + error.message);
    }
}

// Global window functions for deductions
window.refreshDeductions = function() {
    loadDeductions();
};

window.applyDeductionFilters = function() {
    loadDeductions();
};

window.clearDeductionFilters = function() {
    document.getElementById('deduction-search-input').value = '';
    document.getElementById('deduction-type-filter').value = '';
    document.getElementById('deduction-category-filter').value = '';
    loadDeductions();
};

window.showAddDeductionModal = function() {
    document.getElementById('add-deduction-modal').style.display = 'flex';
};

window.closeAddDeductionModal = function() {
    document.getElementById('add-deduction-modal').style.display = 'none';
    document.getElementById('add-deduction-form').reset();
};

window.showComputeDeductionsModal = function() {
    document.getElementById('compute-deductions-modal').style.display = 'flex';
};

window.closeComputeDeductionsModal = function() {
    document.getElementById('compute-deductions-modal').style.display = 'none';
};

window.viewDeductionDetails = function(deductionId) {
    alert(`Viewing deduction ${deductionId} - functionality coming soon!`);
};

window.editDeductionModal = function(deductionId) {
    alert(`Editing deduction ${deductionId} - functionality coming soon!`);
};

window.exportDeductionsData = function() {
    if (!allDeductionsData || allDeductionsData.length === 0) {
        alert('No deduction data available to export.');
        return;
    }

    const headers = ['Employee', 'Type', 'Amount', 'Category', 'Effective Date', 'Status'];
    const csvContent = [
        headers.join(','),
        ...allDeductionsData.map(deduction => [
            deduction.employee_name || '',
            deduction.deduction_type || '',
            deduction.amount || '',
            deduction.category || '',
            deduction.effective_date || '',
            deduction.status || ''
        ].map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deductions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * PAYROLL Module - Payroll Runs Section
 * Manages payroll run processing, versioning, and payslips
 */

let payrollRunsData = [];

/**
 * Displays the Payroll Runs section.
 */
export async function displayPayrollRunsSection() {
    console.log("[Payroll Runs] Displaying Payroll Runs Section...");
    const container = document.getElementById('payrollRunsContainer');
    if (!container) {
        console.error("displayPayrollRunsSection: Container not found.");
        return;
    }

    container.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header with Actions -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: #f0f7ff;">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <h3 style="font-size: 20px; font-weight: 600; color: #1e40af; margin: 0;">Payroll Runs Dashboard</h3>
                        <p style="font-size: 14px; color: #1e3a8a; margin-top: 5px;">Process payroll per cutoff - pulls DTR from HR3, salary rates from HR1/HR2</p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="refreshPayrollRuns()" style="padding: 8px 16px; border: 1px solid #3b82f6; border-radius: 6px; background: white; color: #1e40af; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            🔄 Refresh
                        </button>
                        <button onclick="showCreateRunModal()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            ➕ New Payroll Run
                        </button>
                        <button onclick="exportPayrollSummary()" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            📊 Export Summary
                        </button>
                        <button onclick="showVersionLog()" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            📜 Version Log
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div style="padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <div style="flex: 1; min-width: 200px; position: relative;">
                        <input id="payroll-search-input" type="text" placeholder="Search by branch or period..." 
                               style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; width: 100%; font-size: 14px; box-sizing: border-box;">
                    </div>
                    
                    <select id="branch-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Branches</option>
                    </select>
                    
                    <select id="status-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Status</option>
                        <option value="Draft">Draft</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                        <option value="Approved">Approved</option>
                        <option value="Locked">Locked</option>
                    </select>
                    
                    <button onclick="applyPayrollFilters()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        🔍 Filter
                    </button>
                    
                    <button onclick="clearPayrollFilters()" style="padding: 8px 16px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        ✕ Clear
                    </button>
                </div>
            </div>

            <!-- Payroll Runs Table -->
            <div style="padding: 20px; overflow-x: auto;">
                <div id="payroll-runs-list-container" style="text-align: center; padding: 30px;">
                    <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #3b82f6; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="color: #9ca3af; margin-top: 15px;">Loading payroll runs...</p>
                </div>
            </div>
        </div>

        <!-- Create Payroll Run Modal -->
        <div id="create-run-modal" style="position: fixed; inset: 0; z-index: 50; display: none; overflow-y: auto; background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: flex-end; justify-content: center; min-height: 100vh; padding: 15px;">
                <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 500px;">
                    <form id="create-payroll-run-form" style="display: contents;">
                        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Create New Payroll Run</h3>
                                <button type="button" onclick="closeCreateRunModal()" style="background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer;">✕</button>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Branch:</label>
                                    <select id="create-branch" name="branch_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                        <option value="">Select Branch</option>
                                    </select>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <div>
                                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Pay Period Start:</label>
                                        <input type="date" id="create-start-date" name="pay_period_start" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Pay Period End:</label>
                                        <input type="date" id="create-end-date" name="pay_period_end" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                    </div>
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Payment Date:</label>
                                    <input type="date" id="create-pay-date" name="pay_date" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                </div>

                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Notes (Optional):</label>
                                    <textarea id="create-notes" name="notes" rows="3" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; font-family: Arial, sans-serif;" placeholder="Additional notes for this payroll run..."></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div style="padding: 15px 20px; background: #f3f4f6; display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="submit" style="padding: 10px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                                ✓ Create Run
                            </button>
                            <button type="button" onclick="closeCreateRunModal()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>`;

    requestAnimationFrame(async () => {
        await loadBranches();
        await loadPayrollRuns();
        
        const createRunForm = document.getElementById('create-payroll-run-form');
        if (createRunForm) {
            if (!createRunForm.hasAttribute('data-listener-attached')) {
                createRunForm.addEventListener('submit', handleCreatePayrollRun);
                createRunForm.setAttribute('data-listener-attached', 'true');
            }
        }
    });
}

/**
 * Load branches for dropdowns
 */
async function loadBranches() {
    try {
        const branches = [
            { BranchID: 1, BranchCode: 'MAIN', BranchName: 'Main Hospital' }
        ];
        
        const branchFilter = document.getElementById('branch-filter');
        const createBranch = document.getElementById('create-branch');
        
        if (branchFilter) {
            branchFilter.innerHTML = '<option value="">All Branches</option>' + 
                branches.map(b => `<option value="${b.BranchID}">${b.BranchName}</option>`).join('');
        }
        
        if (createBranch) {
            createBranch.innerHTML = '<option value="">Select Branch</option>' + 
                branches.map(b => `<option value="${b.BranchID}">${b.BranchName}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading branches:', error);
    }
}

/**
 * Fetches payroll run records from the API.
 */
async function loadPayrollRuns() {
    console.log("[Load] Loading Payroll Runs...");
    const container = document.getElementById('payroll-runs-list-container');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 30px;"><div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #3b82f6; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div><p style="color: #9ca3af; margin-top: 15px;">Loading payroll runs...</p></div>';

    const params = new URLSearchParams();
    const branchFilter = document.getElementById('branch-filter')?.value;
    const statusFilter = document.getElementById('status-filter')?.value;
    const searchTerm = document.getElementById('payroll-search-input')?.value;
    
    if (branchFilter) params.set('branch_id', branchFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (searchTerm) params.set('search', searchTerm);
    
    params.set('page', '1');
    params.set('limit', '50');

    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payroll.php?${params.toString()}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/hospital_4/index.php';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        if (result.success && result.data) {
            renderPayrollRunsTable(result.data.items || [], result.data.pagination || {});
        } else {
            console.error("Error fetching payroll runs:", result.message);
            container.innerHTML = `<p style="color: #dc2626; text-align: center; padding: 20px;">Error: ${result.message || 'Failed to load payroll runs'}</p>`;
        }
    } catch (error) {
        console.error('Error loading payroll runs:', error);
        container.innerHTML = `<p style="color: #dc2626; text-align: center; padding: 20px;">Could not load payroll runs. ${error.message}</p>`;
    }
}

/**
 * Renders the payroll runs data into an HTML table.
 */
function renderPayrollRunsTable(payrollRuns, pagination = {}) {
    console.log("[Render] Rendering Payroll Runs Table...");
    const container = document.getElementById('payroll-runs-list-container');
    if (!container) return;

    if (!payrollRuns || !Array.isArray(payrollRuns) || payrollRuns.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <div style="font-size: 50px; color: #d1d5db; margin-bottom: 15px;">📋</div>
                <h3 style="font-size: 18px; font-weight: 500; color: #111827; margin: 0 0 10px 0;">No payroll runs found</h3>
                <p style="color: #9ca3af; margin: 0;">Create your first payroll run to get started.</p>
            </div>`;
        return;
    }

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    const headerRow = table.createTHead().insertRow();
    headerRow.style.background = '#f0f7ff';
    headerRow.style.borderBottom = '2px solid #e2e8f0';
    
    const headers = ['Run ID', 'Branch', 'Pay Period', 'Payment Date', 'Status', 'Version', 'Employees', 'Gross Pay', 'Deductions', 'Net Pay', 'Actions'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.cssText = 'padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;';
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    tbody.style.borderTop = '1px solid #e2e8f0';

    payrollRuns.forEach((run, index) => {
        const row = tbody.insertRow();
        row.style.borderBottom = '1px solid #f3f4f6';
        row.style.background = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        
        const cells = [
            `#${run.PayrollRunID}`,
            run.BranchName || 'Unknown',
            `${new Date(run.PayPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(run.PayPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            new Date(run.PayDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            run.Status || 'Unknown',
            `v${run.Version || 1}`,
            run.TotalEmployees || 0,
            parseFloat(run.TotalGrossPay || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }),
            parseFloat(run.TotalDeductions || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }),
            parseFloat(run.TotalNetPay || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
        ];
        
        cells.forEach((cellText, index) => {
            const cell = row.insertCell();
            cell.textContent = cellText;
            cell.style.cssText = 'padding: 12px 15px; font-size: 13px; white-space: nowrap;';
            
            if (index === 0) cell.style.color = '#64748b';
            if (index === 4) cell.style.color = getStatusColor(cellText);
            if (index === 7) cell.style.color = '#059669';
            if (index === 8) cell.style.color = '#dc2626';
            if (index === 9) cell.style.color = '#0369a1'; 
        });
        
        const actionsCell = row.insertCell();
        actionsCell.style.cssText = 'padding: 12px 15px; font-size: 13px; white-space: nowrap; text-align: center;';
        
        const viewBtn = document.createElement('button');
        viewBtn.innerHTML = '👁️ View';
        viewBtn.style.cssText = 'padding: 6px 12px; border: 1px solid #3b82f6; border-radius: 4px; background: #eff6ff; color: #1e40af; font-size: 12px; cursor: pointer; margin-right: 8px; transition: all 0.2s;';
        viewBtn.onclick = () => viewRunDetails(run.PayrollRunID);
        actionsCell.appendChild(viewBtn);

        if (run.Status === 'Draft') {
            const processBtn = document.createElement('button');
            processBtn.innerHTML = '⚙️ Process';
            processBtn.style.cssText = 'padding: 6px 12px; border: 1px solid #10b981; border-radius: 4px; background: #f0fdf4; color: #065f46; font-size: 12px; cursor: pointer; margin-right: 8px; transition: all 0.2s;';
            processBtn.onclick = () => processRun(run.PayrollRunID);
            actionsCell.appendChild(processBtn);
        }

        if (run.Status === 'Completed') {
            const approveBtn = document.createElement('button');
            approveBtn.innerHTML = '✓ Approve';
            approveBtn.style.cssText = 'padding: 6px 12px; border: 1px solid #7c3aed; border-radius: 4px; background: #faf5ff; color: #5b21b6; font-size: 12px; cursor: pointer; margin-right: 8px; transition: all 0.2s;';
            approveBtn.onclick = () => approveRun(run.PayrollRunID);
            actionsCell.appendChild(approveBtn);
        }

        if (run.Status === 'Approved') {
            const lockBtn = document.createElement('button');
            lockBtn.innerHTML = '🔒 Lock';
            lockBtn.style.cssText = 'padding: 6px 12px; border: 1px solid #dc2626; border-radius: 4px; background: #fef2f2; color: #991b1b; font-size: 12px; cursor: pointer; transition: all 0.2s;';
            lockBtn.onclick = () => lockRun(run.PayrollRunID);
            actionsCell.appendChild(lockBtn);
        }
    });

    container.innerHTML = '';
    container.appendChild(table);
}

function getStatusColor(status) {
    const colors = {
        'Draft': '#6366f1',
        'Processing': '#f59e0b',
        'Completed': '#10b981',
        'Approved': '#7c3aed',
        'Locked': '#dc2626'
    };
    return colors[status] || '#6b7280';
}

// Modal functions
window.showCreateRunModal = function() {
    const modal = document.getElementById('create-run-modal');
    if (modal) {
        modal.style.display = 'block';
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const payDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
        
        document.getElementById('create-start-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('create-end-date').value = endDate.toISOString().split('T')[0];
        document.getElementById('create-pay-date').value = payDate.toISOString().split('T')[0];
    }
};

window.closeCreateRunModal = function() {
    const modal = document.getElementById('create-run-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('create-payroll-run-form').reset();
    }
};

// Filter functions
window.applyPayrollFilters = function() {
    loadPayrollRuns();
};

window.clearPayrollFilters = function() {
    document.getElementById('branch-filter').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('payroll-search-input').value = '';
    loadPayrollRuns();
};

window.refreshPayrollRuns = function() {
    loadPayrollRuns();
};

// Export functionality
window.exportPayrollSummary = function() {
    const rows = document.querySelectorAll('#payroll-runs-list-container tbody tr');
    if (!rows || rows.length === 0) {
        alert('No payroll runs available to export.');
        return;
    }

    const headers = ['Run ID', 'Branch', 'Pay Period', 'Payment Date', 'Status', 'Version', 'Employees', 'Gross Pay', 'Deductions', 'Net Pay'];
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
    link.download = `payroll_summary_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Version log functionality
window.showVersionLog = function() {
    alert('Version Log Feature:\n\n• Track all payroll run versions\n• Reprocess previous runs for corrections\n• Audit trail of all changes\n• Rollback capabilities\n\nThis feature will be implemented in the next update.');
};

/**
 * Handles the submission of the create payroll run form.
 */
async function handleCreatePayrollRun(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!form || !submitButton) return;

    const branchId = form.elements['branch_id'].value;
    const startDate = form.elements['pay_period_start'].value;
    const endDate = form.elements['pay_period_end'].value;
    const paymentDate = form.elements['pay_date'].value;

    if (!branchId || !startDate || !endDate || !paymentDate) {
        alert('All fields are required.');
        return;
    }
    if (endDate < startDate) {
        alert('End Date cannot be before Start Date.');
        return;
    }
    if (paymentDate < endDate) {
        alert('Payment Date cannot be before Pay Period End Date.');
        return;
    }

    const formData = {
        branch_id: parseInt(branchId),
        pay_period_start: startDate,
        pay_period_end: endDate,
        pay_date: paymentDate,
        notes: form.elements['notes'].value || null
    };

    submitButton.disabled = true;
    submitButton.textContent = '⏳ Creating...';

    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payroll.php`, {
            method: 'POST',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        alert('Payroll run created successfully!');
        closeCreateRunModal();
        await loadPayrollRuns();

    } catch (error) {
        console.error('Error creating payroll run:', error);
        alert(`Error: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = '✓ Create Run';
    }
}

// Action functions
async function viewRunDetails(runId) {
    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payroll.php?id=${runId}`, {
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        if (result.success) {
            const run = result.data;
            alert(`Payroll Run #${run.PayrollRunID}\n\nBranch: ${run.BranchName || 'N/A'}\nPeriod: ${run.PayPeriodStart} to ${run.PayPeriodEnd}\nPayment Date: ${run.PayDate || 'N/A'}\nStatus: ${run.Status}\nEmployees: ${run.TotalEmployees}\nGross Pay: ₱${parseFloat(run.TotalGrossPay || 0).toLocaleString('en-PH', {minimumFractionDigits:2})}\nDeductions: ₱${parseFloat(run.TotalDeductions || 0).toLocaleString('en-PH', {minimumFractionDigits:2})}\nNet Pay: ₱${parseFloat(run.TotalNetPay || 0).toLocaleString('en-PH', {minimumFractionDigits:2})}`);
        } else {
            throw new Error(result.message || 'Failed to load run details');
        }
    } catch (error) {
        console.error('Error viewing run details:', error);
        alert(`Error: ${error.message}`);
    }
}

window.viewRunDetails = viewRunDetails;

async function processRun(runId) {
    if (!confirm(`Are you sure you want to process Payroll Run #${runId}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payroll.php?id=${runId}&action=compute`, {
            method: 'POST',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        if (result.success) {
            alert('Payroll run processed successfully!');
            await loadPayrollRuns();
        } else {
            throw new Error(result.message || 'Failed to process run');
        }
    } catch (error) {
        console.error('Error processing run:', error);
        alert(`Error: ${error.message}`);
    }
}

window.processRun = processRun;

async function approveRun(runId) {
    if (!confirm(`Are you sure you want to approve Payroll Run #${runId}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payroll.php?id=${runId}&action=approve`, {
            method: 'POST',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        if (result.success) {
            alert('Payroll run approved successfully!');
            await loadPayrollRuns();
        } else {
            throw new Error(result.message || 'Failed to approve run');
        }
    } catch (error) {
        console.error('Error approving run:', error);
        alert(`Error: ${error.message}`);
    }
}

window.approveRun = approveRun;

async function lockRun(runId) {
    if (!confirm(`Are you sure you want to lock Payroll Run #${runId}? This action cannot be undone.`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payroll.php?id=${runId}&action=lock`, {
            method: 'POST',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        if (result.success) {
            alert('Payroll run locked successfully!');
            await loadPayrollRuns();
        } else {
            throw new Error(result.message || 'Failed to lock run');
        }
    } catch (error) {
        console.error('Error locking run:', error);
        alert(`Error: ${error.message}`);
    }
}

window.lockRun = lockRun;

/**
 * Show Compute Payroll Modal
 */
window.showComputePayrollModal = function(payrollRunId) {
    const modal = document.createElement('div');
    modal.id = 'compute-payroll-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; min-height: 100vh; padding: 15px; background: rgba(0,0,0,0.5);';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 500px;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Compute Payroll</h3>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">This will calculate salaries for all employees in this payroll run based on:</p>
                <ul style="font-size: 13px; color: #6b7280; margin: 10px 0; padding-left: 20px;">
                    <li>Attendance records and overtime hours</li>
                    <li>Salary grades and rates</li>
                    <li>Night differentials and holiday pay</li>
                    <li>Statutory contributions and taxes</li>
                </ul>
            </div>
            <div style="padding: 15px 20px; background: #f3f4f6; display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="document.getElementById('compute-payroll-modal').remove();" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                    Cancel
                </button>
                <button onclick="handleComputePayroll(${payrollRunId}); document.getElementById('compute-payroll-modal').remove();" style="padding: 10px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                    ✓ Compute Now
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

/**
 * Handle Compute Payroll
 */
async function handleComputePayroll(payrollRunId) {
    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payroll.php?id=${payrollRunId}&action=compute`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            alert(`✓ Payroll computed!\n\n${data.data.employees_computed} employees processed\nGross Total: ₱${parseFloat(data.data.total_gross).toLocaleString('en-PH', {minimumFractionDigits: 2})}`);
            await loadPayrollRuns();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        alert(`Error computing payroll: ${error.message}`);
    }
}

window.handleComputePayroll = handleComputePayroll;

/**
 * Show Approval Modal
 */
window.showApprovalModal = function(payrollRunId) {
    const modal = document.createElement('div');
    modal.id = 'approval-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; min-height: 100vh; padding: 15px; background: rgba(0,0,0,0.5);';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 500px;">
            <form id="approval-form" style="display: contents;">
                <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                    <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Approve Payroll</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Action:</label>
                            <select id="approval-status" name="status" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                <option value="approved">Approve</option>
                                <option value="rejected">Reject</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Notes (optional):</label>
                            <textarea id="approval-notes" name="notes" rows="4" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; font-family: Arial;"></textarea>
                        </div>
                    </div>
                </div>
                <div style="padding: 15px 20px; background: #f3f4f6; display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="document.getElementById('approval-modal').remove();" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        Cancel
                    </button>
                    <button type="submit" style="padding: 10px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        ✓ Proceed
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    const form = document.getElementById('approval-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        await handleApprovePayroll(payrollRunId, document.getElementById('approval-status').value, document.getElementById('approval-notes').value);
        document.getElementById('approval-modal').remove();
    };
};

/**
 * Handle Approve Payroll
 */
async function handleApprovePayroll(payrollRunId, status, notes) {
    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payroll.php?id=${payrollRunId}&action=approve`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ status, notes })
        });
        
        const data = await response.json();
        if (data.success) {
            alert(`✓ Payroll ${status}!`);
            await loadPayrollRuns();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        alert(`Error approving payroll: ${error.message}`);
    }
}

window.handleApprovePayroll = handleApprovePayroll;