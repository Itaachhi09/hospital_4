import { REST_API_URL } from '../../utils.js';

// Get LEGACY_API_URL from window or utils
const LEGACY_API_URL = (function() {
    if (window.API_BASE_URL) {
        return window.API_BASE_URL + '/Employees/';
    }
    return '/hospital_4/api/Employees/';
})();

export async function displayHMOEnrollmentsSection() {
    const container = document.getElementById('hmoEnrollmentsContainer');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; padding: 48px 0;">
            <div style="text-align: center;">
                <div style="display: inline-block; animation: spin 1s linear infinite; border-radius: 9999px; height: 48px; width: 48px; border-bottom: 2px solid #2563eb; margin-bottom: 16px;"></div>
                <p style="color: #9ca3af; margin-top: 16px;">Loading enrollments...</p>
            </div>
        </div>
    `;

    try{
        const res = await fetch(`${REST_API_URL}hmo/hmo.php?resource=enrollment`, { credentials:'include' });
        if (!res.ok) {
            const text = await res.text();
            console.error('API Error Response:', text);
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json(); 
        const enrollments = data.data?.enrollments || data.enrollments || [];

        // Calculate statistics
        const activeCount = enrollments.filter(e => e.Status === 'Active').length;
        const pendingCount = enrollments.filter(e => e.Status === 'Pending').length;

        container.innerHTML = `
            <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
                <!-- Enhanced Header -->
                <div style="background: linear-gradient(to right, #f97316, #fb923c); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                            <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">HMO Enrollments</h2>
                            <p style="font-size: 14px; color: rgba(255,255,255,0.7);">Manage employee health insurance enrollments</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button id="refresh-enrollments" style="padding: 8px 16px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 6px; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                                <i class="fas fa-sync-alt"></i>
                                <span>Refresh</span>
                            </button>
                            <button id="export-enrollments" style="padding: 8px 16px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 6px; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                                <i class="fas fa-download"></i>
                                <span>Export</span>
                            </button>
                            <button id="add-enrollment-btn" style="padding: 8px 16px; background: white; color: #f97316; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                                <i class="fas fa-user-plus"></i>
                                <span>Enroll Employee</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Summary Statistics -->
                <div style="padding: 16px 24px; background: #fed7aa; border-bottom: 1px solid #fdba74;">
                    <div style="display: flex; align-items: center; gap: 24px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-users" style="color: #f97316;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Total Enrollments:</span>
                            <span style="font-weight: bold; color: #1f2937;">${enrollments.length}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-check-circle" style="color: #16a34a;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Active:</span>
                            <span style="font-weight: bold; color: #16a34a;">${activeCount}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-clock" style="color: #eab308;"></i>
                            <span style="font-size: 14px; color: #4b5563;">Pending:</span>
                            <span style="font-weight: bold; color: #eab308;">${pendingCount}</span>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; text-align: left;" id="hmo-enrollments-table">
                        <thead>
                            <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Employee</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Plan</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Start Date</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">End Date</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                                <th style="padding: 12px 24px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody style="background: white; border-top: 1px solid #e5e7eb;">
                        ${enrollments.length === 0 ? `
                            <tr>
                                <td colspan="6" style="padding: 48px 24px; text-align: center;">
                                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
                                        <i class="fas fa-user-shield" style="color: #d1d5db; font-size: 48px;"></i>
                                        <p style="color: #6b7280; font-size: 18px; font-weight: 500;">No enrollments found</p>
                                        <p style="color: #9ca3af; font-size: 14px;">Start enrolling employees in HMO plans</p>
                                        <button id="empty-add-enrollment" style="margin-top: 8px; padding: 8px 16px; background: #f97316; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.15s;" onmouseover="this.style.background='#ea580c'" onmouseout="this.style.background='#f97316'">
                                            <i class="fas fa-user-plus" style="margin-right: 8px;"></i>Enroll First Employee
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ` : enrollments.map(e=>{
                            const employeeName = e.FirstName ? `${e.FirstName} ${e.LastName||''}`.trim() : `Employee #${e.EmployeeID}`;
                            let statusBadge = '';
                            if (e.Status === 'Active') {
                                statusBadge = '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #dcfce7; color: #166534;"><i class="fas fa-check-circle" style="margin-right: 4px;"></i>Active</span>';
                            } else if (e.Status === 'Pending') {
                                statusBadge = '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #fef3c7; color: #92400e;"><i class="fas fa-clock" style="margin-right: 4px;"></i>Pending</span>';
                            } else if (e.Status === 'Terminated') {
                                statusBadge = '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #fee2e2; color: #991b1b;"><i class="fas fa-times-circle" style="margin-right: 4px;"></i>Terminated</span>';
                            } else {
                                statusBadge = '<span style="display: inline-flex; padding: 4px 12px; font-size: 12px; line-height: 1.25; font-weight: 600; border-radius: 9999px; background: #f3f4f6; color: #1f2937;">' + (e.Status || 'Unknown') + '</span>';
                            }
                            
                            return `
                            <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.15s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                                <td style="padding: 16px 24px; white-space: nowrap;">
                                    <div style="display: flex; align-items: center;">
                                        <div style="flex-shrink: 0; height: 40px; width: 40px; background: #dbeafe; border-radius: 9999px; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-user" style="color: #2563eb;"></i>
                                        </div>
                                        <div style="margin-left: 12px;">
                                            <div style="font-size: 14px; font-weight: 500; color: #111827;">${employeeName}</div>
                                            <div style="font-size: 12px; color: #6b7280;">ID: ${e.EmployeeID}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding: 16px 24px; white-space: nowrap;">
                                    <div style="font-size: 14px; color: #111827;">${e.PlanName || 'N/A'}</div>
                                </td>
                                <td style="padding: 16px 24px; white-space: nowrap;">
                                    <div style="font-size: 14px; color: #374151;">${e.StartDate || 'N/A'}</div>
                                </td>
                                <td style="padding: 16px 24px; white-space: nowrap;">
                                    <div style="font-size: 14px; color: #374151;">${e.EndDate || 'N/A'}</div>
                                </td>
                                <td style="padding: 16px 24px; white-space: nowrap;">${statusBadge}</td>
                                <td style="padding: 16px 24px; white-space: nowrap; text-align: right; font-size: 14px; font-weight: 500;">
                                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                                        <button class="edit-enrollment" data-id="${e.EnrollmentID}" style="background: none; border: none; color: #2563eb; cursor: pointer; transition: color 0.15s;" title="Edit Enrollment" onmouseover="this.style.color='#1d4ed8'" onmouseout="this.style.color='#2563eb'">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        ${e.Status === 'Active' ? `<button class="terminate-enrollment" data-id="${e.EnrollmentID}" style="background: none; border: none; color: #ea580c; cursor: pointer; transition: color 0.15s;" title="Terminate Enrollment" onmouseover="this.style.color='#c2410c'" onmouseout="this.style.color='#ea580c'">
                                            <i class="fas fa-ban"></i>
                                        </button>` : ''}
                                        <button class="delete-enrollment" data-id="${e.EnrollmentID}" style="background: none; border: none; color: #dc2626; cursor: pointer; transition: color 0.15s;" title="Delete Enrollment" onmouseover="this.style.color='#b91c1c'" onmouseout="this.style.color='#dc2626'">
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
        document.getElementById('refresh-enrollments')?.addEventListener('click', ()=>displayHMOEnrollmentsSection());
        document.getElementById('add-enrollment-btn')?.addEventListener('click', ()=>showAddEnrollmentModal());
        document.getElementById('empty-add-enrollment')?.addEventListener('click', ()=>showAddEnrollmentModal());
        document.getElementById('export-enrollments')?.addEventListener('click', ()=>exportEnrollmentsToCSV(enrollments));
        container.querySelectorAll('.edit-enrollment').forEach(b=>b.addEventListener('click', async ev=>{ 
            const id = ev.target.closest('button').dataset.id; 
            if (!id) return; 
            showEditEnrollmentModal(id); 
        }));
        container.querySelectorAll('.terminate-enrollment').forEach(b=>b.addEventListener('click', async ev=>{
            const id = ev.target.closest('button').dataset.id; 
            if (!confirm('Terminate enrollment?')) return; 
            const r = await fetch(`${REST_API_URL}hmo/hmo.php?resource=enrollment?id=${id}`, { method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status:'Terminated'}) }); 
            const j = await r.json(); 
            if (j.success) displayHMOEnrollmentsSection(); 
            else alert(j.error||'Failed');
        }));
        container.querySelectorAll('.delete-enrollment').forEach(b=>b.addEventListener('click', async ev=>{
            const id = ev.target.closest('button').dataset.id;
            
            try {
                const response = await fetch(`${REST_API_URL}hmo/hmo.php?resource=enrollment?id=${id}`, { 
                    credentials: 'include' 
                });
                const data = await response.json();
                const enrollment = data.enrollment;

                if (!enrollment) {
                    alert('Enrollment not found');
                    return;
                }

                const employeeName = `${enrollment.FirstName || ''} ${enrollment.LastName || ''}`.trim();
                const confirmMessage = `Are you sure you want to delete the enrollment for ${employeeName}?\n\nPlan: ${enrollment.PlanName}\nStatus: ${enrollment.Status}\n\nThis action cannot be undone.`;

                if (!confirm(confirmMessage)) {
                    return;
                }

                try {
                    const r = await fetch(`${REST_API_URL}hmo/hmo.php?resource=enrollment?id=${id}`, { 
                        method: 'DELETE', 
                        credentials: 'include' 
                    });
                    const j = await r.json();
                    
                    if (j.success) {
                        try {
                            await displayHMOEnrollmentsSection();
                            console.log('Enrollment deleted and table refreshed');
                        } catch(err) {
                            console.error('Error refreshing enrollments:', err);
                            alert('Enrollment was deleted but the table refresh failed. Please refresh the page manually.');
                        }
                    } else {
                        alert(j.error || 'Failed to delete enrollment. It may have active claims or be in an invalid state.');
                    }
                } catch (error) {
                    console.error('Error deleting enrollment:', error);
                    alert('Failed to delete enrollment. Please check your connection and try again.');
                }
            } catch (error) {
                console.error('Error fetching enrollment details:', error);
                alert('Could not get enrollment details. Please try again.');
            }
        }));
    }catch(e){
        console.error(e); 
        container.innerHTML = `
            <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #fee2e2; padding: 24px;">
                <div style="display: flex; align-items: center; gap: 12px; color: #dc2626;">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>
                    <div>
                        <h3 style="font-size: 18px; font-weight: 600;">Error Loading Enrollments</h3>
                        <p style="font-size: 14px; color: #991b1b; margin-top: 4px;">${e.message}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// CSV Export Function
function exportEnrollmentsToCSV(enrollments) {
    if (!enrollments || enrollments.length === 0) {
        alert('No enrollments to export');
        return;
    }

    const headers = ['Enrollment ID', 'Employee ID', 'Employee Name', 'Plan', 'Start Date', 'End Date', 'Status'];
    
    const rows = enrollments.map(e => {
        const employeeName = e.FirstName ? `${e.FirstName} ${e.LastName||''}`.trim() : '';
        
        return [
            e.EnrollmentID || '',
            e.EmployeeID || '',
            employeeName,
            e.PlanName || '',
            e.StartDate || '',
            e.EndDate || '',
            e.Status || ''
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
    link.setAttribute('download', `hmo_enrollments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Exported ${enrollments.length} enrollments to CSV`);
}

export async function showAddEnrollmentModal(){
    try {
        const pres = await fetch(`${REST_API_URL}hmo/hmo.php?resource=plans`, { credentials:'include' }); 
        const pdata = await pres.json(); 
        const plans = pdata.data?.plans || pdata.plans || [];
        
        const eres = await fetch(`${LEGACY_API_URL}get_employees.php`, { credentials:'include' }); 
        const employees = await eres.json();
        
        const container = document.getElementById('modalContainer'); 
        if (!container) return;
        
        container.innerHTML = `
            <div id="add-enrollment-overlay" style="position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);">
                <div style="background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 32rem; margin: 0 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                        <h5 style="font-size: 18px; font-weight: 600;">Add Enrollment</h5>
                        <button id="add-enrollment-close" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
                    </div>
                    <form id="addEnrollmentForm" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Employee</label>
                            <select name="employee_id" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required>
                                <option value="">Select Employee</option>
                                ${ (Array.isArray(employees)?employees:[]).map(emp=>`<option value="${emp.EmployeeID}">${emp.FirstName||''} ${emp.LastName||''} (${emp.EmployeeID})</option>`).join('') }
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Plan</label>
                            <select name="plan_id" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required>
                                <option value="">Select Plan</option>
                                ${plans.map(p=>`<option value="${p.PlanID}">${p.PlanName} (${p.ProviderName||''})</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Start Date</label>
                            <input type="date" name="start_date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required/>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">End Date</label>
                            <input type="date" name="end_date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"/>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px;">
                            <button type="button" id="add-enrollment-cancel" style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="padding: 8px 16px; background: #f97316; color: white; border: none; border-radius: 4px; cursor: pointer;">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('add-enrollment-close')?.addEventListener('click', ()=>{ document.getElementById('add-enrollment-overlay')?.remove(); });
        document.getElementById('add-enrollment-cancel')?.addEventListener('click', ()=>{ document.getElementById('add-enrollment-overlay')?.remove(); });
        document.getElementById('addEnrollmentForm')?.addEventListener('submit', async e=>{
            e.preventDefault(); 
            const fd = new FormData(e.target); 
            const payload = {}; 
            fd.forEach((v,k)=>payload[k]=v);
            const res = await fetch(`${REST_API_URL}hmo/hmo.php?resource=enrollment`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); 
            const j = await res.json(); 
            if (j.success) { 
                document.getElementById('add-enrollment-overlay')?.remove(); 
                displayHMOEnrollmentsSection(); 
            } else alert(j.error||'Failed');
        });
    } catch(e) {
        console.error('Error loading add enrollment modal:', e);
        alert('Failed to load enrollment form');
    }
}

export async function showEditEnrollmentModal(id){
    const container = document.getElementById('modalContainer'); 
    if (!container) return;
    try{
        const r = await fetch(`${REST_API_URL}hmo/hmo.php?resource=enrollment?id=${id}`, { credentials:'include' }); 
        const data = await r.json(); 
        const e = data.enrollment||{};
        
        const pres = await fetch(`${REST_API_URL}hmo/hmo.php?resource=plans`, { credentials:'include' }); 
        const pdata = await pres.json(); 
        const plans = pdata.data?.plans || pdata.plans || [];
        const planOptions = plans.map(p=>`<option value="${p.PlanID}" ${p.PlanID==e.PlanID?'selected':''}>${p.PlanName} (${p.ProviderName||''})</option>`).join('');
        
        const eres = await fetch(`${LEGACY_API_URL}get_employees.php`, { credentials:'include' });
        const employees = await eres.json();
        const employeeOptions = (Array.isArray(employees)?employees:[]).map(emp => {
            const name = (emp.FirstName?emp.FirstName:'') + (emp.LastName?(' '+emp.LastName):'');
            return `<option value="${emp.EmployeeID}" ${emp.EmployeeID==e.EmployeeID?'selected':''} >${name} (${emp.EmployeeID})</option>`;
        }).join('');

        container.innerHTML = `
            <div id="edit-enrollment-overlay" style="position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);">
                <div style="background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 32rem; margin: 0 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                        <h5 style="font-size: 18px; font-weight: 600;">Edit Enrollment</h5>
                        <button id="edit-enrollment-close" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
                    </div>
                    <form id="editEnrollmentForm" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <input type="hidden" name="id" value="${id}" />
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Employee</label>
                            <select name="employee_id" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required>
                                <option value="">Select Employee</option>
                                ${employeeOptions}
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Plan</label>
                            <select name="plan_id" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" required>
                                <option value="">Select Plan</option>
                                ${planOptions}
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Start Date</label>
                            <input type="date" name="start_date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" value="${e.StartDate||''}" required/>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">End Date</label>
                            <input type="date" name="end_date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" value="${e.EndDate||''}"/>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; margin-bottom: 4px;">Status</label>
                            <select name="status" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <option value="Active" ${e.Status==='Active'?'selected':''}>Active</option>
                                <option value="Pending" ${e.Status==='Pending'?'selected':''}>Pending</option>
                                <option value="Terminated" ${e.Status==='Terminated'?'selected':''}>Terminated</option>
                            </select>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px;">
                            <button type="button" id="edit-enrollment-cancel" style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="padding: 8px 16px; background: #f97316; color: white; border: none; border-radius: 4px; cursor: pointer;">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('edit-enrollment-close')?.addEventListener('click', ()=>{ document.getElementById('edit-enrollment-overlay')?.remove(); });
        document.getElementById('edit-enrollment-cancel')?.addEventListener('click', ()=>{ document.getElementById('edit-enrollment-overlay')?.remove(); });
        document.getElementById('editEnrollmentForm')?.addEventListener('submit', async e2=>{
            e2.preventDefault(); 
            const fd = new FormData(e2.target); 
            const payload = {}; 
            fd.forEach((v,k)=>payload[k]=v);
            const res2 = await fetch(`${REST_API_URL}hmo/hmo.php?resource=enrollment?id=${id}`, { method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); 
            const j2 = await res2.json(); 
            if (j2.success) { 
                document.getElementById('edit-enrollment-overlay')?.remove(); 
                displayHMOEnrollmentsSection(); 
            } else alert(j2.error||'Failed');
        });
    }catch(e){
        console.error(e); 
        alert('Failed to load enrollment');
    }
}
