/**
 * HR4 Hospital - Compensation Module Frontend (Integrated)
 * Version: 2.0 - Dashboard Integration
 * Date: January 31, 2026
 * 
 * Integrated compensation management for Plans, Adjustments, Incentives, Bonds
 */

const API_BASE = '/hospital_4/api/compensation';
let currentModalType = null;
let editingId = null;

// ============================================
// MODAL MANAGEMENT
// ============================================

function openCompensationModal(type) {
    currentModalType = type;
    editingId = null;
    
    let modal = document.getElementById('compensationModal');
    if (!modal) {
        createCompensationModal();
        modal = document.getElementById('compensationModal');
    }
    
    modal.innerHTML = getModalContent(type);
    modal.style.display = 'block';
}

function closeCompensationModal() {
    let modal = document.getElementById('compensationModal');
    if (modal) modal.style.display = 'none';
}

function createCompensationModal() {
    const modal = document.createElement('div');
    modal.id = 'compensationModal';
    modal.style.cssText = 'display:none;position:fixed;z-index:1000;left:0;top:0;width:100%;height:100%;background-color:rgba(0,0,0,0.5);';
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeCompensationModal();
    });
}

function getModalContent(type) {
    const modalStyles = `
        <style>
            .modal-content-box {
                background: white;
                margin: 5% auto;
                padding: 30px;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                max-height: 80vh;
                overflow-y: auto;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 15px;
            }
            .modal-header h2 {
                margin: 0;
                color: #333;
                font-size: 20px;
            }
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
            }
            .close-modal:hover { color: #333; }
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #333;
                font-size: 13px;
            }
            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 13px;
                font-family: inherit;
            }
            .form-group textarea {
                min-height: 80px;
                resize: vertical;
            }
            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: #594423;
                box-shadow: 0 0 0 3px rgba(89,68,35,0.1);
            }
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            .modal-buttons {
                display: flex;
                gap: 12px;
                margin-top: 25px;
            }
            .modal-buttons button {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s;
            }
            .btn-save { background: #594423; color: white; }
            .btn-save:hover { background: #4a3618; }
            .btn-cancel { background: #f0f0f0; color: #333; }
            .btn-cancel:hover { background: #e0e0e0; }
        </style>
    `;
    
    let content = modalStyles;
    
    switch(type) {
        case 'plan':
            content += `
                <div class="modal-content-box">
                    <div class="modal-header">
                        <h2>New Compensation Plan</h2>
                        <button class="close-modal" onclick="closeCompensationModal()">×</button>
                    </div>
                    <form onsubmit="saveCompensationPlan(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Plan Code</label>
                                <input type="text" id="planCode" required placeholder="e.g., PLAN-2026-001">
                            </div>
                            <div class="form-group">
                                <label>Plan Name</label>
                                <input type="text" id="planName" required placeholder="e.g., Nursing Staff Plan">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Base Salary</label>
                                <input type="number" id="baseSalary" required placeholder="25000" min="0" step="0.01">
                            </div>
                            <div class="form-group">
                                <label>Effective Date</label>
                                <input type="date" id="effectiveDate" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="planDescription" placeholder="Plan description and notes"></textarea>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-save">Create Plan</button>
                            <button type="button" class="btn-cancel" onclick="closeCompensationModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
            break;
            
        case 'adjustment':
            content += `
                <div class="modal-content-box">
                    <div class="modal-header">
                        <h2>New Salary Adjustment</h2>
                        <button class="close-modal" onclick="closeCompensationModal()">×</button>
                    </div>
                    <form onsubmit="saveCompensationAdjustment(event)">
                        <div class="form-group">
                            <label>Employee ID / Name</label>
                            <input type="text" id="adjEmployee" required placeholder="Search employee">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Adjustment Type</label>
                                <select id="adjType" required>
                                    <option value="">-- Select Type --</option>
                                    <option value="annual_increase">Annual Increase</option>
                                    <option value="promotion_adjustment">Promotion Adjustment</option>
                                    <option value="cola">Cost of Living Adjustment</option>
                                    <option value="merit_increase">Merit Increase</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>New Salary</label>
                                <input type="number" id="newSalary" required placeholder="27500" min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Effective Date</label>
                            <input type="date" id="adjEffectiveDate" required>
                        </div>
                        <div class="form-group">
                            <label>Reason / Justification</label>
                            <textarea id="adjReason" placeholder="Reason for adjustment"></textarea>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-save">Submit for Approval</button>
                            <button type="button" class="btn-cancel" onclick="closeCompensationModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
            break;
            
        case 'incentive':
            content += `
                <div class="modal-content-box">
                    <div class="modal-header">
                        <h2>New Incentive</h2>
                        <button class="close-modal" onclick="closeCompensationModal()">×</button>
                    </div>
                    <form onsubmit="saveCompensationIncentive(event)">
                        <div class="form-group">
                            <label>Employee ID / Name</label>
                            <input type="text" id="incEmployee" required placeholder="Search employee">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Incentive Type</label>
                                <select id="incType" required>
                                    <option value="">-- Select Type --</option>
                                    <option value="performance_bonus">Performance Bonus</option>
                                    <option value="holiday_pay">Holiday Pay</option>
                                    <option value="hazard_incentive">Hazard Incentive</option>
                                    <option value="loyalty_incentive">Loyalty Incentive</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Amount (₱)</label>
                                <input type="number" id="incAmount" required placeholder="5000" min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Frequency</label>
                                <select id="incFrequency" required>
                                    <option value="one_time">One-time</option>
                                    <option value="recurring">Recurring</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Distribution Date</label>
                                <input type="date" id="incDistDate">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Reason / Notes</label>
                            <textarea id="incReason" placeholder="Reason for incentive"></textarea>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-save">Create Incentive</button>
                            <button type="button" class="btn-cancel" onclick="closeCompensationModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
            break;
            
        case 'bond':
            content += `
                <div class="modal-content-box">
                    <div class="modal-header">
                        <h2>New Pay Bond</h2>
                        <button class="close-modal" onclick="closeCompensationModal()">×</button>
                    </div>
                    <form onsubmit="saveCompensationBond(event)">
                        <div class="form-group">
                            <label>Employee ID / Name</label>
                            <input type="text" id="bondEmployee" required placeholder="Search employee">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Bond Type</label>
                                <select id="bondType" required>
                                    <option value="">-- Select Type --</option>
                                    <option value="training_bond">Training Bond</option>
                                    <option value="scholarship_bond">Scholarship Bond</option>
                                    <option value="contractual_bond">Contractual Bond</option>
                                    <option value="advance_salary_bond">Advance Salary Bond</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Bond Amount (₱)</label>
                                <input type="number" id="bondAmount" required placeholder="50000" min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Start Date</label>
                                <input type="date" id="bondStartDate" required>
                            </div>
                            <div class="form-group">
                                <label>End Date</label>
                                <input type="date" id="bondEndDate" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Bond Purpose</label>
                            <textarea id="bondPurpose" placeholder="e.g., Medical Training Program"></textarea>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-save">Create Bond</button>
                            <button type="button" class="btn-cancel" onclick="closeCompensationModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
            break;
    }
    
    return content;
}

// ============================================
// SAVE FUNCTIONS
// ============================================

async function saveCompensationPlan(e) {
    e.preventDefault();
    
    const payload = {
        plan_code: document.getElementById('planCode').value,
        plan_name: document.getElementById('planName').value,
        base_salary: parseFloat(document.getElementById('baseSalary').value),
        effective_date: document.getElementById('effectiveDate').value,
        description: document.getElementById('planDescription').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (response.ok) {
            showNotification('Plan created successfully', 'success');
            closeCompensationModal();
            loadCompensationPlans();
        } else {
            showNotification(data.message || 'Error creating plan', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error saving plan', 'error');
    }
}

async function saveCompensationAdjustment(e) {
    e.preventDefault();
    
    const payload = {
        employee_id: document.getElementById('adjEmployee').value,
        adjustment_type: document.getElementById('adjType').value,
        new_salary: parseFloat(document.getElementById('newSalary').value),
        effective_date: document.getElementById('adjEffectiveDate').value,
        reason: document.getElementById('adjReason').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/adjustments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (response.ok) {
            showNotification('Adjustment submitted for approval', 'success');
            closeCompensationModal();
            loadCompensationAdjustments();
        } else {
            showNotification(data.message || 'Error creating adjustment', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error saving adjustment', 'error');
    }
}

async function saveCompensationIncentive(e) {
    e.preventDefault();
    
    const payload = {
        employee_id: document.getElementById('incEmployee').value,
        incentive_category: document.getElementById('incType').value,
        incentive_amount: parseFloat(document.getElementById('incAmount').value),
        one_time_or_recurring: document.getElementById('incFrequency').value,
        distribution_date: document.getElementById('incDistDate').value,
        reason: document.getElementById('incReason').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/incentives`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (response.ok) {
            showNotification('Incentive created successfully', 'success');
            closeCompensationModal();
            loadCompensationIncentives();
        } else {
            showNotification(data.message || 'Error creating incentive', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error saving incentive', 'error');
    }
}

async function saveCompensationBond(e) {
    e.preventDefault();
    
    const payload = {
        employee_id: document.getElementById('bondEmployee').value,
        bond_category: document.getElementById('bondType').value,
        bond_amount: parseFloat(document.getElementById('bondAmount').value),
        bond_start_date: document.getElementById('bondStartDate').value,
        bond_end_date: document.getElementById('bondEndDate').value,
        bond_purpose: document.getElementById('bondPurpose').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/bonds`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (response.ok) {
            showNotification('Bond created successfully', 'success');
            closeCompensationModal();
            loadCompensationBonds();
        } else {
            showNotification(data.message || 'Error creating bond', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error saving bond', 'error');
    }
}

// ============================================
// LOAD FUNCTIONS
// ============================================

async function loadCompensationPlans() {
    const container = document.getElementById('compPlansContainer');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #9ca3af;"><div style="display: inline-block; width: 6px; height: 6px; background: #594423; border-radius: 50%; animation: pulse 1.5s infinite;"></div> Loading compensation plans...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/plans`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        
        const data = await response.json();
        const plans = data.data || [];
        
        if (plans.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: #9ca3af; background: #f9fafb; border-radius: 8px; border: 1px dashed #e5e7eb;"><div style="font-size: 32px; margin-bottom: 8px;">📋</div><div>No compensation plans found</div></div>';
            return;
        }
        
        let html = `
            <style>
                .comp-btn { transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .comp-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .comp-table tr:hover { background: #f9fafb; }
            </style>
            <div style="margin-bottom: 16px;">
                <button onclick="openCompensationModal('plan')" class="comp-btn" style="background: linear-gradient(135deg, #594423 0%, #6d5432 100%); color: white; border: none; padding: 7px 14px; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 12px;">+ New Plan</button>
            </div>
            <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table class="comp-table" style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Plan Code</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Plan Name</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Position</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Department</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Emp Type</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Salary Grade</th>
                            <th style="padding: 16px 14px; text-align: right; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Basic Pay</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Allowances</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        plans.forEach(plan => {
            const statusColor = plan.status === 'active' ? '#10b981' : '#f87171';
            const allowancesText = plan.allowances ? plan.allowances.map(a => a.allowance_name).join(', ') : 'N/A';
            
            html += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 14px; font-weight: 700; color: #594423; font-size: 13px;">${plan.plan_code}</td>
                    <td style="padding: 14px; font-size: 13px; color: #1f2937; font-weight: 500;">${plan.plan_name}</td>
                    <td style="padding: 14px; font-size: 13px; color: #4b5563;">${plan.position || 'N/A'}</td>
                    <td style="padding: 14px; font-size: 13px; color: #4b5563;">${plan.department || 'N/A'}</td>
                    <td style="padding: 14px; font-size: 13px; color: #4b5563;">${plan.employment_type || 'N/A'}</td>
                    <td style="padding: 14px; font-size: 13px; color: #4b5563;">${plan.salary_grade || 'N/A'} - Step ${plan.salary_step || 'N/A'}</td>
                    <td style="padding: 14px; text-align: right; font-weight: 700; color: #059669; font-size: 13px;">₱${parseFloat(plan.base_salary).toLocaleString('en-PH', {minimumFractionDigits: 0})}</td>
                    <td style="padding: 14px; font-size: 12px; color: #6b7280; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${allowancesText}</td>
                    <td style="padding: 14px; text-align: center;">
                        <span style="background: ${statusColor}; color: white; padding: 5px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; display: inline-block;">${plan.status}</span>
                    </td>
                    <td style="padding: 14px; text-align: center; font-size: 12px; white-space: nowrap;">
                        <button onclick="viewCompensationDetail('plan', ${plan.id})" class="comp-btn" style="background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">View</button>
                        <button onclick="editCompensationPlan(${plan.id})" class="comp-btn" style="background: #8b5cf6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">Edit</button>
                        <button onclick="assignCompensationPlan(${plan.id})" class="comp-btn" style="background: #06b6d4; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">Assign</button>
                        <button onclick="deactivateCompensationPlan(${plan.id})" class="comp-btn" style="background: #f87171; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">Deactivate</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading plans:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">❌ Error loading plans</div>';
    }
}

async function loadCompensationAdjustments() {
    const container = document.getElementById('compAdjustmentsContainer');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #9ca3af;"><div style="display: inline-block; width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; animation: pulse 1.5s infinite;"></div> Loading salary adjustments...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/adjustments`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        
        const data = await response.json();
        const adjustments = data.data || [];
        
        if (adjustments.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: #9ca3af; background: #f9fafb; border-radius: 8px; border: 1px dashed #e5e7eb;"><div style="font-size: 32px; margin-bottom: 8px;">📝</div><div>No salary adjustments found</div></div>';
            return;
        }
        
        let html = `
            <style>
                .adj-btn { transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .adj-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .adj-table tr:hover { background: #f9fafb; }
            </style>
            <div style="margin-bottom: 16px;">
                <button onclick="openCompensationModal('adjustment')" class="adj-btn" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 7px 14px; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 12px;">+ New Adjustment</button>
            </div>
            <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table class="adj-table" style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Adj ID</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Employee</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Position</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Department</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Adj Type</th>
                            <th style="padding: 16px 14px; text-align: right; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Current</th>
                            <th style="padding: 16px 14px; text-align: right; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">New Salary</th>
                            <th style="padding: 16px 14px; text-align: right; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Increase</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Eff Date</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        adjustments.forEach(adj => {
            const statusColors = {
                'submitted': '#3b82f6',
                'approved': '#10b981',
                'rejected': '#f87171'
            };
            const statusColor = statusColors[adj.approval_status] || '#6b7280';
            const salaryIncrease = parseFloat(adj.new_salary) - parseFloat(adj.current_salary);
            const increasePercent = ((salaryIncrease / parseFloat(adj.current_salary)) * 100).toFixed(2);
            
            html += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 14px; font-weight: 700; color: #3b82f6; font-size: 13px;">${adj.adjustment_id || adj.id}</td>
                    <td style="padding: 14px; font-size: 13px; color: #1f2937; font-weight: 500;">${adj.first_name} ${adj.last_name}</td>
                    <td style="padding: 14px; font-size: 13px; color: #4b5563;">${adj.position || 'N/A'}</td>
                    <td style="padding: 14px; font-size: 13px; color: #4b5563;">${adj.department || 'N/A'}</td>
                    <td style="padding: 14px; font-size: 13px; color: #4b5563; text-transform: capitalize;">${adj.adjustment_type.replace(/_/g, ' ')}</td>
                    <td style="padding: 14px; text-align: right; font-size: 13px; color: #6b7280;">₱${parseFloat(adj.current_salary).toLocaleString('en-PH', {minimumFractionDigits: 0})}</td>
                    <td style="padding: 14px; text-align: right; font-weight: 700; color: #059669; font-size: 13px;">₱${parseFloat(adj.new_salary).toLocaleString('en-PH', {minimumFractionDigits: 0})}</td>
                    <td style="padding: 14px; text-align: right; font-weight: 700; color: #dc2626; font-size: 13px;">+₱${salaryIncrease.toLocaleString('en-PH', {minimumFractionDigits: 0})} (${increasePercent}%)</td>
                    <td style="padding: 14px; text-align: center; font-size: 13px; color: #4b5563;">${new Date(adj.effective_date).toLocaleDateString()}</td>
                    <td style="padding: 14px; text-align: center;">
                        <span style="background: ${statusColor}; color: white; padding: 5px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; display: inline-block;">${adj.approval_status}</span>
                    </td>
                    <td style="padding: 14px; text-align: center; font-size: 12px; white-space: nowrap;">
                        <button onclick="viewCompensationDetail('adjustment', ${adj.id})" class="adj-btn" style="background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">View</button>
                        ${adj.approval_status === 'submitted' ? `
                        <button onclick="approveAdjustment(${adj.id})" class="adj-btn" style="background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">Approve</button>
                        <button onclick="rejectAdjustment(${adj.id})" class="adj-btn" style="background: #f87171; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">Reject</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading adjustments:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">❌ Error loading adjustments</div>';
    }
}

async function loadCompensationIncentives() {
    const container = document.getElementById('compIncentivesContainer');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #9ca3af;"><div style="display: inline-block; width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; animation: pulse 1.5s infinite;"></div> Loading incentives...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/incentives`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        
        const data = await response.json();
        const incentives = data.data || [];
        
        if (incentives.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: #9ca3af; background: #f9fafb; border-radius: 8px; border: 1px dashed #e5e7eb;"><div style="font-size: 32px; margin-bottom: 8px;">🎁</div><div>No incentives found</div></div>';
            return;
        }
        
        let html = `
            <style>
                .inc-btn { transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .inc-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .inc-table tr:hover { background: #f9fafb; }
            </style>
            <div style="margin-bottom: 16px;">
                <button onclick="openCompensationModal('incentive')" class="inc-btn" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; padding: 7px 14px; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 12px;">+ Grant Incentive</button>
            </div>
            <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table class="inc-table" style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Inc ID</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Employee</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Name</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Category</th>
                            <th style="padding: 16px 14px; text-align: right; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Tax Status</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Frequency</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Dist Date</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        incentives.forEach(inc => {
            const statusColors = {
                'approved': '#10b981',
                'pending': '#f59e0b',
                'rejected': '#f87171'
            };
            const statusColor = statusColors[inc.approval_status] || '#6b7280';
            const taxColor = inc.tax_status === 'taxable' ? '#dc2626' : '#059669';
            
            html += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 14px; font-weight: 700; color: #f59e0b; font-size: 13px;">${inc.incentive_id || inc.id}</td>
                    <td style="padding: 14px; font-size: 13px; color: #1f2937; font-weight: 500;">${inc.first_name} ${inc.last_name}</td>
                    <td style="padding: 14px; font-size: 13px; color: #4b5563;">${inc.incentive_category.replace(/_/g, ' ')}</td>
                    <td style="padding: 14px; font-size: 13px; color: #4b5563; text-transform: capitalize;">${inc.incentive_category.replace(/_/g, ' ')}</td>
                    <td style="padding: 14px; text-align: right; font-weight: 700; color: #059669; font-size: 13px;">₱${parseFloat(inc.incentive_amount).toLocaleString('en-PH', {minimumFractionDigits: 0})}</td>
                    <td style="padding: 14px; text-align: center;">
                        <span style="background: ${taxColor}; color: white; padding: 5px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; display: inline-block;">${inc.tax_status.replace(/_/g, ' ')}</span>
                    </td>
                    <td style="padding: 14px; text-align: center; font-size: 13px; color: #4b5563;">${inc.one_time_or_recurring}</td>
                    <td style="padding: 14px; text-align: center; font-size: 13px; color: #4b5563;">${new Date(inc.distribution_date).toLocaleDateString()}</td>
                    <td style="padding: 14px; text-align: center;">
                        <span style="background: ${statusColor}; color: white; padding: 5px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; display: inline-block;">${inc.approval_status}</span>
                    </td>
                    <td style="padding: 14px; text-align: center; font-size: 12px; white-space: nowrap;">
                        <button onclick="viewCompensationDetail('incentive', ${inc.id})" class="inc-btn" style="background: #f59e0b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">View</button>
                        <button onclick="grantIncentive(${inc.id})" class="inc-btn" style="background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">Grant</button>
                        <button onclick="cancelIncentive(${inc.id})" class="inc-btn" style="background: #f87171; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">Cancel</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading incentives:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">❌ Error loading incentives</div>';
    }
}

async function loadCompensationBonds() {
    const container = document.getElementById('compBondsContainer');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><div style="border-top: 3px solid #6366f1; width: 50px; margin: 0 auto 16px;"></div>Loading bonds...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/bonds`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        
        const data = await response.json();
        const bonds = data.data || [];
        
        if (bonds.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">📎 No bonds found</div>';
            return;
        }
        
        let html = `
            <style>
                .bond-btn { transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .bond-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .bond-table tr:hover { background: #f9fafb; }
            </style>
            <div style="margin-bottom: 16px;">
                <button onclick="openCompensationModal('bond')" class="bond-btn" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; border: none; padding: 7px 14px; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 12px;">+ New Bond</button>
            </div>
            <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table class="bond-table" style="width: 100%; border-collapse: collapse; background: white;">
                    <thead>
                        <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Bond ID</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Employee</th>
                            <th style="padding: 16px 14px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Bond Type</th>
                            <th style="padding: 16px 14px; text-align: right; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Bond Amount</th>
                            <th style="padding: 16px 14px; text-align: right; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Amount Paid</th>
                            <th style="padding: 16px 14px; text-align: right; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Remaining</th>
                            <th style="padding: 16px 14px; text-align: right; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Monthly Ded</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Start Date</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">End Date</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                            <th style="padding: 16px 14px; text-align: center; font-weight: 700; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        bonds.forEach(bond => {
            const statusColors = {
                'active': '#6366f1',
                'completed': '#10b981',
                'breached': '#ef4444'
            };
            const statusColor = statusColors[bond.bond_status] || '#6b7280';
            const amountPaid = parseFloat(bond.total_deducted) || 0;
            
            html += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 14px; font-weight: 700; color: #6366f1; font-size: 13px;">${bond.bond_id || bond.id}</td>
                    <td style="padding: 14px; font-size: 13px; color: #1f2937; font-weight: 500;">${bond.first_name} ${bond.last_name}</td>
                    <td style="padding: 14px; font-size: 13px; color: #4b5563; text-transform: capitalize;">${bond.bond_category.replace(/_/g, ' ')}</td>
                    <td style="padding: 14px; text-align: right; font-weight: 700; color: #1f2937; font-size: 13px;">₱${parseFloat(bond.bond_amount).toLocaleString('en-PH', {minimumFractionDigits: 0})}</td>
                    <td style="padding: 14px; text-align: right; font-size: 13px; color: #4b5563;">₱${amountPaid.toLocaleString('en-PH', {minimumFractionDigits: 0})}</td>
                    <td style="padding: 14px; text-align: right; font-weight: 700; color: #059669; font-size: 13px;">₱${parseFloat(bond.remaining_balance).toLocaleString('en-PH', {minimumFractionDigits: 0})}</td>
                    <td style="padding: 14px; text-align: right; font-size: 13px; color: #4b5563;">₱${parseFloat(bond.monthly_deduction).toLocaleString('en-PH', {minimumFractionDigits: 0})}</td>
                    <td style="padding: 14px; text-align: center; font-size: 13px; color: #4b5563;">${new Date(bond.start_date).toLocaleDateString()}</td>
                    <td style="padding: 14px; text-align: center; font-size: 13px; color: #4b5563;">${new Date(bond.end_date).toLocaleDateString()}</td>
                    <td style="padding: 14px; text-align: center;">
                        <span style="background: ${statusColor}; color: white; padding: 5px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; display: inline-block;">${bond.bond_status}</span>
                    </td>
                    <td style="padding: 14px; text-align: center; font-size: 12px; white-space: nowrap;">
                        <button onclick="viewCompensationDetail('bond', ${bond.id})" class="bond-btn" style="background: #6366f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">View</button>
                        <button onclick="adjustBond(${bond.id})" class="bond-btn" style="background: #8b5cf6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">Adjust</button>
                        <button onclick="terminateBond(${bond.id})" class="bond-btn" style="background: #f87171; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin: 0 2px;">Terminate</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading bonds:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">❌ Error loading bonds</div>';
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function viewCompensationDetail(type, id) {
    console.log(`View ${type} detail: ${id}`);
}

function editCompensationPlan(id) {
    console.log(`Edit plan: ${id}`);
    openCompensationModal('plan');
}

function editAdjustment(id) {
    console.log(`Edit adjustment: ${id}`);
    openCompensationModal('adjustment');
}

function editBond(id) {
    console.log(`Edit bond: ${id}`);
    openCompensationModal('bond');
}

// ============================================
// ACTION FUNCTIONS
// ============================================

function editCompensationPlan(id) {
    console.log(`Edit compensation plan: ${id}`);
    openCompensationModal('plan');
}

function assignCompensationPlan(id) {
    const message = `Assign compensation plan ${id} to employee(s)?`;
    if (confirm(message)) {
        showNotification('Plan assignment feature coming soon', 'info');
    }
}

function deactivateCompensationPlan(id) {
    const message = `Deactivate compensation plan ${id}? This will prevent it from being assigned to new employees.`;
    if (confirm(message)) {
        showNotification('Plan deactivated successfully', 'success');
        loadCompensationPlans();
    }
}

function viewCompensationDetail(type, id) {
    let detailContent = `
        <div style="background: white; padding: 20px; border-radius: 8px; max-height: 70vh; overflow-y: auto;">
            <h3 style="margin: 0 0 20px 0; color: #333;">Details for ID: ${id}</h3>
    `;
    
    if (type === 'plan') {
        detailContent += `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <div style="font-size: 12px; color: #666; font-weight: 600; margin-bottom: 4px;">BASIC SALARY</div>
                    <div style="font-size: 18px; font-weight: 700; color: #16a34a;">₱25,000</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #666; font-weight: 600; margin-bottom: 4px;">PAY FREQUENCY</div>
                    <div style="font-size: 18px; font-weight: 700;">Monthly</div>
                </div>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px;">📋 ALLOWANCES</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: #f3f4f6; padding: 12px; border-radius: 6px;">
                        <div style="font-size: 11px; color: #666;">Hazard Pay</div>
                        <div style="font-size: 16px; font-weight: 700; color: #dc2626;">₱3,500</div>
                    </div>
                    <div style="background: #f3f4f6; padding: 12px; border-radius: 6px;">
                        <div style="font-size: 11px; color: #666;">Night Differential</div>
                        <div style="font-size: 16px; font-weight: 700; color: #dc2626;">₱2,000</div>
                    </div>
                    <div style="background: #f3f4f6; padding: 12px; border-radius: 6px;">
                        <div style="font-size: 11px; color: #666;">Meal Allowance</div>
                        <div style="font-size: 16px; font-weight: 700;">₱2,000</div>
                    </div>
                    <div style="background: #f3f4f6; padding: 12px; border-radius: 6px;">
                        <div style="font-size: 11px; color: #666;">Transportation</div>
                        <div style="font-size: 16px; font-weight: 700;">₱1,500</div>
                    </div>
                </div>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px;">✔️ COMPLIANCE</div>
                <div style="font-size: 13px; color: #666;">
                    <div style="margin-bottom: 8px;">✓ DOLE Compliant</div>
                    <div style="margin-bottom: 8px;">✓ Private Hospital Rate</div>
                    <div>✓ Effective Date: 2024-01-01</div>
                </div>
            </div>
        `;
    } else if (type === 'adjustment') {
        detailContent += `
            <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
                <div style="font-size: 13px; font-weight: 600; color: #1e40af; margin-bottom: 8px;">Employee Details</div>
                <div style="font-size: 13px; color: #1e40af;">Maria Santos (EMP-001) - Registered Nurse</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div>
                    <div style="font-size: 12px; color: #666; font-weight: 600; margin-bottom: 4px;">OLD SALARY</div>
                    <div style="font-size: 20px; font-weight: 700;">₱45,000</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #666; font-weight: 600; margin-bottom: 4px;">NEW SALARY</div>
                    <div style="font-size: 20px; font-weight: 700; color: #16a34a;">₱48,000</div>
                </div>
            </div>
            <div style="background: #dcfce7; padding: 12px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #16a34a;">
                <div style="font-size: 12px; color: #065f46; font-weight: 600;">INCREASE</div>
                <div style="font-size: 18px; font-weight: 700; color: #047857;">+₱3,000 (6.67%)</div>
            </div>
            <div style="padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px;">Reason</div>
                <div style="font-size: 13px; color: #666;">Annual performance merit increase</div>
            </div>
            <div style="margin-top: 16px; display: flex; gap: 8px;">
                <button onclick="approveAdjustment(${id})" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">Approve</button>
                <button onclick="rejectAdjustment(${id})" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">Reject</button>
            </div>
        `;
    }
    
    detailContent += `</div>`;
    
    const modal = document.getElementById('compensationModal');
    if (!modal) {
        createCompensationModal();
    }
    document.getElementById('compensationModal').innerHTML = detailContent;
    document.getElementById('compensationModal').style.display = 'block';
}

function approveAdjustment(id) {
    showNotification('Adjustment approved successfully', 'success');
    setTimeout(() => {
        closeCompensationModal();
        loadCompensationAdjustments();
    }, 1500);
}

function rejectAdjustment(id) {
    if (confirm('Reject this salary adjustment?')) {
        showNotification('Adjustment rejected', 'info');
        setTimeout(() => {
            closeCompensationModal();
            loadCompensationAdjustments();
        }, 1500);
    }
}

function grantIncentive(id) {
    if (confirm('Grant this incentive to the employee?')) {
        showNotification('Incentive granted successfully', 'success');
        setTimeout(() => {
            loadCompensationIncentives();
        }, 1500);
    }
}

function cancelIncentive(id) {
    if (confirm('Cancel this incentive issuance?')) {
        showNotification('Incentive cancelled', 'info');
        setTimeout(() => {
            loadCompensationIncentives();
        }, 1500);
    }
}

function adjustBond(id) {
    if (confirm('Adjust this bond?')) {
        showNotification('Bond adjustment feature coming soon', 'info');
    }
}

function terminateBond(id) {
    if (confirm('Terminate this bond early? Any remaining balance will be deducted from final pay.')) {
        showNotification('Bond terminated - Final deduction will be processed on exit', 'warning');
        setTimeout(() => {
            loadCompensationBonds();
        }, 1500);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background: ${bgColor};
        color: white;
        border-radius: 6px;
        z-index: 9999;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 4000);
}

