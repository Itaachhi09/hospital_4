/**
 * API Client
 * Handles all API requests with authentication and CSRF protection
 * ENHANCED: Includes CSRF token support and error handling
 */

class APIClient {
    constructor(baseURL = 'http://localhost/hospital_4/api') {
        this.baseURL = baseURL;
        this.csrfToken = null;
        this.loadCSRFToken();
    }
    
    /**
     * Load CSRF token from meta tag
     */
    loadCSRFToken() {
        const csrfElement = document.querySelector('meta[name="csrf-token"]');
        if (csrfElement) {
            this.csrfToken = csrfElement.getAttribute('content');
        }
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;
        const token = localStorage.getItem('authToken');
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Add JWT token if available
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add CSRF token for state-changing operations
        if (this.csrfToken && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
            headers['X-CSRF-Token'] = this.csrfToken;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include' // Include cookies if using HttpOnly
            });
            
            // Handle unauthorized
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = '/hospital_4/index.php';
                return null;
            }
            
            // Handle forbidden
            if (response.status === 403) {
                console.error('Access denied - insufficient permissions');
                throw new Error('You do not have permission to perform this action');
            }
            
            const data = await response.json();
            
            // Check if response indicates success
            if (!response.ok && data && !data.success) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }
    
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
    
    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Create global API client instance
const api = new APIClient();
