/**
 * PAYROLL Module - Payslips Section
 * Manages payslip generation, preview, and download
 */

const API_BASE_URL = '/api';

let allPayslipsData = [];
let currentPayslipId = null;

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
 * Display Payslips Section
 */
export async function displayPayslipsSection() {
    console.log("[Payslips] Displaying Payslips Section...");
    
    const container = document.getElementById('payslipsContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header with Actions -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: #f0f7ff;">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <h3 style="font-size: 20px; font-weight: 600; color: #1e40af; margin: 0;">Payslips Management</h3>
                        <p style="font-size: 14px; color: #1e3a8a; margin-top: 5px;">Generate, preview, and download payslips for each cutoff</p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="refreshPayslips()" style="padding: 8px 16px; border: 1px solid #3b82f6; border-radius: 6px; background: white; color: #1e40af; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            🔄 Refresh
                        </button>
                        <button onclick="showGeneratePayslipsModal()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            📄 Generate Payslips
                        </button>
                        <button onclick="showBatchDownloadModal()" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            📥 Batch Download
                        </button>
                        <button onclick="exportPayslipsData()" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            📊 Export
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div style="padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <input id="payslip-search-input" type="text" placeholder="Search by employee, payroll run..." 
                           style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; flex: 1; min-width: 200px; font-size: 14px;">
                    
                    <select id="payslip-branch-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Branches</option>
                    </select>
                    
                    <select id="payslip-payroll-run-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Payroll Runs</option>
                    </select>
                    
                    <select id="payslip-status-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Status</option>
                        <option value="Generated">Generated</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid</option>
                        <option value="Deleted">Deleted</option>
                    </select>
                    
                    <input type="date" id="payslip-period-start" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                    <input type="date" id="payslip-period-end" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                    
                    <button onclick="applyPayslipFilters()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        🔍 Filter
                    </button>
                    
                    <button onclick="clearPayslipFilters()" style="padding: 8px 16px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        ✕ Clear
                    </button>
                </div>
            </div>

            <!-- Payslips Table -->
            <div style="padding: 20px; overflow-x: auto;">
                <div id="payslips-list-container" style="text-align: center; padding: 30px;">
                    <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #3b82f6; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="color: #9ca3af; margin-top: 15px;">Loading payslips...</p>
                </div>
            </div>
        </div>

        <!-- Generate Payslips Modal -->
        <div id="generate-payslips-modal" style="position: fixed; inset: 0; z-index: 50; display: none; overflow-y: auto; background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: flex-end; justify-content: center; min-height: 100vh; padding: 15px;">
                <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 500px;">
                    <form id="generate-payslips-form" style="display: contents;">
                        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Generate Payslips</h3>
                                <button type="button" onclick="closeGeneratePayslipsModal()" style="background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer;">✕</button>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Select Payroll Run:</label>
                                    <select id="generate-payslips-payroll-run" name="payroll_run_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                        <option value="">Loading payroll runs...</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Branch:</label>
                                    <select id="generate-payslips-branch" name="branch_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                        <option value="">Select Branch</option>
                                    </select>
                                </div>
                                
                                <div style="padding: 12px; background: #dbeafe; border-radius: 6px; border: 1px solid #93c5fd;">
                                    <p style="font-size: 13px; color: #1e3a8a; margin: 0;">
                                        <strong>Note:</strong> This will generate payslips for all employees in the selected payroll run.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="padding: 15px 20px; background: #f3f4f6; display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="submit" style="padding: 10px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                                ✓ Generate Payslips
                            </button>
                            <button type="button" onclick="closeGeneratePayslipsModal()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Batch Download Modal -->
        <div id="batch-download-modal" style="position: fixed; inset: 0; z-index: 50; display: none; overflow-y: auto; background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: flex-end; justify-content: center; min-height: 100vh; padding: 15px;">
                <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 500px;">
                    <form id="batch-download-form" style="display: contents;">
                        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Batch Download Payslips</h3>
                                <button type="button" onclick="closeBatchDownloadModal()" style="background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer;">✕</button>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Select Payroll Run:</label>
                                    <select id="batch-download-payroll-run" name="payroll_run_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                        <option value="">Loading payroll runs...</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Download Format:</label>
                                    <select id="batch-download-format" name="format" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                        <option value="pdf">PDF (Individual Files)</option>
                                        <option value="batch-pdf">PDF (Combined File)</option>
                                        <option value="excel">Excel Spreadsheet</option>
                                    </select>
                                </div>
                                
                                <div style="padding: 12px; background: #dcfce7; border-radius: 6px; border: 1px solid #86efac;">
                                    <p style="font-size: 13px; color: #166534; margin: 0;">
                                        <strong>Note:</strong> Download will start automatically for all payslips in the run.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="padding: 15px 20px; background: #f3f4f6; display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="submit" style="padding: 10px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                                ✓ Download
                            </button>
                            <button type="button" onclick="closeBatchDownloadModal()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Payslip Preview Modal -->
        <div id="payslip-preview-modal" style="position: fixed; inset: 0; z-index: 50; display: none; overflow-y: auto; background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: flex-start; justify-content: center; min-height: 100vh; padding: 15px;">
                <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 900px; margin-top: 20px;">
                    <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
                        <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Payslip Preview</h3>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="printPayslip()" style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; font-size: 13px; cursor: pointer;">
                                🖨️ Print
                            </button>
                            <button onclick="downloadPayslipPDF()" style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; font-size: 13px; cursor: pointer;">
                                📥 Download PDF
                            </button>
                            <button onclick="emailPayslip()" style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; font-size: 13px; cursor: pointer;">
                                📧 Email
                            </button>
                            <button type="button" onclick="closePayslipPreviewModal()" style="background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer;">✕</button>
                        </div>
                    </div>
                    
                    <div style="padding: 20px; max-height: 600px; overflow-y: auto;">
                        <div id="payslip-preview-content" style="font-size: 14px; color: #374151; line-height: 1.6;">
                            Loading payslip...
                        </div>
                    </div>
                    
                    <div style="padding: 15px 20px; background: #f3f4f6; text-align: right;">
                        <button type="button" onclick="closePayslipPreviewModal()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
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

    setupPayslipsEventListeners();
    loadBranchesForPayslips();
    loadPayrollRunsForPayslips();
    
    setTimeout(() => loadPayslips(), 0);
}

function setupPayslipsEventListeners() {
    const searchInput = document.getElementById('payslip-search-input');
    const branchFilter = document.getElementById('payslip-branch-filter');
    const runFilter = document.getElementById('payslip-payroll-run-filter');
    const statusFilter = document.getElementById('payslip-status-filter');
    const periodStart = document.getElementById('payslip-period-start');
    const periodEnd = document.getElementById('payslip-period-end');
    const generateForm = document.getElementById('generate-payslips-form');
    const batchForm = document.getElementById('batch-download-form');
    
    if (searchInput) searchInput.addEventListener('input', applyPayslipFilters);
    if (branchFilter) branchFilter.addEventListener('change', applyPayslipFilters);
    if (runFilter) runFilter.addEventListener('change', applyPayslipFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyPayslipFilters);
    if (periodStart) periodStart.addEventListener('change', applyPayslipFilters);
    if (periodEnd) periodEnd.addEventListener('change', applyPayslipFilters);
    if (generateForm) generateForm.addEventListener('submit', handleGeneratePayslips);
    if (batchForm) batchForm.addEventListener('submit', handleBatchDownload);
}

async function loadBranchesForPayslips() {
    try {
        const branches = [
            { BranchID: 1, BranchCode: 'MAIN', BranchName: 'Main Hospital' }
        ];
        
        const branchFilter = document.getElementById('payslip-branch-filter');
        const generateBranch = document.getElementById('generate-payslips-branch');
        
        if (branchFilter) {
            branchFilter.innerHTML = '<option value="">All Branches</option>' + 
                branches.map(b => `<option value="${b.BranchID}">${b.BranchName}</option>`).join('');
        }
        
        if (generateBranch) {
            generateBranch.innerHTML = '<option value="">Select Branch</option>' + 
                branches.map(b => `<option value="${b.BranchID}">${b.BranchName}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading branches:', error);
    }
}

async function loadPayrollRunsForPayslips() {
    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payroll.php`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        console.log('[Payroll Runs] Response status:', response.status, response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Payroll Runs] Error response:', errorText);
            
            // If no payroll runs exist, treat as empty list
            if (response.status === 404) {
                throw new Error('No payroll runs found');
            }
            throw new Error(`Failed to load payroll runs (Status: ${response.status})`);
        }
        
        const result = await response.json();
        console.log('[Payroll Runs] Result:', result);
        
        const runs = result.success ? (result.data?.items || result.data?.payrolls || result.data || []) : [];
        
        const runFilter = document.getElementById('payslip-payroll-run-filter');
        const generateRun = document.getElementById('generate-payslips-payroll-run');
        const batchRun = document.getElementById('batch-download-payroll-run');
        
        const runOptions = '<option value="">All Payroll Runs</option>' + 
            (runs.length > 0 ? runs.map(r => `<option value="${r.id || r.PayrollRunID}">${r.period || r.PayPeriodStart} - ${r.PayPeriodEnd || ''}</option>`).join('') : '<option value="" disabled>No payroll runs available</option>');
        
        if (runFilter) runFilter.innerHTML = runOptions;
        if (generateRun) generateRun.innerHTML = '<option value="">Select Payroll Run</option>' + 
            (runs.length > 0 ? runs.map(r => `<option value="${r.id || r.PayrollRunID}">${r.period || r.PayPeriodStart} - ${r.PayPeriodEnd || ''}</option>`).join('') : '<option value="" disabled>No payroll runs available</option>');
        if (batchRun) batchRun.innerHTML = '<option value="">Select Payroll Run</option>' + 
            (runs.length > 0 ? runs.map(r => `<option value="${r.id || r.PayrollRunID}">${r.period || r.PayPeriodStart} - ${r.PayPeriodEnd || ''}</option>`).join('') : '<option value="" disabled>No payroll runs available</option>');
    } catch (error) {
        console.error('Error loading payroll runs:', error);
        // Fallback to empty options
        const runFilter = document.getElementById('payslip-payroll-run-filter');
        const generateRun = document.getElementById('generate-payslips-payroll-run');
        const batchRun = document.getElementById('batch-download-payroll-run');
        const emptyOption = '<option value="">Select Payroll Run</option><option value="" disabled style="opacity: 0.5;">No data available - check payroll module</option>';
        if (runFilter) runFilter.innerHTML = '<option value="">All Payroll Runs</option><option value="" disabled style="opacity: 0.5;">No data available</option>';
        if (generateRun) generateRun.innerHTML = emptyOption;
        if (batchRun) batchRun.innerHTML = emptyOption;
    }
}

async function loadPayslips() {
    console.log("[Load] Loading Payslips...");
    const container = document.getElementById('payslips-list-container');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 30px;"><div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #3b82f6; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div><p style="color: #9ca3af; margin-top: 15px;">Loading payslips...</p></div>';

    const filters = getPayslipFilters();
    const params = new URLSearchParams(filters);

    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payslips.php?${params.toString()}`, {
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
            // If 404, it means no payslips exist yet - treat as empty list
            if (response.status === 404) {
                renderPayslipsTable([], {});
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        if (result.success && result.data) {
            renderPayslipsTable(result.data.payslips || [], result.data.pagination || {});
        } else if (result.data === null || result.data === undefined) {
            // Empty result - show no payslips message
            renderPayslipsTable([], {});
        } else {
            throw new Error(result.message || 'Failed to load payslips');
        }
    } catch (error) {
        console.error('Error loading payslips:', error);
        container.innerHTML = `<div style="text-align: center; padding: 30px;"><i style="font-size: 40px; color: #dc2626;">⚠️</i><p style="color: #dc2626; margin-top: 15px;">Error loading payslips: ${error.message}</p><button onclick="loadPayslips()" style="margin-top: 15px; padding: 10px 16px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer;">🔄 Retry</button></div>`;
    }
}

function getPayslipFilters() {
    return {
        search: document.getElementById('payslip-search-input')?.value || '',
        branch_id: document.getElementById('payslip-branch-filter')?.value || '',
        payroll_run_id: document.getElementById('payslip-payroll-run-filter')?.value || '',
        status: document.getElementById('payslip-status-filter')?.value || '',
        pay_period_start: document.getElementById('payslip-period-start')?.value || '',
        pay_period_end: document.getElementById('payslip-period-end')?.value || '',
        page: 1,
        limit: 50
    };
}

function renderPayslipsTable(payslips, pagination = {}) {
    const container = document.getElementById('payslips-list-container');
    
    if (!container) {
        console.error('Payslips container element not found');
        return;
    }
    
    if (!payslips || payslips.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 30px;"><i style="font-size: 50px; color: #d1d5db;">📄</i><h3 style="font-size: 18px; font-weight: 500; color: #111827; margin: 15px 0 10px 0;">No payslips found</h3><p style="color: #9ca3af; margin: 0;">Try adjusting your filters or generate payslips for a payroll run</p></div>`;
        return;
    }

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    const headerRow = table.createTHead().insertRow();
    headerRow.style.background = '#f0f7ff';
    headerRow.style.borderBottom = '2px solid #e2e8f0';
    
    const headers = ['Employee', 'Pay Period', 'Gross Income', 'Deductions', 'Net Pay', 'Status', 'Payroll Run', 'Actions'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.cssText = 'padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;';
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    tbody.style.borderTop = '1px solid #e2e8f0';

    payslips.forEach((payslip, index) => {
        const row = tbody.insertRow();
        row.style.borderBottom = '1px solid #f3f4f6';
        row.style.background = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        
        // Employee
        const employeeCell = row.insertCell();
        employeeCell.style.cssText = 'padding: 12px 15px; font-size: 13px;';
        employeeCell.innerHTML = `<div style="font-weight: 500; color: #111827;">${payslip.employee_name || 'N/A'}</div><div style="font-size: 12px; color: #9ca3af;">ID: ${payslip.EmployeeNumber || 'N/A'}</div>`;
        
        // Pay Period
        const periodCell = row.insertCell();
        periodCell.style.cssText = 'padding: 12px 15px; font-size: 13px; color: #374151;';
        periodCell.textContent = `${payslip.PayPeriodStart || ''} to ${payslip.PayPeriodEnd || ''}`;
        
        // Gross Income
        const grossCell = row.insertCell();
        grossCell.style.cssText = 'padding: 12px 15px; font-size: 13px; color: #059669; font-weight: 500;';
        grossCell.textContent = parseFloat(payslip.GrossIncome || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
        
        // Deductions
        const deductCell = row.insertCell();
        deductCell.style.cssText = 'padding: 12px 15px; font-size: 13px; color: #dc2626; font-weight: 500;';
        deductCell.textContent = parseFloat(payslip.TotalDeductions || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
        
        // Net Pay
        const netCell = row.insertCell();
        netCell.style.cssText = 'padding: 12px 15px; font-size: 13px; color: #0369a1; font-weight: 600;';
        netCell.textContent = parseFloat(payslip.NetIncome || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
        
        // Status
        const statusCell = row.insertCell();
        statusCell.style.cssText = 'padding: 12px 15px; font-size: 13px;';
        const badgeClass = getPayslipStatusBadgeClass(payslip.Status);
        statusCell.innerHTML = `<span style="${badgeClass}">${payslip.Status || 'Generated'}</span>`;
        
        // Payroll Run
        const runCell = row.insertCell();
        runCell.style.cssText = 'padding: 12px 15px; font-size: 13px; color: #9ca3af;';
        runCell.innerHTML = `<div>Run #${payslip.PayrollRunID}</div><div style="font-size: 12px;">v${payslip.Version || '1'}</div>`;
        
        // Actions
        const actionsCell = row.insertCell();
        actionsCell.style.cssText = 'padding: 12px 15px; font-size: 13px;';
        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '10px';
        
        const viewBtn = document.createElement('button');
        viewBtn.innerHTML = '👁️';
        viewBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 16px;';
        viewBtn.title = 'Preview';
        viewBtn.onclick = () => previewPayslip(payslip.PayslipID);
        actionsDiv.appendChild(viewBtn);
        
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = '📥';
        downloadBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 16px;';
        downloadBtn.title = 'Download PDF';
        downloadBtn.onclick = () => downloadPayslipPDF(payslip.PayslipID);
        actionsDiv.appendChild(downloadBtn);
        
        const auditBtn = document.createElement('button');
        auditBtn.innerHTML = '📋';
        auditBtn.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 16px;';
        auditBtn.title = 'Audit Log';
        auditBtn.onclick = () => viewPayslipAuditLog(payslip.PayslipID);
        actionsDiv.appendChild(auditBtn);
        
        actionsCell.appendChild(actionsDiv);
    });

    container.innerHTML = '';
    container.appendChild(table);
}

function getPayslipStatusBadgeClass(status) {
    const styles = {
        'Generated': 'display: inline-flex; align-items: center; padding: 4px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 12px; font-weight: 600;',
        'Approved': 'display: inline-flex; align-items: center; padding: 4px 8px; background: #dcfce7; color: #15803d; border-radius: 4px; font-size: 12px; font-weight: 600;',
        'Paid': 'display: inline-flex; align-items: center; padding: 4px 8px; background: #f3e8ff; color: #6b21a8; border-radius: 4px; font-size: 12px; font-weight: 600;',
        'Deleted': 'display: inline-flex; align-items: center; padding: 4px 8px; background: #fee2e2; color: #991b1b; border-radius: 4px; font-size: 12px; font-weight: 600;'
    };
    return styles[status] || styles['Generated'];
}

// Modal functions
window.showGeneratePayslipsModal = function() {
    const modal = document.getElementById('generate-payslips-modal');
    if (modal) {
        modal.style.display = 'block';
        loadPayrollRunsForPayslips();
        loadBranchesForPayslips();
    }
};

window.closeGeneratePayslipsModal = function() {
    const modal = document.getElementById('generate-payslips-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('generate-payslips-form').reset();
    }
};

window.showBatchDownloadModal = function() {
    const modal = document.getElementById('batch-download-modal');
    if (modal) {
        modal.style.display = 'block';
        loadPayrollRunsForPayslips();
    }
};

window.closeBatchDownloadModal = function() {
    const modal = document.getElementById('batch-download-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('batch-download-form').reset();
    }
};

window.closePayslipPreviewModal = function() {
    const modal = document.getElementById('payslip-preview-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Filter and action functions
window.refreshPayslips = function() {
    loadPayslips();
};

window.applyPayslipFilters = function() {
    loadPayslips();
};

window.clearPayslipFilters = function() {
    document.getElementById('payslip-search-input').value = '';
    document.getElementById('payslip-branch-filter').value = '';
    document.getElementById('payslip-payroll-run-filter').value = '';
    document.getElementById('payslip-status-filter').value = '';
    document.getElementById('payslip-period-start').value = '';
    document.getElementById('payslip-period-end').value = '';
    loadPayslips();
};

// Form handlers
async function handleGeneratePayslips(event) {
    event.preventDefault();
    
    const branchId = event.target.elements['branch_id'].value;
    const payrollRunId = event.target.elements['payroll_run_id'].value;
    
    if (!branchId || !payrollRunId) {
        alert('Please select both branch and payroll run');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payslips.php`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({
                action: 'generate',
                payroll_run_id: payrollRunId,
                branch_id: branchId
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(`Generated ${result.data?.payslips_generated || 'all'} payslips successfully!`);
            closeGeneratePayslipsModal();
            loadPayslips();
        } else {
            throw new Error(result.message || 'Failed to generate payslips');
        }
    } catch (error) {
        console.error('Error generating payslips:', error);
        alert(`Error: ${error.message}`);
    }
}

async function handleBatchDownload(event) {
    event.preventDefault();
    
    const payrollRunId = event.target.elements['payroll_run_id'].value;
    const format = event.target.elements['format'].value;
    
    if (!payrollRunId) {
        alert('Please select a payroll run');
        return;
    }
    
    try {
        // Get payslips for the selected payroll run
        const response = await fetch(`${API_BASE_URL}/payroll/payslips.php?payroll_run_id=${payrollRunId}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) throw new Error('Failed to load payslips');

        const result = await response.json();
        const payslips = result.data?.payslips || [];
        
        if (payslips.length === 0) {
            throw new Error('No payslips found for this payroll run');
        }

        const payslipIds = payslips.map(p => p.PayslipID);
        
        if (format === 'batch-pdf') {
            // Download batch PDF
            const dlResponse = await fetch(`${API_BASE_URL}/payroll/payslips.php?action=batch-pdf`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({ payslip_ids: payslipIds })
            });

            if (dlResponse.ok) {
                const blob = await dlResponse.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payslips_batch_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } else {
            // Download individual PDFs
            payslipIds.forEach((id, idx) => {
                setTimeout(() => {
                    downloadPayslipPDF(id);
                }, 100 * idx);
            });
        }
        
        closeBatchDownloadModal();
        alert(`Started downloading ${payslips.length} payslips`);
        
    } catch (error) {
        console.error('Error downloading payslips:', error);
        alert(`Error: ${error.message}`);
    }
}

async function previewPayslip(payslipId) {
    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payslips.php?id=${payslipId}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) throw new Error('Failed to load payslip preview');

        const result = await response.json();
        const payslip = result.data;
        
        currentPayslipId = payslipId;
        
        // Format currency helper
        const formatCurrency = (amount) => {
            return (amount || 0).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        };
        
        const payslipHTML = `
            <div id="payslip-print-content" style="background: white; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6;">
                <!-- Hospital Header -->
                <div style="text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 5px;">REPUBLIC OF THE PHILIPPINES</div>
                    <h1 style="font-size: 24px; font-weight: 700; color: #1e40af; margin: 0; letter-spacing: 1px;">🏥 HEALTHCARE HOSPITAL</h1>
                    <p style="font-size: 12px; color: #0f172a; margin: 3px 0; font-weight: 600;">Integrity • Service • Commitment • Respect • Compassion</p>
                    <p style="font-size: 11px; color: #666; margin: 2px 0;">BIR Registered • Tax Identification Number: 000-000-000-000</p>
                    <h2 style="font-size: 16px; font-weight: 700; color: #1e40af; margin: 15px 0 5px 0;">EMPLOYEE PAYSLIP</h2>
                    <p style="font-size: 11px; color: #0f172a; margin: 0;">Payslip No. ${payslip.id || 'N/A'}</p>
                </div>
                
                <!-- Employee and Payroll Info Section -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 25px; font-size: 12px;">
                    <div style="border: 1px solid #d1d5db; padding: 15px; border-radius: 6px;">
                        <h4 style="font-weight: 700; color: #1e40af; margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Employee Information</h4>
                        <div style="margin: 5px 0;"><strong>Name:</strong> <span style="float: right;">${payslip.employee_name || 'N/A'}</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0;"><strong>ID:</strong> <span style="float: right;">${payslip.employee_id || 'N/A'}</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0;"><strong>Department:</strong> <span style="float: right;">${payslip.department || 'N/A'}</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0;"><strong>Position:</strong> <span style="float: right;">${payslip.position || 'N/A'}</span></div>
                    </div>
                    
                    <div style="border: 1px solid #d1d5db; padding: 15px; border-radius: 6px;">
                        <h4 style="font-weight: 700; color: #1e40af; margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Pay Period Details</h4>
                        <div style="margin: 5px 0;"><strong>Period Start:</strong> <span style="float: right;">${payslip.period_start || 'N/A'}</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0;"><strong>Period End:</strong> <span style="float: right;">${payslip.period_end || 'N/A'}</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0;"><strong>Pay Date:</strong> <span style="float: right;">${new Date().toLocaleDateString()}</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0;"><strong>Status:</strong> <span style="float: right; padding: 2px 8px; background: #10b981; color: white; border-radius: 3px; font-size: 10px;">${payslip.status || 'APPROVED'}</span></div>
                    </div>
                    
                    <div style="border: 1px solid #d1d5db; padding: 15px; border-radius: 6px;">
                        <h4 style="font-weight: 700; color: #1e40af; margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Branch Information</h4>
                        <div style="margin: 5px 0;"><strong>Branch:</strong> <span style="float: right;">Main Hospital</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0;"><strong>Branch Code:</strong> <span style="float: right;">MAIN</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0;"><strong>Location:</strong> <span style="float: right;">Main Office</span></div>
                    </div>
                </div>
                
                <!-- Detailed Earnings Table -->
                <div style="margin-bottom: 25px; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden;">
                    <div style="background: #0f172a; padding: 10px 15px; color: white;">
                        <h4 style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase;">EARNINGS BREAKDOWN</h4>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px; font-weight: 600; color: #111827;">Particulars</td>
                            <td style="padding: 10px 15px; text-align: center; font-weight: 600; color: #111827;">Days/Hours</td>
                            <td style="padding: 10px 15px; text-align: right; font-weight: 600; color: #111827;">Rate</td>
                            <td style="padding: 10px 15px; text-align: right; font-weight: 600; color: #111827;">Amount</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px;">Basic Salary</td>
                            <td style="padding: 10px 15px; text-align: center;">22</td>
                            <td style="padding: 10px 15px; text-align: right;">₱${formatCurrency(payslip.basic_salary ? payslip.basic_salary / 22 : 0)}</td>
                            <td style="padding: 10px 15px; text-align: right; font-weight: 600; color: #10b981;">₱${formatCurrency(payslip.basic_salary || payslip.gross_pay || 0)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px;">Overtime Premium (125%)</td>
                            <td style="padding: 10px 15px; text-align: center;">-</td>
                            <td style="padding: 10px 15px; text-align: right;">-</td>
                            <td style="padding: 10px 15px; text-align: right; font-weight: 600; color: #10b981;">₱0.00</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px;">Night Differential (10%)</td>
                            <td style="padding: 10px 15px; text-align: center;">-</td>
                            <td style="padding: 10px 15px; text-align: right;">-</td>
                            <td style="padding: 10px 15px; text-align: right; font-weight: 600; color: #10b981;">₱0.00</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px;">Other Allowances</td>
                            <td style="padding: 10px 15px; text-align: center;">-</td>
                            <td style="padding: 10px 15px; text-align: right;">-</td>
                            <td style="padding: 10px 15px; text-align: right; font-weight: 600; color: #10b981;">₱0.00</td>
                        </tr>
                        <tr style="background: #f0fdf4;">
                            <td style="padding: 12px 15px; font-weight: 700; color: #166534;">GROSS PAY</td>
                            <td style="padding: 12px 15px; text-align: center;"></td>
                            <td style="padding: 12px 15px; text-align: right;"></td>
                            <td style="padding: 12px 15px; text-align: right; font-weight: 700; color: #166534;">₱${formatCurrency(payslip.gross_pay || 0)}</td>
                        </tr>
                    </table>
                </div>
                
                <!-- Detailed Deductions Table -->
                <div style="margin-bottom: 25px; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden;">
                    <div style="background: #0f172a; padding: 10px 15px; color: white;">
                        <h4 style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase;">DEDUCTIONS & WITHHOLDINGS</h4>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px; font-weight: 600; color: #111827;">Particulars</td>
                            <td style="padding: 10px 15px; text-align: right; font-weight: 600; color: #111827;">Amount</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px;">SSS Contribution (3.63%)</td>
                            <td style="padding: 10px 15px; text-align: right; color: #dc2626;">₱${formatCurrency((payslip.gross_pay || 0) * 0.0363)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px;">PhilHealth Contribution (2.75%)</td>
                            <td style="padding: 10px 15px; text-align: right; color: #dc2626;">₱${formatCurrency((payslip.gross_pay || 0) * 0.0275)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px;">Pag-IBIG Contribution (1%)</td>
                            <td style="padding: 10px 15px; text-align: right; color: #dc2626;">₱${formatCurrency((payslip.gross_pay || 0) * 0.01)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px;">Withholding Tax (BIR)</td>
                            <td style="padding: 10px 15px; text-align: right; color: #dc2626;">₱${formatCurrency((payslip.gross_pay || 0) * 0.08)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px 15px;">Other Deductions</td>
                            <td style="padding: 10px 15px; text-align: right; color: #dc2626;">₱0.00</td>
                        </tr>
                        <tr style="background: #fef2f2;">
                            <td style="padding: 12px 15px; font-weight: 700; color: #991b1b;">TOTAL DEDUCTIONS</td>
                            <td style="padding: 12px 15px; text-align: right; font-weight: 700; color: #991b1b;">₱${formatCurrency(payslip.total_deductions || 0)}</td>
                        </tr>
                    </table>
                </div>
                
                <!-- Net Pay Summary -->
                <div style="margin-bottom: 25px; background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 25px; border-radius: 8px; text-align: center;">
                    <p style="font-size: 13px; margin: 0 0 10px 0; opacity: 0.9;">TOTAL PAYMENT DUE</p>
                    <h2 style="font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 2px;">₱${formatCurrency(payslip.net_pay || 0)}</h2>
                </div>
                
                <!-- YTD Summary -->
                <div style="margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px;">
                    <div style="border: 1px solid #d1d5db; padding: 15px; border-radius: 6px;">
                        <h4 style="font-weight: 700; color: #0f172a; margin: 0 0 10px 0; font-size: 11px;">Year-to-Date Summary</h4>
                        <div style="margin: 5px 0;"><strong>YTD Gross:</strong> <span style="float: right;">₱${formatCurrency((payslip.gross_pay || 0) * 1)}</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0;"><strong>YTD Deductions:</strong> <span style="float: right;">₱${formatCurrency((payslip.total_deductions || 0) * 1)}</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0;"><strong>YTD Net:</strong> <span style="float: right; font-weight: 700;">₱${formatCurrency((payslip.net_pay || 0) * 1)}</span></div>
                    </div>
                    
                    <div style="border: 1px solid #d1d5db; padding: 15px; border-radius: 6px;">
                        <h4 style="font-weight: 700; color: #0f172a; margin: 0 0 10px 0; font-size: 11px;">Government Contributions</h4>
                        <div style="margin: 5px 0; font-size: 11px;"><strong>SSS:</strong> <span style="float: right;">₱${formatCurrency((payslip.gross_pay || 0) * 0.0363)}</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0; font-size: 11px;"><strong>PhilHealth:</strong> <span style="float: right;">₱${formatCurrency((payslip.gross_pay || 0) * 0.0275)}</span></div>
                        <div style="clear: both;"></div>
                        <div style="margin: 5px 0; font-size: 11px;"><strong>Pag-IBIG:</strong> <span style="float: right;">₱${formatCurrency((payslip.gross_pay || 0) * 0.01)}</span></div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #d1d5db; text-align: center; font-size: 11px; color: #666;">
                    <p style="margin: 0 0 5px 0;"><strong>Important Notice:</strong></p>
                    <p style="margin: 0 0 5px 0;">This payslip is an official document of Healthcare Hospital and must be retained for your records.</p>
                    <p style="margin: 0 0 10px 0;">For inquiries regarding this payslip, please contact the Human Resources Department.</p>
                    <div style="border-top: 1px solid #d1d5db; padding-top: 10px; margin-top: 10px;">
                        <p style="margin: 0;">Generated: ${new Date().toLocaleString('en-PH')}</p>
                        <p style="margin: 0; font-size: 10px; opacity: 0.7;">System Generated Document • No Signature Required</p>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('payslip-preview-content').innerHTML = payslipHTML;
        
        const modal = document.getElementById('payslip-preview-modal');
        if (modal) modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading payslip preview:', error);
        alert(`Error: ${error.message}`);
    }
}

window.previewPayslip = previewPayslip;

async function downloadPayslipPDF(payslipId = null) {
    const id = payslipId || currentPayslipId;
    if (!id) {
        console.error('No payslip ID provided for download');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/payroll/payslips.php?id=${id}&action=pdf`, {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) throw new Error('Failed to download payslip PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error downloading payslip PDF:', error);
        alert(`Error: ${error.message}`);
    }
}

window.downloadPayslipPDF = downloadPayslipPDF;

function printPayslip() {
    const content = document.getElementById('payslip-preview-content');
    if (content) {
        const printWindow = window.open('', '', 'width=900,height=1200');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Employee Payslip</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 20px; }
                        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
                    }
                    body { 
                        font-family: 'Arial', sans-serif; 
                        color: #333;
                        line-height: 1.6;
                    }
                    table { width: 100%; border-collapse: collapse; }
                    tr { page-break-inside: avoid; }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
            </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    }
}

window.printPayslip = printPayslip;

function emailPayslip() {
    if (currentPayslipId) {
        alert(`Email payslip functionality - Payslip ID: ${currentPayslipId}`);
    }
}

window.emailPayslip = emailPayslip;

function viewPayslipAuditLog(payslipId) {
    alert(`Audit Log for Payslip #${payslipId}\n\nShows:\n- Generation history\n- Download logs\n- Modification history\n- User actions`);
}

window.viewPayslipAuditLog = viewPayslipAuditLog;

async function exportPayslipsData() {
    try {
        const filters = getPayslipFilters();
        const response = await fetch(`${API_BASE_URL}/payroll/payslips.php?${new URLSearchParams({...filters, limit: 1000})}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) throw new Error('Failed to export payslips');

        const result = await response.json();
        const payslips = result.data?.payslips || [];

        // Create CSV content
        const headers = ['Employee Name', 'Employee Number', 'Department', 'Position', 'Branch', 'Pay Period Start', 'Pay Period End', 'Pay Date', 'Gross Income', 'Total Deductions', 'Net Income', 'Status', 'Payroll Run ID'];
        const rows = payslips.map(p => [
            p.employee_name || '',
            p.EmployeeNumber || '',
            p.DepartmentName || '',
            p.PositionName || '',
            p.BranchName || '',
            p.PayPeriodStart || '',
            p.PayPeriodEnd || '',
            p.PayDate || '',
            p.GrossIncome || 0,
            p.TotalDeductions || 0,
            p.NetIncome || 0,
            p.Status || '',
            p.PayrollRunID || ''
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `payslips_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(`Exported ${payslips.length} payslip records successfully!`);
    } catch (error) {
        console.error('Error exporting payslips:', error);
        alert(`Error exporting payslips: ${error.message}`);
    }
}

window.exportPayslipsData = exportPayslipsData;
