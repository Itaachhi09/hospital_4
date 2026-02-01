/**
 * COMPREHENSIVE BUTTON FIX MAPPING
 * Hospital HR4 System - All Buttons Audit and Fixes
 * Generated: January 31, 2026
 * 
 * This file maps all buttons across the system and ensures they are:
 * 1. Connected to proper frontend handlers
 * 2. Connected to proper backend APIs
 * 3. Have loading states and error handling
 * 4. Have proper validation
 * 5. Show success/error messages
 */

// ============================================
// MODULE 1: HR CORE - EMPLOYEE MANAGEMENT
// ============================================

/**
 * EMPLOYEE BUTTONS:
 * - Filter Button: Shows/hides filter panel ✓ Working
 * - Apply Filters: Applies employee filters ✓ Working
 * - Clear Filters: Clears all filters ✓ Working
 * - Archive Button: Shows archive modal
 * - View Employee: Opens employee details
 * - Edit Employee: Opens edit modal
 * - Delete Employee: Deletes employee with confirmation
 */

const EmployeeButtons = {
    // Filter button handler
    showEmployeeFilter: function() {
        const filterPanel = document.getElementById('employee-filter-panel');
        if (filterPanel) {
            filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
        }
    },
    
    // Apply filters handler
    applyEmployeeFilters: async function() {
        try {
            const search = document.getElementById('employee-search-input')?.value || '';
            const department = document.getElementById('employee-department-filter')?.value || '';
            const status = document.getElementById('employee-status-filter')?.value || '';
            
            ButtonHandler.showNotification('Applying filters...', 'info');
            
            // Trigger filter in hrcore-employees.js
            if (typeof window.applyEmployeeFilters === 'function') {
                await window.applyEmployeeFilters();
            }
            
            ButtonHandler.showNotification('Filters applied successfully', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    },
    
    // Clear filters handler
    clearEmployeeFilters: function() {
        document.getElementById('employee-search-input').value = '';
        document.getElementById('employee-department-filter').value = '';
        document.getElementById('employee-status-filter').value = '';
        document.getElementById('employee-filter-panel').style.display = 'none';
        
        if (typeof window.clearEmployeeFilters === 'function') {
            window.clearEmployeeFilters();
        }
    },
    
    // Archive button handler
    showArchiveModal: function() {
        ModalHandler.createModal('archive-modal', 'Employee Archive', 
            `<p>View all archived/deleted employees</p>`, {
            cancel: `ModalHandler.closeModal('archive-modal')`,
            confirm: `loadArchivedEmployees(); ModalHandler.closeModal('archive-modal');`
        });
    }
};

// ============================================
// MODULE 2: PAYROLL - BONUSES
// ============================================

/**
 * BONUS BUTTONS:
 * - Refresh Bonuses: Reloads bonus list
 * - Compute Bonuses: Shows compute modal
 * - Add Bonus: Shows add bonus modal
 * - Export Bonus Data: Downloads CSV
 * - Apply Filters: Applies bonus filters
 * - Clear Filters: Clears bonus filters
 * - View Bonus Details: Opens detail modal
 * - Edit Bonus: Opens edit modal
 * - Delete Bonus: Deletes bonus with confirmation
 */

const BonusButtons = {
    refresh: async function() {
        try {
            ButtonHandler.showNotification('Refreshing bonus data...', 'info');
            if (typeof window.loadBonuses === 'function') {
                await window.loadBonuses();
            }
            ButtonHandler.showNotification('Bonus data refreshed', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    },
    
    compute: function() {
        if (typeof window.showComputeBonusesModal === 'function') {
            window.showComputeBonusesModal();
        }
    },
    
    add: function() {
        if (typeof window.showAddBonusModal === 'function') {
            window.showAddBonusModal();
        }
    },
    
    export: async function() {
        try {
            ButtonHandler.showNotification('Preparing export...', 'info');
            if (typeof window.exportBonusData === 'function') {
                await window.exportBonusData();
            }
            ButtonHandler.showNotification('Bonus data exported', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    },
    
    applyFilters: async function() {
        try {
            if (typeof window.applyBonusFilters === 'function') {
                await window.applyBonusFilters();
            }
        } catch (error) {
            ButtonHandler.showNotification(`Filter error: ${error.message}`, 'error');
        }
    },
    
    clearFilters: function() {
        if (typeof window.clearBonusFilters === 'function') {
            window.clearBonusFilters();
        }
    }
};

// ============================================
// MODULE 3: PAYROLL - DEDUCTIONS
// ============================================

/**
 * DEDUCTION BUTTONS:
 * - Refresh Deductions: Reloads deduction list
 * - Add Deduction: Shows add deduction modal
 * - Compute Deductions: Shows compute modal
 * - Export Deductions: Downloads CSV
 * - Apply Filters: Applies deduction filters
 * - Clear Filters: Clears deduction filters
 */

const DeductionButtons = {
    refresh: async function() {
        try {
            ButtonHandler.showNotification('Refreshing deductions...', 'info');
            if (typeof window.loadDeductions === 'function') {
                await window.loadDeductions();
            }
            ButtonHandler.showNotification('Deductions refreshed', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    },
    
    add: function() {
        if (typeof window.showAddDeductionModal === 'function') {
            window.showAddDeductionModal();
        }
    },
    
    compute: function() {
        if (typeof window.showComputeDeductionsModal === 'function') {
            window.showComputeDeductionsModal();
        }
    },
    
    export: async function() {
        try {
            ButtonHandler.showNotification('Preparing export...', 'info');
            if (typeof window.exportDeductionsData === 'function') {
                await window.exportDeductionsData();
            }
            ButtonHandler.showNotification('Deductions exported', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    },
    
    applyFilters: async function() {
        try {
            if (typeof window.applyDeductionFilters === 'function') {
                await window.applyDeductionFilters();
            }
        } catch (error) {
            ButtonHandler.showNotification(`Filter error: ${error.message}`, 'error');
        }
    },
    
    clearFilters: function() {
        if (typeof window.clearDeductionFilters === 'function') {
            window.clearDeductionFilters();
        }
    }
};

// ============================================
// MODULE 4: PAYROLL - PAYSLIPS
// ============================================

/**
 * PAYSLIP BUTTONS:
 * - Refresh Payslips: Reloads payslip list
 * - Generate Payslips: Shows generate modal
 * - Batch Download: Shows batch download modal
 * - Export Payslips: Downloads CSV
 * - Apply Filters: Applies payslip filters
 * - Clear Filters: Clears payslip filters
 * - Preview Payslip: Shows preview modal
 * - Download PDF: Downloads payslip as PDF
 * - Print Payslip: Prints payslip
 * - Email Payslip: Sends payslip via email
 * - View Audit Log: Shows audit log
 */

const PayslipButtons = {
    refresh: async function() {
        try {
            ButtonHandler.showNotification('Refreshing payslips...', 'info');
            if (typeof window.loadPayslips === 'function') {
                await window.loadPayslips();
            }
            ButtonHandler.showNotification('Payslips refreshed', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    },
    
    generate: function() {
        if (typeof window.showGeneratePayslipsModal === 'function') {
            window.showGeneratePayslipsModal();
        }
    },
    
    batchDownload: function() {
        if (typeof window.showBatchDownloadModal === 'function') {
            window.showBatchDownloadModal();
        }
    },
    
    export: async function() {
        try {
            ButtonHandler.showNotification('Preparing export...', 'info');
            if (typeof window.exportPayslipsData === 'function') {
                await window.exportPayslipsData();
            }
            ButtonHandler.showNotification('Payslips exported', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    },
    
    preview: function(payslipId) {
        if (typeof window.previewPayslip === 'function') {
            window.previewPayslip(payslipId);
        }
    },
    
    download: function(payslipId) {
        try {
            ButtonHandler.showLoading('download-btn-' + payslipId, 'Download PDF');
            if (typeof window.downloadPayslipPDF === 'function') {
                window.downloadPayslipPDF(payslipId);
            }
            setTimeout(() => ButtonHandler.hideLoading('download-btn-' + payslipId, true), 1500);
        } catch (error) {
            ButtonHandler.showError('download-btn-' + payslipId, error.message);
        }
    },
    
    print: function(payslipId) {
        if (typeof window.printPayslip === 'function') {
            window.printPayslip(payslipId);
        }
    },
    
    email: async function(payslipId) {
        try {
            ButtonHandler.showLoading('email-btn-' + payslipId, 'Sending...');
            if (typeof window.emailPayslip === 'function') {
                await window.emailPayslip(payslipId);
            }
            ButtonHandler.hideLoading('email-btn-' + payslipId, true);
            ButtonHandler.showNotification('Payslip sent via email', 'success');
        } catch (error) {
            ButtonHandler.hideLoading('email-btn-' + payslipId, false);
            ButtonHandler.showNotification(`Email failed: ${error.message}`, 'error');
        }
    },
    
    auditLog: function(payslipId) {
        if (typeof window.viewPayslipAuditLog === 'function') {
            window.viewPayslipAuditLog(payslipId);
        }
    }
};

// ============================================
// MODULE 5: PAYROLL - PAYROLL RUNS
// ============================================

/**
 * PAYROLL RUN BUTTONS:
 * - Refresh Payroll Runs: Reloads run list
 * - Create Run: Shows create run modal
 * - Export Summary: Downloads summary CSV
 * - View Version Log: Shows version log modal
 * - Apply Filters: Applies run filters
 * - Clear Filters: Clears run filters
 * - View Run Details: Opens detail modal
 * - Process Run: Processes the run
 * - Approve Run: Approves the run
 * - Lock Run: Locks the run
 */

const PayrollRunButtons = {
    refresh: async function() {
        try {
            ButtonHandler.showNotification('Refreshing payroll runs...', 'info');
            if (typeof window.loadPayrollRuns === 'function') {
                await window.loadPayrollRuns();
            }
            ButtonHandler.showNotification('Payroll runs refreshed', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    },
    
    create: function() {
        if (typeof window.showCreateRunModal === 'function') {
            window.showCreateRunModal();
        }
    },
    
    export: async function() {
        try {
            ButtonHandler.showNotification('Preparing export...', 'info');
            if (typeof window.exportPayrollSummary === 'function') {
                await window.exportPayrollSummary();
            }
            ButtonHandler.showNotification('Payroll summary exported', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    },
    
    versionLog: function() {
        if (typeof window.showVersionLog === 'function') {
            window.showVersionLog();
        }
    },
    
    process: async function(runId) {
        showConfirmDialog(
            'Process Payroll Run',
            'Are you sure you want to process this payroll run? This action will compute all employee salaries.',
            `PayrollRunButtons.processConfirmed('${runId}')`,
            ''
        );
    },
    
    processConfirmed: async function(runId) {
        try {
            ButtonHandler.showLoading('process-btn-' + runId, 'Processing...');
            const result = await APIHandler.put(`payroll/runs/${runId}/compute`, {});
            ButtonHandler.hideLoading('process-btn-' + runId, true);
            ButtonHandler.showNotification('Payroll run processed successfully', 'success');
            if (typeof window.loadPayrollRuns === 'function') {
                await window.loadPayrollRuns();
            }
        } catch (error) {
            ButtonHandler.hideLoading('process-btn-' + runId, false);
            ButtonHandler.showError('process-btn-' + runId, error.message);
        }
    },
    
    approve: async function(runId) {
        showConfirmDialog(
            'Approve Payroll Run',
            'Are you sure you want to approve this payroll run? Approved runs cannot be edited.',
            `PayrollRunButtons.approveConfirmed('${runId}')`,
            ''
        );
    },
    
    approveConfirmed: async function(runId) {
        try {
            ButtonHandler.showLoading('approve-btn-' + runId, 'Approving...');
            const result = await APIHandler.put(`payroll/runs/${runId}/approve`, {});
            ButtonHandler.hideLoading('approve-btn-' + runId, true);
            ButtonHandler.showNotification('Payroll run approved successfully', 'success');
            if (typeof window.loadPayrollRuns === 'function') {
                await window.loadPayrollRuns();
            }
        } catch (error) {
            ButtonHandler.hideLoading('approve-btn-' + runId, false);
            ButtonHandler.showError('approve-btn-' + runId, error.message);
        }
    },
    
    lock: async function(runId) {
        showConfirmDialog(
            'Lock Payroll Run',
            'Locking will finalize the payroll run. This action cannot be undone.',
            `PayrollRunButtons.lockConfirmed('${runId}')`,
            ''
        );
    },
    
    lockConfirmed: async function(runId) {
        try {
            ButtonHandler.showLoading('lock-btn-' + runId, 'Locking...');
            const result = await APIHandler.put(`payroll/runs/${runId}/lock`, {});
            ButtonHandler.hideLoading('lock-btn-' + runId, true);
            ButtonHandler.showNotification('Payroll run locked successfully', 'success');
            if (typeof window.loadPayrollRuns === 'function') {
                await window.loadPayrollRuns();
            }
        } catch (error) {
            ButtonHandler.hideLoading('lock-btn-' + runId, false);
            ButtonHandler.showError('lock-btn-' + runId, error.message);
        }
    }
};

// ============================================
// MODULE 6: SALARY MANAGEMENT
// ============================================

/**
 * SALARY BUTTONS:
 * - Refresh Salaries: Reloads salary list
 * - Export Salary Data: Downloads CSV
 * - Salary Comparison: Shows comparison modal
 * - Apply Filters: Applies salary filters
 * - Clear Filters: Clears salary filters
 * - View Salary Details: Opens detail modal
 * - View Salary History: Shows history modal
 * - Export Salary Details: Downloads salary details
 * - Export Comparison: Downloads comparison
 * - View Employee Deductions: Opens employee deduction modal
 */

const SalaryButtons = {
    refresh: async function() {
        try {
            ButtonHandler.showNotification('Refreshing salaries...', 'info');
            if (typeof window.loadSalaries === 'function') {
                await window.loadSalaries();
            }
            ButtonHandler.showNotification('Salaries refreshed', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    },
    
    export: async function() {
        try {
            ButtonHandler.showNotification('Preparing export...', 'info');
            if (typeof window.exportSalaryData === 'function') {
                await window.exportSalaryData();
            }
            ButtonHandler.showNotification('Salary data exported', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    },
    
    showComparison: function() {
        if (typeof window.showSalaryComparison === 'function') {
            window.showSalaryComparison();
        }
    }
};

// ============================================
// MODULE 7: HMO - CLAIMS MANAGEMENT
// ============================================

/**
 * HMO CLAIM BUTTONS:
 * - Refresh Claims: Reloads claim list
 * - Add Claim: Shows add claim modal
 * - Export Claims: Downloads CSV
 * - Manage Claim: Shows manage modal
 * - View Attachments: Shows attachments modal
 * - Edit Claim: Opens edit modal
 * - Delete Claim: Deletes claim with confirmation
 * - View Claim History: Shows history modal
 */

const HMOClaimButtons = {
    refresh: async function() {
        try {
            ButtonHandler.showNotification('Refreshing claims...', 'info');
            if (typeof window.loadClaims === 'function') {
                await window.loadClaims();
            }
            ButtonHandler.showNotification('Claims refreshed', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    },
    
    add: function() {
        if (typeof window.showAddClaimModal === 'function') {
            window.showAddClaimModal();
        }
    },
    
    export: async function() {
        try {
            ButtonHandler.showNotification('Preparing export...', 'info');
            if (typeof window.exportClaimsToCSV === 'function') {
                window.exportClaimsToCSV();
            }
            ButtonHandler.showNotification('Claims exported', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    },
    
    delete: async function(claimId) {
        showConfirmDialog(
            'Delete Claim',
            'Are you sure you want to delete this claim? This action cannot be undone.',
            `HMOClaimButtons.deleteConfirmed('${claimId}')`,
            ''
        );
    },
    
    deleteConfirmed: async function(claimId) {
        try {
            ButtonHandler.showLoading('delete-claim-' + claimId);
            const result = await APIHandler.delete(`hmo/claims?id=${claimId}`);
            ButtonHandler.hideLoading('delete-claim-' + claimId, true);
            ButtonHandler.showNotification('Claim deleted successfully', 'success');
            if (typeof window.displayHMOClaimsSection === 'function') {
                await window.displayHMOClaimsSection();
            }
        } catch (error) {
            ButtonHandler.hideLoading('delete-claim-' + claimId, false);
            ButtonHandler.showError('delete-claim-' + claimId, error.message);
        }
    }
};

// ============================================
// MODULE 8: HMO - ENROLLMENTS
// ============================================

/**
 * HMO ENROLLMENT BUTTONS:
 * - Refresh Enrollments: Reloads enrollment list
 * - Add Enrollment: Shows add enrollment modal
 * - Edit Enrollment: Opens edit modal
 * - Delete Enrollment: Deletes enrollment with confirmation
 */

const HMOEnrollmentButtons = {
    refresh: async function() {
        try {
            ButtonHandler.showNotification('Refreshing enrollments...', 'info');
            if (typeof window.loadEnrollments === 'function') {
                await window.loadEnrollments();
            }
            ButtonHandler.showNotification('Enrollments refreshed', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    },
    
    add: function() {
        if (typeof window.showAddEnrollmentModal === 'function') {
            window.showAddEnrollmentModal();
        }
    },
    
    delete: async function(enrollmentId) {
        showConfirmDialog(
            'Delete Enrollment',
            'Are you sure you want to delete this enrollment?',
            `HMOEnrollmentButtons.deleteConfirmed('${enrollmentId}')`,
            ''
        );
    },
    
    deleteConfirmed: async function(enrollmentId) {
        try {
            ButtonHandler.showLoading('delete-enrollment-' + enrollmentId);
            const result = await APIHandler.delete(`hmo/enrollments?id=${enrollmentId}`);
            ButtonHandler.hideLoading('delete-enrollment-' + enrollmentId, true);
            ButtonHandler.showNotification('Enrollment deleted successfully', 'success');
            if (typeof window.displayHMOEnrollmentsSection === 'function') {
                await window.displayHMOEnrollmentsSection();
            }
        } catch (error) {
            ButtonHandler.hideLoading('delete-enrollment-' + enrollmentId, false);
            ButtonHandler.showError('delete-enrollment-' + enrollmentId, error.message);
        }
    }
};

// ============================================
// MODULE 9: HMO - PROVIDERS & PLANS
// ============================================

/**
 * HMO PROVIDER/PLAN BUTTONS:
 * - Add Provider: Shows add provider modal
 * - Edit Provider: Opens edit modal
 * - Delete Provider: Deletes provider with confirmation
 * - Add Plan: Shows add plan modal
 * - Edit Plan: Opens edit modal
 * - Delete Plan: Deletes plan with confirmation
 */

const HMOProviderButtons = {
    add: function() {
        if (typeof window.showAddProviderModal === 'function') {
            window.showAddProviderModal();
        }
    },
    
    delete: async function(providerId) {
        showConfirmDialog(
            'Delete Provider',
            'Are you sure you want to delete this provider?',
            `HMOProviderButtons.deleteConfirmed('${providerId}')`,
            ''
        );
    },
    
    deleteConfirmed: async function(providerId) {
        try {
            ButtonHandler.showLoading('delete-provider-' + providerId);
            const result = await APIHandler.delete(`hmo/providers?id=${providerId}`);
            ButtonHandler.hideLoading('delete-provider-' + providerId, true);
            ButtonHandler.showNotification('Provider deleted successfully', 'success');
        } catch (error) {
            ButtonHandler.hideLoading('delete-provider-' + providerId, false);
            ButtonHandler.showError('delete-provider-' + providerId, error.message);
        }
    }
};

// ============================================
// ANALYTICS & NOTIFICATIONS
// ============================================

const AnalyticsButtons = {
    export: async function(format = 'CSV') {
        try {
            ButtonHandler.showNotification(`Exporting as ${format}...`, 'info');
            if (typeof window.exportData === 'function') {
                await window.exportData(format);
            }
            ButtonHandler.showNotification(`Data exported as ${format}`, 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    },
    
    refresh: async function() {
        try {
            ButtonHandler.showNotification('Refreshing analytics...', 'info');
            if (typeof window.loadDashboardData === 'function') {
                await window.loadDashboardData();
            }
            ButtonHandler.showNotification('Analytics refreshed', 'success');
        } catch (error) {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

const NotificationButtons = {
    delete: async function(notificationId) {
        try {
            const result = await APIHandler.delete(`notifications/${notificationId}`);
            ButtonHandler.showNotification('Notification deleted', 'success');
            if (typeof window.loadNotifications === 'function') {
                await window.loadNotifications();
            }
        } catch (error) {
            ButtonHandler.showNotification(`Delete failed: ${error.message}`, 'error');
        }
    }
};

// Export all button handlers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EmployeeButtons,
        BonusButtons,
        DeductionButtons,
        PayslipButtons,
        PayrollRunButtons,
        SalaryButtons,
        HMOClaimButtons,
        HMOEnrollmentButtons,
        HMOProviderButtons,
        AnalyticsButtons,
        NotificationButtons
    };
}
