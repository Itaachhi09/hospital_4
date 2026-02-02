/**
 * Shared Utilities for Hospital HR Management System
 */

export const API_BASE_URL = '/api';
export const REST_API_URL = `${API_BASE_URL}/`;
export const LEGACY_API_URL = '/api/Employees/';

/**
 * Get authentication token from localStorage
 */
export function getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
}

/**
 * Get user data from localStorage
 */
export function getUserData() {
    try {
        return JSON.parse(localStorage.getItem('userData') || '{}');
    } catch (e) {
        return {};
    }
}

/**
 * Format currency values
 */
export function formatCurrency(value) {
    return '₱' + (value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Format date values
 */
export function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH');
}

/**
 * Create standardized fetch options with authentication
 */
export function getFetchOptions(method = 'GET', body = null) {
    const options = {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const token = getAuthToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    return options;
}

/**
 * Handle API response errors
 */
export async function handleApiResponse(response) {
    if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/index.php';
        return null;
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const bgColor = {
        success: '#dcfce7',
        error: '#fee2e2',
        warning: '#fef3c7',
        info: '#dbeafe'
    }[type] || '#dbeafe';

    const textColor = {
        success: '#166534',
        error: '#991b1b',
        warning: '#92400e',
        info: '#1e40af'
    }[type] || '#1e40af';

    toast.style.cssText = `background: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: 6px; margin-bottom: 10px; animation: slideIn 0.3s ease;`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    if (duration > 0) {
        setTimeout(() => toast.remove(), duration);
    }

    return toast;
}
