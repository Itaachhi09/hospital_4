import { REST_API_URL } from '../../utils.js';

// Get LEGACY_API_URL from window or utils
const LEGACY_API_URL = '/hospital_4/api/Employees/';

// Enhanced employee-facing HMO view with detailed plan information
export async function displayEmployeeHMOSection() {
    const container = document.getElementById('employeeHmoContainer');
    if (!container) return;
    
    container.innerHTML = `<div style="padding: 16px; color: #6b7280;">Loading your HMO information...</div>`;
    
    try{
        const res = await fetch(`${REST_API_URL}hmo/hmo.php?resource=enrollment`, { credentials: 'include' });
        const data = await res.json();
        const enrollments = (data.data && Array.isArray(data.data)) ? data.data : (data.enrollments || []);
        
        if (!enrollments.length){
            container.innerHTML = `<div style="padding: 24px; text-align: center; color: #6b7280;">You have no HMO enrollments. Contact HR or check back later.</div>`;
            return;
        }
        
        const rows = await Promise.all(enrollments.map(async e=>{
            const plan = e.PlanName || '';
            const provider = e.ProviderName || '';
            const status = e.Status || '';
            const start = e.StartDate || e.EnrollmentDate || '';
            const end = e.EndDate || '';
            
            // Fetch detailed plan info
            let planDetails = {};
            try {
                const planRes = await fetch(`${REST_API_URL}HMO/plans.php?id=${e.PlanID}`, { credentials: 'include' });
                const planData = await planRes.json();
                planDetails = (planData.data && planData.data.plan) || planData.plan || {};
            } catch (err) {
                console.error('Failed to fetch plan details', err);
            }
            
            const coverage = Array.isArray(planDetails.Coverage) ? planDetails.Coverage : (planDetails.Coverage ? JSON.parse(planDetails.Coverage) : []);
            const accreditedHospitals = Array.isArray(planDetails.AccreditedHospitals) ? planDetails.AccreditedHospitals : (planDetails.AccreditedHospitals ? JSON.parse(planDetails.AccreditedHospitals) : []);
            const eligibility = planDetails.Eligibility || 'Individual';
            const maxLimit = planDetails.MaximumBenefitLimit || 'N/A';
            const premium = planDetails.PremiumCost || 'N/A';
            
            const badgeStyle = status === 'Active' ? 'background: #16a34a; color: white;' : 'background: #9ca3af; color: white;';
            
            return `<div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; margin-bottom: 12px;">
                <div style="padding: 16px;">
                    <h5 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${provider} — ${plan} <span style="display: inline-block; padding: 4px 8px; font-size: 12px; font-weight: 600; border-radius: 4px; ${badgeStyle}">${status}</span></h5>
                    <p style="margin-bottom: 4px;"><strong>Effective:</strong> ${start}${end?(' — '+end):''}</p>
                    <p style="margin-bottom: 4px;"><strong>Eligibility:</strong> ${eligibility}</p>
                    <p style="margin-bottom: 4px;"><strong>Coverage:</strong> ${coverage.join(', ') || 'N/A'}</p>
                    <p style="margin-bottom: 4px;"><strong>Maximum Benefit Limit:</strong> ${maxLimit !== 'N/A' ? '₱' + parseFloat(maxLimit).toLocaleString() : 'N/A'}</p>
                    <p style="margin-bottom: 4px;"><strong>Premium Cost:</strong> ${premium !== 'N/A' ? '₱' + parseFloat(premium).toLocaleString() + ' per month' : 'N/A'}</p>
                    <div style="margin-top: 12px;">
                        <strong>Accredited Hospitals & Clinics:</strong>
                        <ul style="margin-bottom: 0; margin-top: 4px; padding-left: 20px;">
                            ${accreditedHospitals.slice(0,10).map(h=>`<li style="color: #374151;">${h}</li>`).join('')}
                            ${accreditedHospitals.length > 10 ? '<li style="color: #374151; font-style: italic;">...and ' + (accreditedHospitals.length - 10) + ' more</li>' : ''}
                        </ul>
                    </div>
                </div>
            </div>`;
        }));
        
        container.innerHTML = `
            <div style="padding: 16px;">
                <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Your HMO Benefits</h3>
                <p style="color: #6b7280; margin-bottom: 16px;">View your current HMO provider, plan details, and accredited facilities.</p>
                ${rows.join('')}
            </div>
        `;
    }catch(e){
        console.error('Failed to load enrollments', e);
        container.innerHTML = `<div style="padding: 16px; color: #dc2626;">Unable to load HMO enrollments. Try again later.</div>`;
    }
}

export function showEmployeeHMOPlaceholder(){
    // small helper for inline fallback calls
    displayEmployeeHMOSection();
}
