/**
 * Global Button Handler Utilities
 * Standardized button behavior across all modules
 * Includes loading states, success/error messages, validation
 */

class ButtonHandler {
    static activeButtons = new Set();
    
    /**
     * Show loading state on button
     */
    static showLoading(buttonId, originalText = null) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (!originalText) {
            button.dataset.originalText = button.innerHTML;
        }
        button.disabled = true;
        button.innerHTML = '<span class="spinner"></span> Loading...';
        button.classList.add('btn-loading');
        this.activeButtons.add(buttonId);
    }
    
    /**
     * Hide loading state and restore button text
     */
    static hideLoading(buttonId, success = false) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        const originalText = button.dataset.originalText || 'Submit';
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('btn-loading');
        
        if (success) {
            button.classList.add('btn-success');
            setTimeout(() => button.classList.remove('btn-success'), 2000);
        }
        
        this.activeButtons.delete(buttonId);
    }
    
    /**
     * Show error state on button
     */
    static showError(buttonId, errorMessage = 'Error occurred') {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        button.disabled = false;
        button.innerHTML = `❌ ${errorMessage}`;
        button.classList.add('btn-error');
        
        setTimeout(() => {
            button.innerHTML = button.dataset.originalText || 'Submit';
            button.classList.remove('btn-error');
        }, 3000);
    }
    
    /**
     * Show notification toast
     */
    static showNotification(message, type = 'info', duration = 4000) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.remove(), duration);
    }
    
    /**
     * Create toast container if it doesn't exist
     */
    static createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
        return container;
    }
    
    /**
     * Validate form before submission
     */
    static validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return true;
        
        const required = form.querySelectorAll('[required]');
        let isValid = true;
        
        required.forEach(field => {
            if (!field.value || field.value.trim() === '') {
                field.style.borderColor = '#dc2626';
                field.classList.add('error');
                isValid = false;
            } else {
                field.style.borderColor = '';
                field.classList.remove('error');
            }
        });
        
        return isValid;
    }
    
    /**
     * Clear form errors
     */
    static clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.querySelectorAll('.error').forEach(field => {
            field.style.borderColor = '';
            field.classList.remove('error');
        });
    }
}

/**
 * API Handler - Standardized API requests
 */
class APIHandler {
    static apiBase = window.REST_API_URL || '/api/';
    
    /**
     * Make authenticated API request
     */
    static async request(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const token = localStorage.getItem('authToken');
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    /**
     * GET request
     */
    static async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    
    /**
     * POST request
     */
    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * PUT request
     */
    static async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    /**
     * DELETE request
     */
    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

/**
 * Modal Handler - Standardized modal operations
 */
class ModalHandler {
    static createModal(id, title, content, actions = {}) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                border-radius: 8px;
                padding: 24px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600;">${title}</h3>
                    <button onclick="document.getElementById('${id}').remove()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #6b7280;
                    ">✕</button>
                </div>
                <div style="margin-bottom: 24px;">${content}</div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    ${actions.cancel ? `<button onclick="${actions.cancel}" class="btn btn-secondary">Cancel</button>` : ''}
                    ${actions.confirm ? `<button onclick="${actions.confirm}" class="btn btn-primary">Confirm</button>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }
    
    static closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.remove();
    }
}

/**
 * Confirmation Dialog
 */
function showConfirmDialog(title, message, onConfirm, onCancel) {
    ModalHandler.createModal('confirm-dialog', title, message, {
        cancel: `document.getElementById('confirm-dialog').remove(); ${onCancel || ''}`,
        confirm: `${onConfirm}; document.getElementById('confirm-dialog').remove();`
    });
}

/**
 * Initialize global event handlers
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add spinner CSS if not already present
    if (!document.querySelector('style[data-spinners]')) {
        const style = document.createElement('style');
        style.dataset.spinners = 'true';
        style.textContent = `
            .spinner {
                display: inline-block;
                width: 14px;
                height: 14px;
                border: 2px solid #f3f4f6;
                border-top: 2px solid #2563eb;
                border-radius: 50%;
                animation: spin 0.6s linear infinite;
                margin-right: 8px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .btn-loading {
                opacity: 0.7;
                cursor: not-allowed !important;
            }
            
            .btn-success {
                background: #10b981 !important;
            }
            
            .btn-error {
                background: #dc2626 !important;
            }
            
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            }
            
            .toast {
                padding: 12px 16px;
                border-radius: 6px;
                margin-bottom: 8px;
                animation: slideIn 0.3s ease-out;
                color: white;
                font-size: 14px;
            }
            
            .toast-info {
                background: #3b82f6;
            }
            
            .toast-success {
                background: #10b981;
            }
            
            .toast-error {
                background: #dc2626;
            }
            
            .toast-warning {
                background: #f59e0b;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ButtonHandler, APIHandler, ModalHandler };
}
