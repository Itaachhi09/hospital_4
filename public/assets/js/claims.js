import { REST_API_URL } from '../../utils.js';

/**
 * HMO Claims Module
 * Manages HMO claims processing and tracking
 */

export async function displayHMOClaimsSection() {
    const container = document.getElementById('hmoClaimsContainer');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; padding: 48px 0;">
            <div style="text-align: center;">
                <div style="display: inline-block; animation: spin 1s linear infinite; border-radius: 9999px; height: 48px; width: 48px; border-bottom: 2px solid #2563eb; margin-bottom: 16px;"></div>
                <p style="color: #9ca3af; margin-top: 16px;">Loading claims...</p>
            </div>
        </div>
    `;

    try {
        const res = await fetch(`${REST_API_URL}hmo/claims.php`, { credentials: 'include' });
        if (!res.ok) {
            const text = await res.text();
            console.error('API Error Response:', text);
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        const claims = data.success ? (data.data?.claims || data.data || []) : [];

        // Calculate statistics
        const pendingCount = claims.filter(c => c.status === 'pending' || c.Status === 'Pending').length;
        const approvedCount = claims.filter(c => c.status === 'approved' || c.Status === 'Approved').length;
        const rejectedCount = claims.filter(c => c.status === 'rejected' || c.Status === 'Rejected').length;
        const totalAmount = claims.reduce((sum, c) => sum + (parseFloat(c.amount || c.Amount || 0)), 0);

        container.innerHTML = `
            <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
                <!-- Enhanced Header -->
                <div style="background: linear-gradient(to right, #3b82f6, #60a5fa); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">HMO Claims</h2>
                            <p style="font-size: 14px; color: rgba(255,255,255,0.7);">Manage employee health insurance claims</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button id="refresh-claims" style="padding: 8px 16px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 6px; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                                <i class="fas fa-sync-alt"></i>
                                <span>Refresh</span>
                            </button>
                            <button id="export-claims" style="padding: 8px 16px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 6px; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                                <i class="fas fa-download"></i>
                                <span>Export</span>
                            </button>
                            <button id="add-claim-btn" style="padding: 8px 16px; background: white; color: #3b82f6; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                                <i class="fas fa-plus"></i>
                                <span>File Claim</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Summary Statistics -->
                <div style="padding: 16px 24px; background: #dbeafe; border-bottom: 1px solid #93c5fd;">
                    <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-file-invoice" style="color: #3b82f6;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Total Claims:</span>
                            <span style="font-weight: bold; color: #1f2937;">${claims.length}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-check-circle" style="color: #16a34a;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Approved:</span>
                            <span style="font-weight: bold; color: #16a34a;">${approvedCount}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-clock" style="color: #eab308;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Pending:</span>
                            <span style="font-weight: bold; color: #eab308;">${pendingCount}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-times-circle" style="color: #dc2626;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Rejected:</span>
                            <span style="font-weight: bold; color: #dc2626;">${rejectedCount}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-peso-sign" style="color: #059669;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Total Amount:</span>
                            <span style="font-weight: bold; color: #059669;">₱${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; text-align: left;" id="hmo-claims-table">
                        <thead>
                            <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Employee</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Claim Date</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Reason</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody style="background: white; border-top: 1px solid #e5e7eb;">
                        ${claims.length === 0 ? `
                            <tr>
                                <td colspan="6" style="padding: 48px 24px; text-align: center;">
                                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
                                        <i class="fas fa-file-medical" style="color: #d1d5db; font-size: 48px;"></i>
                                        <p style="color: #6b7280; font-size: 18px; font-weight: 500;">No claims found</p>
                                        <p style="color: #9ca3af; font-size: 14px;">Start filing HMO claims for employees</p>
                                        <button id="empty-add-claim" style="margin-top: 8px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.15s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                                            <i class="fas fa-plus" style="margin-right: 8px;"></i>File First Claim
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ` : claims.map(c => {
                            const claimStatus = c.status || c.Status || 'pending';
                            const employeeName = c.employee_name || c.EmployeeName || `Employee #${c.employee_id || c.EmployeeID || 'N/A'}`;
                            const claimDate = c.claim_date || c.ClaimDate || c.created_at || 'N/A';
                            const amount = parseFloat(c.amount || c.Amount || 0);
                            const reason = c.reason || c.Reason || 'N/A';
                            
                            let statusBadge = '';
                            if (claimStatus.toLowerCase() === 'approved') {
                                statusBadge = '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #dcfce7; color: #166534;"><i class="fas fa-check-circle" style="margin-right: 4px;"></i>Approved</span>';
                            } else if (claimStatus.toLowerCase() === 'pending') {
                                statusBadge = '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #fef3c7; color: #92400e;"><i class="fas fa-clock" style="margin-right: 4px;"></i>Pending</span>';
                            } else if (claimStatus.toLowerCase() === 'rejected') {
                                statusBadge = '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #fee2e2; color: #991b1b;"><i class="fas fa-times-circle" style="margin-right: 4px;"></i>Rejected</span>';
                            } else {
                                statusBadge = '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #f3f4f6; color: #1f2937;">' + claimStatus + '</span>';
                            }
                            
                            const claimId = c.id || c.ClaimID || c.claim_id || '';
                            
                            return `
                            <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.15s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                                <td style="padding: 16px 24px; white-space: nowrap;">
                                    <div style="display: flex; align-items: center;">
                                        <div style="flex-shrink: 0; height: 40px; width: 40px; background: #dbeafe; border-radius: 9999px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-user" style="color: #2563eb;"></i>
                                        </div>
                                        <div style="margin-left: 12px;">
                                            <div style="font-size: 14px; font-weight: 500; color: #111827;">${employeeName}</div>
                                            <div style="font-size: 12px; color: #6b7280;">ID: ${c.employee_id || c.EmployeeID || 'N/A'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding: 16px 24px; white-space: nowrap;">
                                    <div style="font-size: 14px; color: #374151;">${claimDate}</div>
                                </td>
                                <td style="padding: 16px 24px; white-space: nowrap;">
                                    <div style="font-size: 14px; font-weight: 600; color: #059669;">₱${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </td>
                                <td style="padding: 16px 24px;">
                                    <div style="font-size: 14px; color: #374151; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${reason}">${reason}</div>
                                </td>
                                <td style="padding: 16px 24px; white-space: nowrap;">${statusBadge}</td>
                                <td style="padding: 16px 24px; white-space: nowrap; text-align: right; font-size: 14px; font-weight: 500;">
                                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                                        ${claimStatus.toLowerCase() === 'pending' ? `
                                            <button class="approve-claim" data-id="${claimId}" style="background: none; border: none; color: #16a34a; cursor: pointer; transition: color 0.15s;" title="Approve Claim" onmouseover="this.style.color='#15803d'" onmouseout="this.style.color='#16a34a'">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button class="reject-claim" data-id="${claimId}" style="background: none; border: none; color: #dc2626; cursor: pointer; transition: color 0.15s;" title="Reject Claim" onmouseover="this.style.color='#b91c1c'" onmouseout="this.style.color='#dc2626'">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        ` : ''}
                                        <button class="view-claim" data-id="${claimId}" style="background: none; border: none; color: #2563eb; cursor: pointer; transition: color 0.15s;" title="View Details" onmouseover="this.style.color='#1d4ed8'" onmouseout="this.style.color='#2563eb'">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="delete-claim" data-id="${claimId}" style="background: none; border: none; color: #dc2626; cursor: pointer; transition: color 0.15s;" title="Delete Claim" onmouseover="this.style.color='#b91c1c'" onmouseout="this.style.color='#dc2626'">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>`;
                        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('refresh-claims')?.addEventListener('click', () => displayHMOClaimsSection());
        document.getElementById('add-claim-btn')?.addEventListener('click', () => showAddClaimModal());
        document.getElementById('empty-add-claim')?.addEventListener('click', () => showAddClaimModal());
        document.getElementById('export-claims')?.addEventListener('click', () => exportClaimsToCSV(claims));

        // Approve claim
        container.querySelectorAll('.approve-claim').forEach(b => b.addEventListener('click', async ev => {
            const id = ev.target.closest('button').dataset.id;
            if (!id || !confirm('Approve this claim?')) return;
            try {
                const r = await fetch(`${REST_API_URL}hmo/claims.php?id=${id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'approved' })
                });
                const j = await r.json();
                if (j.success) {
                    displayHMOClaimsSection();
                } else {
                    alert(j.error || 'Failed to approve claim');
                }
            } catch (error) {
                console.error('Error approving claim:', error);
                alert('Failed to approve claim');
            }
        }));

        // Reject claim
        container.querySelectorAll('.reject-claim').forEach(b => b.addEventListener('click', async ev => {
            const id = ev.target.closest('button').dataset.id;
            if (!id || !confirm('Reject this claim?')) return;
            try {
                const r = await fetch(`${REST_API_URL}hmo/claims.php?id=${id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'rejected' })
                });
                const j = await r.json();
                if (j.success) {
                    displayHMOClaimsSection();
                } else {
                    alert(j.error || 'Failed to reject claim');
                }
            } catch (error) {
                console.error('Error rejecting claim:', error);
                alert('Failed to reject claim');
            }
        }));

        // Delete claim
        container.querySelectorAll('.delete-claim').forEach(b => b.addEventListener('click', async ev => {
            const id = ev.target.closest('button').dataset.id;
            if (!id || !confirm('Delete this claim? This action cannot be undone.')) return;
            try {
                const r = await fetch(`${REST_API_URL}hmo/claims.php?id=${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const j = await r.json();
                if (j.success) {
                    displayHMOClaimsSection();
                } else {
                    alert(j.error || 'Failed to delete claim');
                }
            } catch (error) {
                console.error('Error deleting claim:', error);
                alert('Failed to delete claim');
            }
        }));

    } catch (e) {
        console.error(e);
        container.innerHTML = `
            <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #fee2e2; padding: 24px;">
                <div style="display: flex; align-items: center; gap: 12px; color: #dc2626;">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>
                    <div>
                        <h3 style="font-size: 18px; font-weight: 600;">Error Loading Claims</h3>
                        <p style="font-size: 14px; color: #991b1b; margin-top: 4px;">${e.message}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// CSV Export Function
function exportClaimsToCSV(claims) {
    if (!claims || claims.length === 0) {
        alert('No claims to export');
        return;
    }

    const headers = ['Claim ID', 'Employee ID', 'Employee Name', 'Claim Date', 'Amount', 'Reason', 'Status'];
    
    const rows = claims.map(c => {
        const employeeName = c.employee_name || c.EmployeeName || '';
        return [
            c.id || c.ClaimID || c.claim_id || '',
            c.employee_id || c.EmployeeID || '',
            employeeName,
            c.claim_date || c.ClaimDate || c.created_at || '',
            c.amount || c.Amount || 0,
            c.reason || c.Reason || '',
            c.status || c.Status || ''
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hmo_claims_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Exported ${claims.length} claims to CSV`);
}

// Add Claim Modal
export async function showAddClaimModal() {
    const container = document.getElementById('modalContainer');
    if (!container) return;

    try {
        const eres = await fetch(`${REST_API_URL}HRCORE/?resource=employees`, { credentials: 'include' });
        const employees = await eres.json();
        const employeeList = employees.success ? (employees.data?.employees || employees.data || []) : [];

        container.innerHTML = `
            <div id="add-claim-overlay" style="position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);">
                <div style="background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 32rem; margin: 0 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                        <h5 style="font-size: 18px; font-weight: 600;">File HMO Claim</h5>
                        <button id="add-claim-close" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
                    </div>
                    <form id="addClaimForm" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Employee</label>
                            <select name="employee_id" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required>
                                <option value="">Select Employee</option>
                                ${employeeList.map(emp => {
                                    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee #${emp.id || emp.employee_id || ''}`;
                                    return `<option value="${emp.id || emp.employee_id || ''}">${name} (${emp.id || emp.employee_id || ''})</option>`;
                                }).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Claim Date</label>
                            <input type="date" name="claim_date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required/>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Amount</label>
                            <input type="number" name="amount" step="0.01" min="0" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required/>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Reason</label>
                            <textarea name="reason" rows="3" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required></textarea>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px;">
                            <button type="button" id="add-claim-cancel" style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit Claim</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('add-claim-close')?.addEventListener('click', () => {
            document.getElementById('add-claim-overlay')?.remove();
        });
        document.getElementById('add-claim-cancel')?.addEventListener('click', () => {
            document.getElementById('add-claim-overlay')?.remove();
        });
        document.getElementById('addClaimForm')?.addEventListener('submit', async e => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const payload = {};
            fd.forEach((v, k) => payload[k] = v);
            
            try {
                const res = await fetch(`${REST_API_URL}hmo/claims.php`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const j = await res.json();
                if (j.success) {
                    document.getElementById('add-claim-overlay')?.remove();
                    displayHMOClaimsSection();
                } else {
                    alert(j.error || 'Failed to file claim');
                }
            } catch (error) {
                console.error('Error filing claim:', error);
                alert('Failed to file claim');
            }
        });
    } catch (e) {
        console.error('Error loading add claim modal:', e);
        alert('Failed to load claim form');
    }
}
