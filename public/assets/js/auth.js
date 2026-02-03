/**
 * Authentication Handler
 * Manages login, logout, and token management
 */

// Use the API base URL from main.js (which is loaded first)
// Falls back to /api if main.js hasn't loaded yet
const API_BASE_URL = window.API_BASE_URL || '/api';

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
    
    // Build login URL
    const loginUrl = typeof window.getApiUrl === 'function' 
        ? window.getApiUrl('/auth/login')
        : API_BASE_URL + '/auth/login.php';
    
    console.log('[Auth] Submitting login request to:', loginUrl);
    
    try {
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Important: Include session cookies
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
            console.error('[Auth] Response parse error. Raw response:', text);
            formMessage.classList.add('show', 'error');
            formMessage.textContent = '✗ Server error. Please contact support.';
            return;
        }
        
        console.log('[Auth] Response status:', response.status);
        console.log('[Auth] Response ok:', response.ok);
        console.log('[Auth] Response data:', data);
        
        if (response.ok && data.success) {
            // Store token and user data
            console.log('%c[Auth] ✓ LOGIN SUCCESSFUL!', 'color: green; font-weight: bold; font-size: 14px;');
            console.log('[Auth] Storing token:', data.data?.token ? '✓' : '✗');
            console.log('[Auth] Storing user:', data.data?.user ? '✓' : '✗');
            
            if (data.data && data.data.token) {
                localStorage.setItem('authToken', data.data.token);
                console.log('[Auth] authToken stored:', localStorage.getItem('authToken') ? '✓' : '✗');
            } else {
                console.error('[Auth] ERROR: No token in response!', data);
                formMessage.classList.add('show', 'error');
                formMessage.textContent = '✗ Server error: No authentication token received.';
                return;
            }
            
            if (data.data && data.data.user) {
                localStorage.setItem('userData', JSON.stringify(data.data.user));
                console.log('[Auth] userData stored:', localStorage.getItem('userData') ? '✓' : '✗');
            } else {
                console.error('[Auth] ERROR: No user data in response!', data);
                formMessage.classList.add('show', 'error');
                formMessage.textContent = '✗ Server error: No user data received.';
                return;
            }
            
            // Verify storage
            const storedToken = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('userData');
            console.log('[Auth] Verification after storage:');
            console.log('[Auth]   - Token exists:', !!storedToken);
            console.log('[Auth]   - Token length:', storedToken ? storedToken.length : 0);
            console.log('[Auth]   - User exists:', !!storedUser);
            
            // Show success message
            formMessage.classList.add('show', 'success');
            formMessage.textContent = '✓ Login successful! Redirecting...';
            
            console.log('%c[Auth] REDIRECTING TO dashboard.php in 1 second...', 'color: blue; font-weight: bold;');
            
            // Redirect to dashboard
            setTimeout(() => {
                console.log('%c[Auth] NOW redirecting...', 'color: blue');
                window.location.href = '/dashboard.php';
            }, 1000);
        } else {
            console.error('%c[Auth] ✗ LOGIN FAILED', 'color: red; font-weight: bold;');
            console.log('[Auth] Response details:', {
                status: response.status,
                ok: response.ok,
                success: data.success,
                message: data.message
            });
            formMessage.classList.add('show', 'error');
            formMessage.textContent = '✗ ' + (data.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('[Auth] Login request error:', error);
        console.error('[Auth] Error stack:', error.stack);
        formMessage.classList.add('show', 'error');
        formMessage.textContent = '✗ Network error. Please check your connection and try again.';
    }
}

function logout() {
    console.log('[Auth] Logout requested');
    
    const logoutUrl = typeof window.getApiUrl === 'function' 
        ? window.getApiUrl('/auth/logout')
        : API_BASE_URL + '/auth/logout.php';
    
    const authToken = localStorage.getItem('authToken');
    
    // Send logout request to server FIRST (with auth token still in localStorage)
    fetch(logoutUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (authToken || '')
        },
        credentials: 'include'
    }).then(response => {
        console.log('[Auth] Server logout response:', response.status);
        // Check if logout was successful
        if (!response.ok) {
            console.warn('[Auth] Server logout returned status:', response.status);
        }
        // Clear client-side storage regardless of server response
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('sessionVerified');
        sessionStorage.clear();
        // Redirect to login page
        redirectToLogin();
    }).catch(error => {
        console.error('[Auth] Logout error:', error);
        // Still clear local storage and redirect even if logout fails
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('sessionVerified');
        sessionStorage.clear();
        redirectToLogin();
    });
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    console.log('[Auth] Redirecting to login page');
    window.location.href = '/index.php';
}

