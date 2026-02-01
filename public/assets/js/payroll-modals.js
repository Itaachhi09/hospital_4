/**
 * Shared Modal Utilities for Payroll Modules
 * Provides consistent modal patterns, confirmation dialogs, and UX components
 */

const API_BASE_URL = '/hospital_4/api';

// Global state for modals
let currentModalState = {
    activeModal: null,
    currentPage: 1,
    itemsPerPage: 25,
    totalItems: 0,
    currentData: null
};

/**
 * Enhanced Confirmation Modal with customizable styling
 */
export function showEnhancedConfirmationModal(title, message, description, buttonText, buttonColor, onConfirm) {
    // Create enhanced confirmation modal if it doesn't exist
    let modal = document.getElementById('enhanced-confirmation-modal');
    if (!modal) {
        modal = createEnhancedConfirmationModal();
    }
    
    // Update content
    document.getElementById('enhanced-confirmation-title').textContent = title;
    document.getElementById('enhanced-confirmation-message').textContent = message;
    document.getElementById('enhanced-confirmation-description').textContent = description;
    
    const confirmBtn = document.getElementById('enhanced-confirmation-confirm');
    confirmBtn.textContent = buttonText;
    
    // Update button color (inline styles)
    const colorStyles = {
        'blue': 'background: #2563eb; color: white;',
        'green': 'background: #16a34a; color: white;',
        'red': 'background: #dc2626; color: white;',
        'yellow': 'background: #d97706; color: white;',
        'purple': 'background: #7c3aed; color: white;',
        'indigo': 'background: #4f46e5; color: white;'
    };
    
    confirmBtn.style.cssText = `${colorStyles[buttonColor] || colorStyles.blue} padding: 10px 16px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;`;
    
    // Remove existing event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new event listener
    newConfirmBtn.addEventListener('click', () => {
        closeEnhancedConfirmationModal();
        onConfirm();
    });
    
    modal.style.display = 'flex';
}

function createEnhancedConfirmationModal() {
    const modal = document.createElement('div');
    modal.id = 'enhanced-confirmation-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 60; display: none; justify-content: center; align-items: center; background: rgba(0,0,0,0.5); padding: 15px; overflow-y: auto;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 500px; margin-top: 20px;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; gap: 12px;">
                    <div style="flex-shrink: 0;">
                        <div style="display: flex; align-items: center; justify-content: center; height: 40px; width: 40px; border-radius: 50%; background: #fef3c7;">
                            <span style="font-size: 20px;">⚠️</span>
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0;" id="enhanced-confirmation-title">Confirm Action</h3>
                        <p style="font-size: 14px; color: #6b7280; margin: 8px 0 0 0;" id="enhanced-confirmation-message">Are you sure you want to perform this action?</p>
                        <p style="font-size: 12px; color: #9ca3af; margin-top: 4px;" id="enhanced-confirmation-description">This action may take some time to complete.</p>
                    </div>
                </div>
            </div>
            <div style="padding: 15px 20px; background: #f9fafb; display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" onclick="closeEnhancedConfirmationModal()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                    Cancel
                </button>
                <button type="button" id="enhanced-confirmation-confirm" style="padding: 10px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                    Confirm
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

export function closeEnhancedConfirmationModal() {
    const modal = document.getElementById('enhanced-confirmation-modal');
    if (modal) modal.style.display = 'none';
}

/**
 * Inline Alert System
 */
export function showInlineAlert(message, type = 'info') {
    // Create alert container if it doesn't exist
    let alertContainer = document.getElementById('inline-alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'inline-alert-container';
        alertContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 50; display: flex; flex-direction: column; gap: 8px;';
        document.body.appendChild(alertContainer);
    }
    
    const alertId = 'alert-' + Date.now();
    const typeColors = {
        'success': { bg: '#dcfce7', border: '#86efac', text: '#166534', icon: '✓' },
        'error': { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', icon: '✕' },
        'warning': { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', icon: '⚠' },
        'info': { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', icon: 'ℹ' }
    };
    
    const colors = typeColors[type] || typeColors.info;
    
    const alert = document.createElement('div');
    alert.id = alertId;
    alert.style.cssText = `background: ${colors.bg}; border-left: 4px solid ${colors.border}; border-radius: 6px; padding: 12px 15px; max-width: 400px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); animation: slideIn 0.3s ease-in-out;`;
    
    alert.innerHTML = `
        <span style="font-size: 16px; flex-shrink: 0;">${colors.icon}</span>
        <span style="font-size: 13px; color: ${colors.text}; flex: 1;">${message}</span>
        <button onclick="closeInlineAlert('${alertId}')" style="background: none; border: none; color: ${colors.text}; cursor: pointer; font-size: 16px; padding: 0; flex-shrink: 0;">✕</button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        closeInlineAlert(alertId);
    }, 5000);
}

export function closeInlineAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.style.animation = 'slideOut 0.3s ease-in-out forwards';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }
}

/**
 * Enhanced Details Modal with pagination support
 */
export function createEnhancedDetailsModal(modalId, title, content, maxWidth = '900px') {
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = `position: fixed; inset: 0; z-index: 50; display: none; justify-content: center; align-items: flex-start; background: rgba(0,0,0,0.5); padding: 15px; overflow-y: auto;`;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: ${maxWidth}; margin-top: 20px;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;" id="modal-title">${title}</h3>
                <button type="button" onclick="closeModal('${modalId}')" style="background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer; padding: 0;">✕</button>
            </div>
            <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
                ${content}
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById(modalId);
    if (existingModal) existingModal.remove();
    
    document.body.appendChild(modal);
    return modal;
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

/**
 * Pagination Component
 */
export function renderPagination(containerId, pagination, onPageChange, itemsPerPage = 25) {
    const paginationEl = document.getElementById(containerId);
    if (!paginationEl) return;
    
    const totalPages = pagination.total_pages || 1;
    const currentPage = pagination.current_page || 1;
    const hasNext = pagination.has_next || false;
    const hasPrev = pagination.has_prev || false;
    
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <div style="flex: 1; display: flex; justify-content: space-between; gap: 10px;">
                <button onclick="changePage(${currentPage - 1})" 
                        ${!hasPrev ? 'disabled' : ''} 
                        style="padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; font-size: 14px; cursor: pointer; transition: all 0.2s; ${!hasPrev ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                    ← Previous
                </button>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <span style="font-size: 13px; color: #9ca3af;">
                        Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong>
                    </span>
                </div>
                <button onclick="changePage(${currentPage + 1})" 
                        ${!hasNext ? 'disabled' : ''} 
                        style="padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; font-size: 14px; cursor: pointer; transition: all 0.2s; ${!hasNext ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                    Next →
                </button>
            </div>
        </div>
    `;
    
    paginationEl.innerHTML = paginationHTML;
    window.changePage = onPageChange;
}

/**
 * Status Badge Generator
 */
export function getStatusBadge(status, type = 'default') {
    const statusStyles = {
        'default': {
            'Active': { bg: '#dcfce7', text: '#166534' },
            'Inactive': { bg: '#f3f4f6', text: '#374151' },
            'Pending': { bg: '#fef3c7', text: '#92400e' },
            'Completed': { bg: '#dcfce7', text: '#166534' },
            'Approved': { bg: '#f3e8ff', text: '#6b21a8' },
            'Locked': { bg: '#fee2e2', text: '#991b1b' },
            'Draft': { bg: '#f3f4f6', text: '#374151' },
            'Processing': { bg: '#dbeafe', text: '#1e40af' },
            'Generated': { bg: '#dbeafe', text: '#1e40af' },
            'Error': { bg: '#fee2e2', text: '#991b1b' }
        },
        'payroll': {
            'Draft': { bg: '#f3f4f6', text: '#374151' },
            'Processing': { bg: '#dbeafe', text: '#1e40af' },
            'Completed': { bg: '#dcfce7', text: '#166534' },
            'Approved': { bg: '#f3e8ff', text: '#6b21a8' },
            'Locked': { bg: '#fee2e2', text: '#991b1b' },
            'Cancelled': { bg: '#f3f4f6', text: '#374151' }
        },
        'payslip': {
            'Generated': { bg: '#dbeafe', text: '#1e40af' },
            'Processed': { bg: '#dcfce7', text: '#166534' },
            'Approved': { bg: '#f3e8ff', text: '#6b21a8' },
            'Locked': { bg: '#fee2e2', text: '#991b1b' },
            'Error': { bg: '#fee2e2', text: '#991b1b' }
        }
    };
    
    const styles = statusStyles[type] || statusStyles.default;
    const style = styles[status] || { bg: '#f3f4f6', text: '#374151' };
    
    return `<span style="display: inline-block; padding: 4px 12px; border-radius: 4px; background: ${style.bg}; color: ${style.text}; font-size: 12px; font-weight: 500;">${status}</span>`;
}

/**
 * Loading State Component
 */
export function showLoadingState(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="color: #9ca3af; margin-top: 15px; font-size: 14px;">${message}</p>
            </div>
        `;
    }
}

/**
 * Empty State Component
 */
export function showEmptyState(containerId, icon = '📭', title = 'No data found', message = 'There are no items to display.') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 50px; margin-bottom: 15px;">${icon}</div>
                <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">${title}</h3>
                <p style="color: #9ca3af; font-size: 14px; margin: 0;">${message}</p>
            </div>
        `;
    }
}

/**
 * Error State Component
 */
export function showErrorState(containerId, errorMessage) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 50px; margin-bottom: 15px;">⚠️</div>
                <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">Error Loading Data</h3>
                <p style="color: #dc2626; font-size: 14px; margin: 0;">${errorMessage}</p>
            </div>
        `;
    }
}

/**
 * Load payroll runs for filter dropdowns
 */
export async function loadPayrollRunsForFilter(selectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Payroll/payroll-runs.php?action=list&limit=100`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const select = document.getElementById(selectId);
            if (select) {
                if (result.success && result.data && Array.isArray(result.data.payroll_runs)) {
                    // Keep the first option
                    const firstOption = select.querySelector('option');
                    select.innerHTML = '';
                    if (firstOption) select.appendChild(firstOption);
                    
                    result.data.payroll_runs.forEach(run => {
                        const option = document.createElement('option');
                        option.value = run.PayrollRunID;
                        option.textContent = `Run #${run.PayrollRunID} - ${new Date(run.PayPeriodStart).toLocaleDateString()} to ${new Date(run.PayPeriodEnd).toLocaleDateString()}`;
                        select.appendChild(option);
                    });
                } else {
                    console.warn('Invalid payroll runs data format:', result);
                }
            }
        } else {
            console.error('Failed to load payroll runs:', response.status);
        }
    } catch (error) {
        console.error('Error loading payroll runs for filter:', error);
    }
}

/**
 * Load branches for filter dropdowns
 */
export async function loadBranchesForFilter(selectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/HRCORE/employees.php?action=branches`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const select = document.getElementById(selectId);
            if (select) {
                if (result.success && result.data && Array.isArray(result.data)) {
                    const firstOption = select.querySelector('option');
                    select.innerHTML = '';
                    if (firstOption) select.appendChild(firstOption);
                    
                    result.data.forEach(branch => {
                        const option = document.createElement('option');
                        option.value = branch.BranchID || branch.id;
                        option.textContent = branch.BranchName || branch.name;
                        select.appendChild(option);
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading branches:', error);
    }
}

/**
 * Load departments for filter dropdowns
 */
export async function loadDepartmentsForFilter(selectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/HRCORE/employees.php?action=departments`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const select = document.getElementById(selectId);
            if (select) {
                if (result.success && result.data && Array.isArray(result.data)) {
                    const firstOption = select.querySelector('option');
                    select.innerHTML = '';
                    if (firstOption) select.appendChild(firstOption);
                    
                    result.data.forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept.DepartmentID || dept.id;
                        option.textContent = dept.DepartmentName || dept.name;
                        select.appendChild(option);
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

// Global functions for modal management
window.closeModal = closeModal;
window.openModal = openModal;
window.closeInlineAlert = closeInlineAlert;
window.closeEnhancedConfirmationModal = closeEnhancedConfirmationModal;
window.showEnhancedConfirmationModal = showEnhancedConfirmationModal;
window.showInlineAlert = showInlineAlert;
window.getStatusBadge = getStatusBadge;
window.loadPayrollRunsForFilter = loadPayrollRunsForFilter;
window.loadBranchesForFilter = loadBranchesForFilter;
window.loadDepartmentsForFilter = loadDepartmentsForFilter;

// Add animation styles to document
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
