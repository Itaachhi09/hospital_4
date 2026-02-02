import { REST_API_URL } from '../../utils.js';

// Get LEGACY_API_URL from window or utils
// API base for Employees endpoints
const LEGACY_API_URL = '/api/Employees/';

// Primary renderer for HMO Claims admin section
export async function displayHMOClaimsSection() {
    const container = document.getElementById('hmoClaimsContainer');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; padding: 48px 0;">
            <div style="text-align: center;">
                <div style="display: inline-block; animation: spin 1s linear infinite; border-radius: 9999px; height: 48px; width: 48px; border-bottom: 2px solid #a855f7; margin-bottom: 16px;"></div>
                <p style="color: #9ca3af; margin-top: 16px;">Loading HMO claims...</p>
            </div>
        </div>
    `;

    try {
        const res = await fetch(`${REST_API_URL}hmo/hmo.php?resource=claims`, { credentials: 'include' });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const response = await res.json();
        const claims = response.data?.claims || response.claims || [];
        
        // Store cache for filtering
        window._hmoClaimsCache = claims;
        
        // Calculate statistics
        const pendingCount = claims.filter(c => c.ClaimStatus === 'Pending').length;
        const approvedCount = claims.filter(c => c.ClaimStatus === 'Approved').length;
        const deniedCount = claims.filter(c => c.ClaimStatus === 'Denied').length;
        
        container.innerHTML = `
            <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
                <!-- Enhanced Header -->
                <div style="background: linear-gradient(to right, #a855f7, #7c3aed); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">HMO Claims</h2>
                            <p style="font-size: 14px; color: rgba(255,255,255,0.7);">Manage and process employee health insurance claims</p>
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
                            <button id="add-claim-btn" style="padding: 8px 16px; background: white; color: #a855f7; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                                <i class="fas fa-plus-circle"></i>
                                <span>File Claim</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Summary Statistics -->
                <div style="padding: 16px 24px; background: #f3e8ff; border-bottom: 1px solid #e9d5ff;">
                    <div style="display: flex; align-items: center; gap: 24px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-file-medical" style="color: #a855f7;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Total Claims:</span>
                            <span style="font-weight: bold; color: #1f2937;">${claims.length}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-clock" style="color: #eab308;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Pending:</span>
                            <span style="font-weight: bold; color: #eab308;">${pendingCount}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-check-circle" style="color: #16a34a;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Approved:</span>
                            <span style="font-weight: bold; color: #16a34a;">${approvedCount}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-times-circle" style="color: #dc2626;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Denied:</span>
                            <span style="font-weight: bold; color: #dc2626;">${deniedCount}</span>
                        </div>
                    </div>
                </div>

                <!-- Search and Filters -->
                <div style="padding: 16px 24px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                        <div style="flex: 1; min-width: 300px; position: relative;">
                            <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af;"></i>
                            <input id="hmo-claim-search" type="text" placeholder="Search employee, plan, or hospital..." 
                                   style="width: 100%; padding-left: 40px; padding-right: 16px; padding-top: 8px; padding-bottom: 8px; border: 1px solid #d1d5db; border-radius: 6px; outline: none;" />
                        </div>
                        <select id="hmo-claim-status-filter" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; outline: none;">
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Denied">Denied</option>
                        </select>
                    </div>
                </div>

                <!-- Table -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; text-align: left;" id="hmo-claims-table">
                        <thead>
                            <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Employee</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Plan</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Date</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Hospital/Clinic</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="hmo-claims-tbody" style="background: white; border-top: 1px solid #e5e7eb;"></tbody>
                    </table>
                </div>
            </div>
        `;

        // Populate table
        populateClaimsTbody(window._hmoClaimsCache);

        // Wire controls
        document.getElementById('refresh-claims')?.addEventListener('click', () => displayHMOClaimsSection());
        document.getElementById('add-claim-btn')?.addEventListener('click', () => showAddClaimModal());
        document.getElementById('export-claims')?.addEventListener('click', exportClaimsToCSV);
        document.getElementById('hmo-claim-search')?.addEventListener('input', () => applyClaimFilters());
        document.getElementById('hmo-claim-status-filter')?.addEventListener('change', () => applyClaimFilters());

    } catch (e) {
        console.error('Error loading HMO claims', e);
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

function applyClaimFilters() {
    const q = (document.getElementById('hmo-claim-search')?.value || '').toLowerCase().trim();
    const status = (document.getElementById('hmo-claim-status-filter')?.value || '');
    const all = window._hmoClaimsCache || [];
    const filtered = all.filter(c => {
        if (status && c.ClaimStatus !== status) return false;
        if (!q) return true;
        const name = c.FirstName ? (c.FirstName + ' ' + (c.LastName || '')) : '';
        return name.toLowerCase().includes(q) ||
               (c.PlanName || '').toLowerCase().includes(q) ||
               (c.HospitalClinic || '').toLowerCase().includes(q);
    });
    populateClaimsTbody(filtered);
}

function populateClaimsTbody(claims) {
    const tbody = document.getElementById('hmo-claims-tbody');
    if (!tbody) return;

    if (!claims || claims.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 48px 24px; text-align: center;">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
                        <i class="fas fa-file-medical" style="color: #d1d5db; font-size: 48px;"></i>
                        <p style="color: #6b7280; font-size: 18px; font-weight: 500;">No claims found</p>
                        <p style="color: #9ca3af; font-size: 14px;">File a new claim to get started</p>
                        <button id="empty-add-claim" style="margin-top: 8px; padding: 8px 16px; background: #a855f7; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.15s;" onmouseover="this.style.background='#9333ea'" onmouseout="this.style.background='#a855f7'">
                            <i class="fas fa-plus-circle" style="margin-right: 8px;"></i>File Your First Claim
                        </button>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('empty-add-claim')?.addEventListener('click', () => showAddClaimModal());
        return;
    }

    tbody.innerHTML = claims.map(c => {
        const name = c.FirstName ? (c.FirstName + (c.LastName ? ' ' + c.LastName : '')) : (c.EmployeeID || 'N/A');
        const statusBadge = c.ClaimStatus === 'Approved' 
            ? '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #dcfce7; color: #166534;"><i class="fas fa-check-circle" style="margin-right: 4px;"></i>Approved</span>'
            : c.ClaimStatus === 'Denied'
            ? '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #fee2e2; color: #991b1b;"><i class="fas fa-times-circle" style="margin-right: 4px;"></i>Denied</span>'
            : '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #fef3c7; color: #92400e;"><i class="fas fa-clock" style="margin-right: 4px;"></i>Pending</span>';
        
        const amount = c.ClaimAmount ? `₱${parseFloat(c.ClaimAmount).toLocaleString()}` : 'N/A';
        
        return `
            <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.15s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                <td style="padding: 16px 24px; white-space: nowrap;">
                    <div style="font-size: 14px; font-weight: 500; color: #111827;">${name}</div>
                </td>
                <td style="padding: 16px 24px; white-space: nowrap;">
                    <div style="font-size: 14px; color: #374151;">${c.PlanName || 'N/A'}</div>
                </td>
                <td style="padding: 16px 24px; white-space: nowrap;">
                    <div style="font-size: 14px; color: #374151;">${c.ClaimDate || 'N/A'}</div>
                </td>
                <td style="padding: 16px 24px; white-space: nowrap;">
                    <div style="font-size: 14px; color: #374151;">${c.HospitalClinic || 'N/A'}</div>
                </td>
                <td style="padding: 16px 24px; white-space: nowrap;">
                    <div style="font-size: 14px; font-weight: 500; color: #111827;">${amount}</div>
                </td>
                <td style="padding: 16px 24px; white-space: nowrap;">${statusBadge}</td>
                <td style="padding: 16px 24px; white-space: nowrap; text-align: right; font-size: 14px; font-weight: 500;">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                        <button class="manage-claim" data-id="${c.ClaimID}" style="background: none; border: none; color: #2563eb; cursor: pointer; transition: color 0.15s;" title="Manage Claim" onmouseover="this.style.color='#1d4ed8'" onmouseout="this.style.color='#2563eb'">
                            <i class="fas fa-tasks"></i>
                        </button>
                        <button class="view-attachments" data-id="${c.ClaimID}" style="background: none; border: none; color: #a855f7; cursor: pointer; transition: color 0.15s;" title="View Attachments" onmouseover="this.style.color='#9333ea'" onmouseout="this.style.color='#a855f7'">
                            <i class="fas fa-paperclip"></i>
                        </button>
                        <button class="delete-claim" data-id="${c.ClaimID}" style="background: none; border: none; color: #dc2626; cursor: pointer; transition: color 0.15s;" title="Delete Claim" onmouseover="this.style.color='#b91c1c'" onmouseout="this.style.color='#dc2626'">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Wire row buttons
    tbody.querySelectorAll('.manage-claim').forEach(btn => btn.addEventListener('click', (ev) => {
        const id = ev.target.closest('button').dataset.id;
        showManageModal([id]);
    }));

    tbody.querySelectorAll('.view-attachments').forEach(btn => btn.addEventListener('click', async (ev) => {
        const id = ev.target.closest('button').dataset.id;
        const r = await fetch(`${REST_API_URL}hmo/hmo.php?resource=claims?id=${id}`, { credentials: 'include' });
        const j = await r.json();
        const claim = j.claim || {};
        const modal = document.getElementById('modalContainer'); 
        if (!modal) return;
        const attachments = claim.Attachments || [];
        modal.innerHTML = `
            <div id="view-attachments-overlay" style="position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);">
                <div style="background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 32rem; margin: 0 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                        <h5 style="font-size: 18px; font-weight: 600;">Attachments</h5>
                        <button id="view-attachments-close" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
                    </div>
                    <div style="padding: 16px;">
                        ${attachments.length === 0 ? '<div>No attachments</div>' : '<ul style="list-style: none; padding: 0;">' + attachments.map(a => `<li style="margin-bottom: 8px;"><a href="${a.replace(/\\/g,'/')}" target="_blank" style="color: #2563eb; text-decoration: none;">${a.split('/').pop()}</a></li>`).join('') + '</ul>'}
                    </div>
                    <div style="display: flex; justify-content: flex-end; padding: 16px; border-top: 1px solid #e5e7eb;"><button id="view-attachments-close-btn" style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">Close</button></div>
                </div>
            </div>`;
        document.getElementById('view-attachments-close')?.addEventListener('click', () => { document.getElementById('view-attachments-overlay')?.remove(); });
        document.getElementById('view-attachments-close-btn')?.addEventListener('click', () => { document.getElementById('view-attachments-overlay')?.remove(); });
    }));

    tbody.querySelectorAll('.delete-claim').forEach(btn => btn.addEventListener('click', async (ev) => {
        const id = ev.target.closest('button').dataset.id;
        if (!confirm('Are you sure you want to delete this claim?')) return;
        try {
            const r = await fetch(`${REST_API_URL}hmo/hmo.php?resource=claims?id=${id}`, { method: 'DELETE', credentials: 'include' });
            const j = await r.json();
            if (j.success) displayHMOClaimsSection(); 
            else alert(j.error || 'Failed to delete');
        } catch (e) { 
            console.error(e); 
            alert('Failed to delete claim'); 
        }
    }));
}

// Export to CSV function
function exportClaimsToCSV() {
    const claims = window._hmoClaimsCache || [];
    if (claims.length === 0) {
        alert('No claims to export');
        return;
    }
    
    const headers = ['Employee', 'Plan', 'Date', 'Hospital/Clinic', 'Amount', 'Status'];
    const rows = claims.map(c => [
        c.FirstName ? (c.FirstName + ' ' + (c.LastName || '')) : '',
        c.PlanName || '',
        c.ClaimDate || '',
        c.HospitalClinic || '',
        c.ClaimAmount || '',
        c.ClaimStatus || ''
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hmo-claims-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Modal helpers
export async function showAddClaimModal() {
    const modal = document.getElementById('modalContainer'); 
    if (!modal) return;
    try {
        const pres = await fetch(`${REST_API_URL}HMO/enrollments.php`, { credentials: 'include' });
        const pdata = await pres.json();
        const enrollments = pdata.data?.enrollments || pdata.enrollments || [];

        modal.innerHTML = `
            <div id="add-claim-overlay" style="position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);">
                <div style="background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 48rem; margin: 0 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                        <h5 style="font-size: 18px; font-weight: 600;">File Claim</h5>
                        <button id="add-claim-close" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
                    </div>
                    <form id="addClaimForm" enctype="multipart/form-data" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Enrollment</label>
                            <select name="enrollment_id" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required>
                                <option value="">Select Enrollment</option>
                                ${enrollments.map(e => `<option value="${e.EnrollmentID}">${(e.FirstName||'') + ' ' + (e.LastName||'')} - ${e.PlanName||''}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Claim Date</label>
                            <input type="date" name="claim_date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required/>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Hospital/Clinic</label>
                            <input name="hospital_clinic" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"/>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px;">
                            <button type="button" id="add-claim-cancel" style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="padding: 8px 16px; background: #a855f7; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
                        </div>
                    </form>
                </div>
            </div>`;

        document.getElementById('add-claim-close')?.addEventListener('click', () => { document.getElementById('add-claim-overlay')?.remove(); });
        document.getElementById('add-claim-cancel')?.addEventListener('click', () => { document.getElementById('add-claim-overlay')?.remove(); });

        document.getElementById('addClaimForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const fd = new FormData(form);
            try {
                const res = await fetch(`${REST_API_URL}hmo/hmo.php?resource=claims`, { method: 'POST', credentials: 'include', body: fd });
                const j = await res.json(); 
                if (j.success) { 
                    document.getElementById('add-claim-overlay')?.remove(); 
                    displayHMOClaimsSection(); 
                } else alert(j.error || 'Failed');
            } catch (err) { 
                console.error(err); 
                alert('Failed to submit claim'); 
            }
        });

    } catch (err) { 
        console.error(err); 
        alert('Failed to load enrollments'); 
    }
}

export async function showEditClaimModal(id) {
    const modal = document.getElementById('modalContainer'); 
    if (!modal) return;
    try {
        const r = await fetch(`${REST_API_URL}hmo/hmo.php?resource=claims?id=${id}`, { credentials: 'include' });
        const data = await r.json(); 
        const c = data.claim || {};
        
        const pres = await fetch(`${REST_API_URL}HMO/enrollments.php`, { credentials: 'include' });
        const pdata = await pres.json(); 
        const enrollments = pdata.data?.enrollments || pdata.enrollments || [];

        modal.innerHTML = `
            <div id="edit-claim-overlay" style="position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);">
                <div style="background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 48rem; margin: 0 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                        <h5 style="font-size: 18px; font-weight: 600;">Edit Claim</h5>
                        <button id="edit-claim-close" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
                    </div>
                    <form id="editClaimForm" enctype="multipart/form-data" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <input type="hidden" name="id" value="${id}" />
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Enrollment</label>
                            <select name="enrollment_id" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required>
                                <option value="">Select Enrollment</option>
                                ${enrollments.map(e => `<option value="${e.EnrollmentID}" ${e.EnrollmentID == c.EnrollmentID ? 'selected' : ''}>${(e.FirstName||'') + ' ' + (e.LastName||'')} - ${e.PlanName||''}</option>`).join('')}
                            </select>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px;">
                            <button type="button" id="edit-claim-cancel" style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="padding: 8px 16px; background: #a855f7; color: white; border: none; border-radius: 4px; cursor: pointer;">Save</button>
                        </div>
                    </form>
                </div>
            </div>`;

        document.getElementById('edit-claim-close')?.addEventListener('click', () => { document.getElementById('edit-claim-overlay')?.remove(); });
        document.getElementById('edit-claim-cancel')?.addEventListener('click', () => { document.getElementById('edit-claim-overlay')?.remove(); });

        document.getElementById('editClaimForm')?.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const form = e.target; 
            const fd = new FormData(form);
            try {
                const res2 = await fetch(`${REST_API_URL}hmo/hmo.php?resource=claims?id=${id}`, { method: 'PUT', credentials: 'include', body: fd });
                const j2 = await res2.json(); 
                if (j2.success) { 
                    document.getElementById('edit-claim-overlay')?.remove(); 
                    displayHMOClaimsSection(); 
                } else alert(j2.error || 'Failed');
            } catch (err) { 
                console.error(err); 
                alert('Failed to save claim'); 
            }
        });

    } catch (err) { 
        console.error(err); 
        alert('Failed to load claim'); 
    }
}

export function showManageModal(claimIds = []) {
    const modal = document.getElementById('modalContainer'); 
    if (!modal) return;
    const ids = Array.isArray(claimIds) ? claimIds : [claimIds];

    modal.innerHTML = `
        <div id="manage-claims-overlay" style="position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);">
            <div style="background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 32rem; margin: 0 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <h5 style="font-size: 18px; font-weight: 600;">Manage Claim(s)</h5>
                    <button id="manage-claims-close" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
                </div>
                <form id="manageClaimsForm" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                    <div>Selected Claim IDs: <strong>${ids.join(', ')}</strong></div>
                    <div>
                        <label style="display: block; font-size: 14px; margin-bottom: 4px;">Action</label>
                        <select name="action" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="Approve">Approve</option>
                            <option value="Deny">Deny</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; margin-bottom: 4px;">Notes</label>
                        <textarea name="notes" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; min-height: 80px;"></textarea>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px;">
                        <button type="button" id="manage-claims-cancel" style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="padding: 8px 16px; background: #a855f7; color: white; border: none; border-radius: 4px; cursor: pointer;">Apply</button>
                    </div>
                </form>
            </div>
        </div>`;

    document.getElementById('manage-claims-close')?.addEventListener('click', () => { document.getElementById('manage-claims-overlay')?.remove(); });
    document.getElementById('manage-claims-cancel')?.addEventListener('click', () => { document.getElementById('manage-claims-overlay')?.remove(); });

    document.getElementById('manageClaimsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const fd = new FormData(e.target); 
        const action = fd.get('action'); 
        const notes = fd.get('notes');
        for (const id of ids) {
            try {
                const res = await fetch(`${REST_API_URL}hmo/hmo.php?resource=claims?id=${id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ claim_status: action === 'Approve' ? 'Approved' : 'Denied', remarks: notes }) });
                const j = await res.json(); 
                if (!j.success) alert('Failed to update ' + id);
            } catch (err) { 
                console.error(err); 
                alert('Failed to update ' + id); 
            }
        }
        document.getElementById('manage-claims-overlay')?.remove(); 
        displayHMOClaimsSection();
    });
}

export function showClaimHistoryModal(employeeId) {
    const modal = document.getElementById('modalContainer'); 
    if (!modal) return;
    modal.innerHTML = `
        <div id="claim-history-overlay" style="position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);">
            <div style="background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 48rem; margin: 0 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <h5 style="font-size: 18px; font-weight: 600;">Claim History</h5>
                    <button id="claim-history-close" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
                </div>
                <div style="padding: 16px;">
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 14px; margin-bottom: 4px;">Status</label>
                        <select id="history-status" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                            <option value="">All</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Denied">Denied</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 14px; margin-bottom: 4px;">From</label>
                        <input id="history-from" type="date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"/>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 14px; margin-bottom: 4px;">To</label>
                        <input id="history-to" type="date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"/>
                    </div>
                    <div id="history-results"></div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; padding: 16px; border-top: 1px solid #e5e7eb;">
                    <button id="history-refresh" style="padding: 8px 16px; background: #a855f7; color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh</button>
                    <button id="claim-history-close-btn" style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                </div>
            </div>
        </div>`;

    document.getElementById('claim-history-close')?.addEventListener('click', () => { document.getElementById('claim-history-overlay')?.remove(); });
    document.getElementById('claim-history-close-btn')?.addEventListener('click', () => { document.getElementById('claim-history-overlay')?.remove(); });

    async function loadHistory() {
        const status = document.getElementById('history-status').value; 
        const from = document.getElementById('history-from').value; 
        const to = document.getElementById('history-to').value;
        const q = new URLSearchParams({ mode: 'history', employee_id: employeeId, status, from, to });
        try {
            const r = await fetch(`${REST_API_URL}hmo/hmo.php?resource=claims?` + q.toString(), { credentials: 'include' });
            const j = await r.json(); 
            const rows = j.claims || [];
            document.getElementById('history-results').innerHTML = `<table style="width: 100%; text-align: left; font-size: 14px; margin-top: 12px;"><thead><tr style="background: #f3f4f6;"><th style="padding: 8px;">Plan</th><th style="padding: 8px;">Date</th><th style="padding: 8px;">Hospital</th><th style="padding: 8px;">Amount</th><th style="padding: 8px;">Status</th><th style="padding: 8px;">Remarks</th></tr></thead><tbody>` + rows.map(rr => `<tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px;">${rr.PlanName||''}</td><td style="padding: 8px;">${rr.ClaimDate||''}</td><td style="padding: 8px;">${rr.HospitalClinic||''}</td><td style="padding: 8px;">${rr.ClaimAmount||''}</td><td style="padding: 8px;">${rr.ClaimStatus||''}</td><td style="padding: 8px;">${rr.Remarks||''}</td></tr>`).join('') + `</tbody></table>`;
        } catch (err) { 
            console.error(err); 
            document.getElementById('history-results').innerText = 'Failed to load history'; 
        }
    }

    document.getElementById('history-refresh')?.addEventListener('click', loadHistory);
    loadHistory();
}
