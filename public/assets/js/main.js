/**
 * Main JavaScript
 * HR4 Hospital HR Management System
 * Global Configuration & Button Initialization
 */

// Set global API base URL for all modules (detect local vs domain deployment)
function getApiBaseUrl() {
    const path = window.location.pathname;
    
    // If path contains /hospital_4/, we're in local dev
    if (path.includes('/hospital_4/')) {
        return '/hospital_4/api';
    }
    
    // Otherwise, assume deployed to domain root
    return '/api';
}

const apiBaseUrl = getApiBaseUrl();
window.REST_API_URL = apiBaseUrl + '/';
window.API_BASE_URL = apiBaseUrl;

/**
 * Helper function to build API endpoint URLs with .php extension for LiteSpeed compatibility
 * @param {string} endpoint - The endpoint path (e.g., '/auth/login', '/HRCORE/', 'notifications/')
 * @returns {string} - The complete API URL with .php extension if needed
 */
window.getApiUrl = function(endpoint) {
    // Ensure endpoint starts with /
    if (!endpoint.startsWith('/')) {
        endpoint = '/' + endpoint;
    }
    
    // Build the full URL
    let url = apiBaseUrl + endpoint;
    
    // Add .php extension if not already present and not a directory/query
    if (!url.includes('?') && !url.endsWith('.php') && !url.endsWith('/')) {
        url += '.php';
    } else if (url.includes('?') && !url.split('?')[0].endsWith('.php') && !url.split('?')[0].endsWith('/')) {
        // If there's a query string, add .php before the ?
        const [path, query] = url.split('?');
        url = path + '.php?' + query;
    }
    
    return url;
};

/**
 * Monkey-patch fetch to automatically append .php to API endpoints
 * This ensures LiteSpeed compatibility without rewriting .htaccess rules
 */
const originalFetch = window.fetch;
window.fetch = function(resource, config) {
    // If resource is a string (not a Request object), process it
    if (typeof resource === 'string') {
        // Check if it looks like an API call (contains /api/)
        if (resource.includes('/api/') || resource.includes(apiBaseUrl)) {
            // Don't add .php twice
            if (!resource.includes('?') && !resource.endsWith('.php') && !resource.endsWith('/')) {
                resource += '.php';
            } else if (resource.includes('?') && !resource.split('?')[0].endsWith('.php') && !resource.split('?')[0].endsWith('/')) {
                // If there's a query string, add .php before the ?
                const [path, query] = resource.split('?');
                resource = path + '.php?' + query;
            }
        }
    }
    return originalFetch.call(this, resource, config);
};

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global Error:', event.error);
    ButtonHandler?.showNotification(`Error: ${event.error?.message || 'Unknown error'}`, 'error');
});

// Global unhandled rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Rejection:', event.reason);
    ButtonHandler?.showNotification(`Error: ${event.reason?.message || 'Unknown error'}`, 'error');
    event.preventDefault();
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('HR4 Application Loaded');
    console.log('API Base URL:', window.REST_API_URL);
    
    // Initialize all global utilities
    initializeGlobalHandlers();
    
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (token && !window.location.href.includes('dashboard.html')) {
        // Redirect to dashboard if logged in
        console.log('User is logged in');
    }
    
    // Set up global button click delegation
    setupGlobalButtonDelegation();
});

/**
 * Initialize all global handlers and utilities
 */
function initializeGlobalHandlers() {
    // Make utilities globally available
    window.ButtonHandler = window.ButtonHandler || class {
        static showLoading() {}
        static hideLoading() {}
        static showNotification() {}
    };
    
    window.APIHandler = window.APIHandler || class {
        static async request() {}
        static async get() {}
        static async post() {}
        static async put() {}
        static async delete() {}
    };
    
    window.ModalHandler = window.ModalHandler || class {
        static createModal() {}
        static closeModal() {}
    };
    
    console.log('[Main] Global handlers initialized');
}

/**
 * Set up delegation for common button patterns
 */
function setupGlobalButtonDelegation() {
    // Delegate common onclick patterns
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button, [role="button"]');
        if (!button) return;
        
        // Get button action from data attributes or onclick
        const action = button.dataset.action || button.getAttribute('onclick');
        const dataId = button.dataset.id;
        
        // Log button clicks for debugging
        if (window.DEBUG_BUTTONS) {
            console.log('[Button Click]', {
                text: button.textContent,
                action: action,
                dataId: dataId,
                classList: button.className
            });
        }
    }, true);
    
    console.log('[Main] Button delegation set up');
}

/**
 * Show confirmation dialog (global utility)
 */
window.showConfirmDialog = function(title, message, onConfirm, onCancel = '') {
    const id = 'confirm-dialog-' + Date.now();
    const confirmCode = onConfirm.includes('(') ? onConfirm : `${onConfirm}()`;
    const cancelCode = onCancel.includes('(') ? onCancel : `${onCancel}()`;
    
    if (typeof ModalHandler !== 'undefined') {
        ModalHandler.createModal(id, title, `<p>${message}</p>`, {
            cancel: `${cancelCode}; document.getElementById('${id}').remove();`,
            confirm: `${confirmCode}; document.getElementById('${id}').remove();`
        });
    } else {
        // Fallback to browser confirm
        if (confirm(`${title}\n\n${message}`)) {
            eval(confirmCode);
        } else {
            eval(cancelCode);
        }
    }
};

/**
 * Navigate to section
 */
window.navigateToSection = function(section) {
    const event = new CustomEvent('section-change', { detail: { section } });
    document.dispatchEvent(event);
};

console.log('[Main.js] Initialization complete');

