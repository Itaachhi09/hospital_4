/**
 * Authentication Handler
 * Manages login, logout, and token management
 */

// API base URL - deployed to domain
const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Don't auto-redirect from login page - let user control the flow
    // This prevents redirect loops if dashboard init fails
});

async function handleLogin(e) {
    e.preventDefault();
    console.log('[Auth] Login form submitted');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const formMessage = document.getElementById('formMessage');
    
    console.log('[Auth] Email:', email);
    console.log('[Auth] Password length:', password.length);
    
    // Clear previous messages
    formMessage.textContent = '';
    formMessage.className = 'form-message';
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    
    // Basic validation
    if (!email || !password) {
        console.error('[Auth] Validation failed - missing fields');
        formMessage.classList.add('show', 'error');
        formMessage.textContent = 'Please fill in all fields';
        return;
    }
    
    console.log('[Auth] Submitting login request to ' + API_BASE_URL + '/auth/login.php');
    
    try {
        const response = await fetch(API_BASE_URL + '/auth/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const text = await response.text();
        let data;
        
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Response text:', text);
            formMessage.classList.add('show', 'error');
            formMessage.textContent = '✗ Server error. Please contact support.';
            return;
        }
        
        if (response.ok && data.success) {
            // Store token and user data
            console.log('%c[Auth] ✓ LOGIN SUCCESSFUL!', 'color: green; font-weight: bold; font-size: 14px;');
            console.log('[Auth] Response data:', data);
            console.log('[Auth] Storing token:', data.data.token ? '✓' : '✗');
            console.log('[Auth] Storing user:', data.data.user ? JSON.stringify(data.data.user) : '✗');
            
            localStorage.setItem('authToken', data.data.token);
            localStorage.setItem('userData', JSON.stringify(data.data.user));
            
            // Verify storage
            console.log('[Auth] Token in localStorage after storage:', localStorage.getItem('authToken') ? '✓' : '✗');
            console.log('[Auth] User in localStorage after storage:', localStorage.getItem('userData') ? '✓' : '✗');
            
            // Show success message
            formMessage.classList.add('show', 'success');
            formMessage.textContent = '✓ Login successful! Redirecting...';
            
            console.log('%c[Auth] REDIRECTING TO dashboard.php in 1 second...', 'color: blue; font-weight: bold;');
            
            // Redirect to dashboard
            setTimeout(() => {
                console.log('%c[Auth] NOW redirecting...', 'color: blue');
                window.location.href = 'dashboard.php';
            }, 1000);
        } else {
            console.error('%c[Auth] ✗ LOGIN FAILED', 'color: red; font-weight: bold;');
            console.log('[Auth] Response status:', response.ok);
            console.log('[Auth] Data success:', data.success);
            console.log('[Auth] Full response:', data);
            formMessage.classList.add('show', 'error');
            formMessage.textContent = '✗ ' + (data.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('[Auth] Login request error:', error);
        formMessage.classList.add('show', 'error');
        formMessage.textContent = '✗ Network error. Please check your connection and try again.';
    }
}

function logout() {
    // Clear client-side storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    console.log('[Auth] Logout requested');
    
    // Call logout API endpoint to clear server session
    fetch(window.getApiUrl('/auth/logout'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        console.log('[Auth] Logout response:', response.status);
        // Redirect to login regardless of response
        redirectToLogin();
    }).catch(error => {
        console.error('[Auth] Logout error:', error);
        // Still redirect even if logout fails
        redirectToLogin();
    });
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    console.log('[Auth] Redirecting to login');
    window.location.href = '/';
}

