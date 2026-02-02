/**
 * GLOBAL ONCLICK HANDLERS
 * Centralized button click handlers for all modules
 * This file wraps all onclick attributes to use standardized button handlers
 */

// ============================================
// EMPLOYEE MANAGEMENT HANDLERS
// ============================================

window.showEmployeeFilter = function() {
    const filterPanel = document.getElementById('employee-filter-panel');
    if (filterPanel) {
        filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
    }
};

window.applyEmployeeFilters = async function() {
    try {
        const search = document.getElementById('employee-search-input')?.value || '';
        const department = document.getElementById('employee-department-filter')?.value || '';
        const status = document.getElementById('employee-status-filter')?.value || '';
        
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Applying filters...', 'info');
        }
        
        // The actual filtering happens in hrcore-employees.js
        // This just triggers the UI update
        if (window._applyEmployeeFilters) {
            await window._applyEmployeeFilters(search, department, status);
        }
        
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Filters applied', 'success');
        }
    } catch (error) {
        console.error('Filter error:', error);
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

window.clearEmployeeFilters = function() {
    const searchInput = document.getElementById('employee-search-input');
    const deptFilter = document.getElementById('employee-department-filter');
    const statusFilter = document.getElementById('employee-status-filter');
    
    if (searchInput) searchInput.value = '';
    if (deptFilter) deptFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    
    const filterPanel = document.getElementById('employee-filter-panel');
    if (filterPanel) filterPanel.style.display = 'none';
    
    if (typeof ButtonHandler !== 'undefined') {
        ButtonHandler.showNotification('Filters cleared', 'info');
    }
};

window.showArchiveModal = function() {
    if (typeof ModalHandler !== 'undefined') {
        ModalHandler.createModal('archive-modal', 'Employee Archive', 
            `<p>View all archived and deleted employees</p>`, {
            cancel: `ModalHandler.closeModal('archive-modal')`,
            confirm: `loadArchivedEmployees(); ModalHandler.closeModal('archive-modal');`
        });
    }
};

window.loadArchivedEmployees = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Loading archived employees...', 'info');
        }
        
        // Call the actual load function
        if (window._loadArchivedEmployees) {
            await window._loadArchivedEmployees();
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

window.viewEmployee = async function(employeeId) {
    try {
        console.log('Viewing employee:', employeeId);
        // Implementation in hrcore-employees.js
        if (window._viewEmployee) {
            await window._viewEmployee(employeeId);
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

window.deleteEmployee = async function(employeeId) {
    if (confirm('Are you sure you want to delete this employee?')) {
        try {
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification('Deleting employee...', 'info');
            }
            
            if (window._deleteEmployee) {
                await window._deleteEmployee(employeeId);
            }
            
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification('Employee deleted successfully', 'success');
            }
        } catch (error) {
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification(`Delete failed: ${error.message}`, 'error');
            }
        }
    }
};

// ============================================
// BONUS HANDLERS
// ============================================

window.refreshBonuses = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Refreshing bonuses...', 'info');
        }
        if (window._loadBonuses) await window._loadBonuses();
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Bonuses refreshed', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

window.showComputeBonusesModal = function() {
    // Implementation should be in payroll.js
    if (window._showComputeBonusesModal) {
        window._showComputeBonusesModal();
    }
};

window.closeComputeBonusesModal = function() {
    const modal = document.getElementById('compute-bonuses-modal');
    if (modal) modal.remove();
};

window.showAddBonusModal = function() {
    if (window._showAddBonusModal) {
        window._showAddBonusModal();
    }
};

window.closeAddBonusModal = function() {
    const modal = document.getElementById('add-bonus-modal');
    if (modal) modal.remove();
};

window.exportBonusData = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Exporting bonuses...', 'info');
        }
        if (window._exportBonusData) {
            await window._exportBonusData();
        }
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Bonuses exported successfully', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
};

window.applyBonusFilters = function() {
    if (window._applyBonusFilters) {
        window._applyBonusFilters();
    }
};

window.clearBonusFilters = function() {
    if (window._clearBonusFilters) {
        window._clearBonusFilters();
    }
};

// ============================================
// DEDUCTION HANDLERS
// ============================================

window.refreshDeductions = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Refreshing deductions...', 'info');
        }
        if (window._loadDeductions) await window._loadDeductions();
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Deductions refreshed', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

window.showAddDeductionModal = function() {
    if (window._showAddDeductionModal) {
        window._showAddDeductionModal();
    }
};

window.closeAddDeductionModal = function() {
    const modal = document.getElementById('add-deduction-modal');
    if (modal) modal.remove();
};

window.showComputeDeductionsModal = function() {
    if (window._showComputeDeductionsModal) {
        window._showComputeDeductionsModal();
    }
};

window.closeComputeDeductionsModal = function() {
    const modal = document.getElementById('compute-deductions-modal');
    if (modal) modal.remove();
};

window.exportDeductionsData = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Exporting deductions...', 'info');
        }
        if (window._exportDeductionsData) {
            await window._exportDeductionsData();
        }
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Deductions exported successfully', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
};

window.applyDeductionFilters = function() {
    if (window._applyDeductionFilters) {
        window._applyDeductionFilters();
    }
};

window.clearDeductionFilters = function() {
    if (window._clearDeductionFilters) {
        window._clearDeductionFilters();
    }
};

// ============================================
// PAYSLIP HANDLERS
// ============================================

window.refreshPayslips = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Refreshing payslips...', 'info');
        }
        if (window._loadPayslips) await window._loadPayslips();
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Payslips refreshed', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

window.showGeneratePayslipsModal = function() {
    if (window._showGeneratePayslipsModal) {
        window._showGeneratePayslipsModal();
    }
};

window.closeGeneratePayslipsModal = function() {
    const modal = document.getElementById('generate-payslips-modal');
    if (modal) modal.remove();
};

window.showBatchDownloadModal = function() {
    if (window._showBatchDownloadModal) {
        window._showBatchDownloadModal();
    }
};

window.closeBatchDownloadModal = function() {
    const modal = document.getElementById('batch-download-modal');
    if (modal) modal.remove();
};

window.exportPayslipsData = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Exporting payslips...', 'info');
        }
        if (window._exportPayslipsData) {
            await window._exportPayslipsData();
        }
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Payslips exported successfully', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
};

window.previewPayslip = function(payslipId) {
    if (window._previewPayslip) {
        window._previewPayslip(payslipId);
    }
};

window.downloadPayslipPDF = async function(payslipId) {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Downloading payslip...', 'info');
        }
        if (window._downloadPayslipPDF) {
            await window._downloadPayslipPDF(payslipId);
        }
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Payslip downloaded successfully', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Download failed: ${error.message}`, 'error');
        }
    }
};

window.printPayslip = function(payslipId) {
    if (window._printPayslip) {
        window._printPayslip(payslipId);
    }
};

window.emailPayslip = async function(payslipId) {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Sending payslip email...', 'info');
        }
        if (window._emailPayslip) {
            await window._emailPayslip(payslipId);
        }
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Payslip sent via email', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Email failed: ${error.message}`, 'error');
        }
    }
};

window.viewPayslipAuditLog = function(payslipId) {
    if (window._viewPayslipAuditLog) {
        window._viewPayslipAuditLog(payslipId);
    }
};

// ============================================
// PAYROLL RUN HANDLERS
// ============================================

window.refreshPayrollRuns = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Refreshing payroll runs...', 'info');
        }
        if (window._loadPayrollRuns) await window._loadPayrollRuns();
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Payroll runs refreshed', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

window.showCreateRunModal = function() {
    if (window._showCreateRunModal) {
        window._showCreateRunModal();
    }
};

window.closeCreateRunModal = function() {
    const modal = document.getElementById('create-run-modal');
    if (modal) modal.remove();
};

window.exportPayrollSummary = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Exporting payroll summary...', 'info');
        }
        if (window._exportPayrollSummary) {
            await window._exportPayrollSummary();
        }
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Payroll summary exported', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
};

window.showVersionLog = function() {
    if (window._showVersionLog) {
        window._showVersionLog();
    }
};

window.viewRunDetails = function(runId) {
    if (window._viewRunDetails) {
        window._viewRunDetails(runId);
    }
};

window.processRun = async function(runId) {
    if (confirm('Process this payroll run? Salaries will be computed.')) {
        try {
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification('Processing payroll run...', 'info');
            }
            if (window._processRun) {
                await window._processRun(runId);
            }
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification('Payroll run processed successfully', 'success');
            }
        } catch (error) {
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
            }
        }
    }
};

window.approveRun = async function(runId) {
    if (confirm('Approve this payroll run? Approved runs cannot be edited.')) {
        try {
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification('Approving payroll run...', 'info');
            }
            if (window._approveRun) {
                await window._approveRun(runId);
            }
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification('Payroll run approved successfully', 'success');
            }
        } catch (error) {
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
            }
        }
    }
};

window.lockRun = async function(runId) {
    if (confirm('Lock this payroll run? This action cannot be undone.')) {
        try {
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification('Locking payroll run...', 'info');
            }
            if (window._lockRun) {
                await window._lockRun(runId);
            }
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification('Payroll run locked successfully', 'success');
            }
        } catch (error) {
            if (typeof ButtonHandler !== 'undefined') {
                ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
            }
        }
    }
};

// ============================================
// SALARY HANDLERS
// ============================================

window.refreshSalaries = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Refreshing salaries...', 'info');
        }
        if (window._loadSalaries) await window._loadSalaries();
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Salaries refreshed', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

window.exportSalaryData = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Exporting salary data...', 'info');
        }
        if (window._exportSalaryData) {
            await window._exportSalaryData();
        }
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Salary data exported', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
};

window.showSalaryComparison = function() {
    if (window._showSalaryComparison) {
        window._showSalaryComparison();
    }
};

window.closeSalaryComparisonModal = function() {
    const modal = document.getElementById('salary-comparison-modal');
    if (modal) modal.remove();
};

window.applySalaryFilters = function() {
    if (window._applySalaryFilters) {
        window._applySalaryFilters();
    }
};

window.clearSalaryFilters = function() {
    if (window._clearSalaryFilters) {
        window._clearSalaryFilters();
    }
};

window.viewSalaryDetails = function(employeeId) {
    if (window._viewSalaryDetails) {
        window._viewSalaryDetails(employeeId);
    }
};

window.closeSalaryDetailsModal = function() {
    const modal = document.getElementById('salary-details-modal');
    if (modal) modal.remove();
};

window.exportSalaryDetails = function() {
    if (window._exportSalaryDetails) {
        window._exportSalaryDetails();
    }
};

window.viewSalaryHistory = function() {
    if (window._viewSalaryHistory) {
        window._viewSalaryHistory();
    }
};

window.updateComparison = function() {
    if (window._updateComparison) {
        window._updateComparison();
    }
};

window.exportComparison = function() {
    if (window._exportComparison) {
        window._exportComparison();
    }
};

window.viewEmployeeDeductions = function(employeeId) {
    if (window._viewEmployeeDeductions) {
        window._viewEmployeeDeductions(employeeId);
    }
};

// ============================================
// HMO CLAIMS HANDLERS
// ============================================

window.refreshClaims = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Refreshing claims...', 'info');
        }
        if (window._loadClaims) await window._loadClaims();
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Claims refreshed', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

window.displayHMOClaimsSection = async function() {
    if (window._displayHMOClaimsSection) {
        await window._displayHMOClaimsSection();
    }
};

window.showAddClaimModal = function() {
    if (window._showAddClaimModal) {
        window._showAddClaimModal();
    }
};

window.exportClaimsToCSV = function() {
    if (window._exportClaimsToCSV) {
        window._exportClaimsToCSV();
    }
};

window.showManageModal = function(claimIds = []) {
    if (window._showManageModal) {
        window._showManageModal(claimIds);
    }
};

window.showClaimHistoryModal = function(employeeId) {
    if (window._showClaimHistoryModal) {
        window._showClaimHistoryModal(employeeId);
    }
};

// ============================================
// HMO ENROLLMENTS HANDLERS
// ============================================

window.displayHMOEnrollmentsSection = async function() {
    if (window._displayHMOEnrollmentsSection) {
        await window._displayHMOEnrollmentsSection();
    }
};

window.showAddEnrollmentModal = function() {
    if (window._showAddEnrollmentModal) {
        window._showAddEnrollmentModal();
    }
};

// ============================================
// HMO PROVIDERS HANDLERS
// ============================================

window.showAddProviderModal = function() {
    if (window._showAddProviderModal) {
        window._showAddProviderModal();
    }
};

// ============================================
// HRCORE DOCUMENTS HANDLERS
// ============================================

window.refreshHRCoreDocuments = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Refreshing documents...', 'info');
        }
        if (window._loadHRCoreDocuments) await window._loadHRCoreDocuments();
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Documents refreshed', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

window.exportHRCoreDocuments = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Exporting documents...', 'info');
        }
        if (window._exportHRCoreDocuments) {
            await window._exportHRCoreDocuments();
        }
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Documents exported', 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
};

window.showIntegrationStatus = function() {
    if (window._showIntegrationStatus) {
        window._showIntegrationStatus();
    }
};

// ============================================
// ANALYTICS HANDLERS
// ============================================

window.exportData = async function(format = 'CSV') {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Exporting as ${format}...`, 'info');
        }
        if (window._exportAnalyticsData) {
            await window._exportAnalyticsData(format);
        }
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Data exported as ${format}`, 'success');
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
};

window.loadDashboardData = async function() {
    try {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification('Loading dashboard...', 'info');
        }
        if (window._loadDashboardData) {
            await window._loadDashboardData();
        }
    } catch (error) {
        if (typeof ButtonHandler !== 'undefined') {
            ButtonHandler.showNotification(`Error: ${error.message}`, 'error');
        }
    }
};

// ============================================
// NAVIGATION HANDLERS
// ============================================

window.navigateToSection = function(section) {
    const event = new CustomEvent('navigate', { detail: { section } });
    document.dispatchEvent(event);
};

window.navigateToDashboard = function() {
    window.navigateToSection('dashboard');
};

window.navigateToProfile = function() {
    window.navigateToSection('profile');
};

window.logout = function() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/hospital_4/index.php';
    }
};

console.log('[OnClickHandlers] All global onclick handlers loaded');
