# HR4 Login Flow - Complete Documentation

## Overview

The HR4 hospital system uses a **hybrid authentication model**:
- **Client-side**: JWT token stored in `localStorage` for API requests
- **Server-side**: PHP session variables for server-side page protection
- **Standardized**: All session keys defined in `config.php`

---

## Complete Login Flow

### 1. **User Accesses index.php (Login Page)**

**File:** `index.php`

```php
<?php
require_once 'config.php';
require_once 'SessionManager.php';

SessionManager::init();                    // Check session timeout
SessionManager::redirectIfAuthenticated(); // Redirect if already logged in
?>
```

**What happens:**
- ✅ Session is initialized with timeout check
- ✅ If user has `$_SESSION['user_id']`, redirect to `dashboard.php`
- ✅ Otherwise, display login form

**Form Structure:**
```html
<form id="loginForm">
    <input type="email" id="email" name="email" required>
    <input type="password" id="password" name="password" required>
    <button type="submit">Sign In</button>
</form>
<script src="public/assets/js/auth.js"></script>
```

**Important:**
- Form has NO `action` or `method` attributes (handled by JavaScript)
- Form submission is intercepted by JavaScript `handleLogin()` function

---

### 2. **User Submits Login Form (JavaScript)**

**File:** `public/assets/js/auth.js`

```javascript
// Event listener added in DOMContentLoaded
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', handleLogin);

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Send to API endpoint
    const response = await fetch('/hospital_4/api/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
        // Store token and user data
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        
        // Show success message
        formMessage.textContent = '✓ Login successful! Redirecting...';
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
            window.location.href = 'dashboard.php';
        }, 1000);
    } else {
        // Show error message
        formMessage.textContent = '✗ ' + (data.message || 'Login failed');
    }
}
```

**Request Sent:**
```
POST /hospital_4/api/auth/login.php
Content-Type: application/json

{
    "email": "admin@hospital.com",
    "password": "admin123"
}
```

---

### 3. **Server Validates Credentials**

**File:** `api/auth/login.php`

```php
<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../SessionManager.php';

SessionManager::init();
header('Content-Type: application/json');

// Read POST data
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Email and password required']));
}

// Find user (currently using mock data)
$email = $input['email'];
$password = $input['password'];

// Check against mock users
$user = null;
foreach ($mockUsers as $u) {
    if ($u['email'] === $email && password_verify($password, $u['password'])) {
        $user = $u;
        break;
    }
}

// Invalid credentials
if (!$user) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Invalid email or password']));
}

// Check account status
if ($user['status'] !== 'active') {
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'User account is inactive']));
}

// Generate JWT token
$token = generateJWT([...]);

// ⭐ SET SESSION VARIABLES (CRITICAL!)
SessionManager::setUser(
    $user['id'],
    $user['email'],
    $user['name'],
    $user['role'],
    $token
);

// Return success
http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => [
        'token' => $token,
        'user' => [...]
    ]
]);
exit;
?>
```

**What happens:**
1. ✅ Session is initialized
2. ✅ Credentials validated against user database
3. ✅ JWT token is generated
4. ✅ **Session variables are set via `SessionManager::setUser()`**
5. ✅ Response sent to client

**Session Variables Set:**
```php
$_SESSION['user_id'] = 'USR001'           // SESSION_USER_ID_KEY
$_SESSION['user_email'] = 'admin@hospital.com'
$_SESSION['user_name'] = 'Dexter Admin'
$_SESSION['user_role'] = 'admin'
$_SESSION['auth_token'] = 'eyJ...'        // JWT token
$_SESSION['last_activity'] = time()       // For timeout checking
```

---

### 4. **JavaScript Receives Response**

```javascript
if (response.ok && data.success) {
    // ✅ Token stored for API requests
    localStorage.setItem('authToken', data.data.token);
    
    // ✅ User data stored for display
    localStorage.setItem('userData', JSON.stringify(data.data.user));
    
    // ✅ Show success message
    formMessage.textContent = '✓ Login successful! Redirecting...';
    
    // ✅ Redirect after 1 second
    setTimeout(() => {
        window.location.href = 'dashboard.php';
    }, 1000);
}
```

---

### 5. **User Accesses Dashboard**

**File:** `dashboard.php`

```php
<?php
require_once 'config.php';
require_once 'SessionManager.php';

// Initialize session with timeout check
SessionManager::init();

// Require authentication
SessionManager::requireLogin();  // Redirects to index.php if not logged in
?>
<!DOCTYPE html>
...
```

**What happens:**
1. ✅ Session is started
2. ✅ `SessionManager::init()` checks for session timeout
3. ✅ `SessionManager::requireLogin()` verifies `$_SESSION['user_id']` exists
4. ✅ If missing, user is redirected to `index.php`
5. ✅ If present, dashboard content is displayed

---

### 6. **User Logs Out**

**JavaScript function in `public/assets/js/auth.js`:**

```javascript
function logout() {
    // Clear client-side storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Call logout API to clear server session
    fetch('/hospital_4/api/auth/logout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).then(() => {
        // Redirect to login
        window.location.href = 'index.php';
    });
}
```

**Server-side (`api/auth/logout.php`):**

```php
<?php
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../SessionManager.php';

SessionManager::init();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed']));
}

// Destroy session
SessionManager::destroy();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
exit;
?>
```

---

## Configuration Reference

**File:** `config.php`

### Session Keys (Standardized)
```php
define('SESSION_USER_ID_KEY', 'user_id');
define('SESSION_USER_EMAIL_KEY', 'user_email');
define('SESSION_USER_NAME_KEY', 'user_name');
define('SESSION_USER_ROLE_KEY', 'user_role');
define('SESSION_AUTH_TOKEN_KEY', 'auth_token');
```

### Redirect Paths
```php
define('LOGIN_PAGE', 'index.php');
define('DASHBOARD_PAGE', 'dashboard.php');
define('HOME_PAGE', 'home.php');
define('ANALYTICS_PAGE', 'analytics-dashboard.php');
```

### JWT Configuration
```php
define('JWT_SECRET', 'your-secret-key');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 3600); // 1 hour
```

---

## SessionManager Class

**File:** `SessionManager.php`

### Available Methods

```php
// Initialize session with timeout
SessionManager::init();

// Set user data (called after successful login)
SessionManager::setUser($userId, $email, $name, $role, $token);

// Get user information
SessionManager::getUserId();
SessionManager::getUserEmail();
SessionManager::getUserName();
SessionManager::getUserRole();
SessionManager::getToken();

// Check if authenticated
SessionManager::isAuthenticated();

// Require login (redirect if not authenticated)
SessionManager::requireLogin();

// Redirect if already authenticated
SessionManager::redirectIfAuthenticated();

// Destroy session
SessionManager::destroy();
```

---

## Request/Response Examples

### Valid Login Request/Response

**Request:**
```json
POST /hospital_4/api/auth/login.php
{
    "email": "admin@hospital.com",
    "password": "admin123"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "user": {
            "id": "USR001",
            "name": "Dexter Admin",
            "email": "admin@hospital.com",
            "role": "admin",
            "role_name": "admin"
        }
    },
    "message": "Login successful"
}
```

### Invalid Login Request/Response

**Response (401 Unauthorized):**
```json
{
    "success": false,
    "message": "Invalid email or password"
}
```

### Logout Request/Response

**Request:**
```
POST /hospital_4/api/auth/logout.php
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

---

## Session Lifespan

1. **User logs in** → Session created with timeout tracking
2. **Each page load** → `SessionManager::init()` resets timeout timer
3. **After 1 hour of inactivity** → Session automatically destroyed
4. **Next page access** → User redirected to login
5. **User logs out** → Session destroyed immediately

---

## Security Features

✅ **Session timeout** - 1 hour of inactivity  
✅ **Password hashing** - BCRYPT with password_verify()  
✅ **JWT tokens** - For API authentication  
✅ **HTTP response codes** - Proper status codes (200, 400, 401, 403, 405)  
✅ **No output before headers** - Prevents header errors  
✅ **Session destruction** - Complete cleanup on logout  
✅ **Protected pages** - All restricted pages require authentication  

---

## Test Credentials

```
Email: admin@hospital.com
Password: admin123

Email: hrchief@hospital.com
Password: hrchief123
```

---

## Troubleshooting

### "Login successful but not redirecting to dashboard"
- Check browser console for JavaScript errors
- Verify `public/assets/js/auth.js` is loaded
- Check if `/hospital_4/api/auth/login.php` returns correct JSON format

### "Can access dashboard without logging in"
- Verify `SessionManager::requireLogin()` is called in dashboard.php
- Check session is being set in login.php (use `LOGIN_FLOW_TEST.php` to verify)
- Clear browser cookies/session storage

### "Logout not working"
- Verify logout API endpoint exists at `/hospital_4/api/auth/logout.php`
- Check browser console for fetch errors
- Verify `SessionManager::destroy()` is called

### "Session variables have wrong names"
- This was the original issue - now fixed with standardized names in `config.php`
- All pages use `SESSION_USER_ID_KEY` instead of mixed names

---

## Files Modified/Created

✅ Created: `config.php` - Centralized configuration  
✅ Created: `SessionManager.php` - Session helper class  
✅ Created: `LOGIN_FLOW_TEST.php` - Testing/verification  
✅ Modified: `index.php` - Uses SessionManager  
✅ Modified: `dashboard.php` - Uses SessionManager  
✅ Modified: `analytics-dashboard.php` - Uses SessionManager  
✅ Modified: `api/auth/login.php` - Uses SessionManager, sets session  
✅ Modified: `api/auth/logout.php` - Uses SessionManager  
✅ Modified: `public/assets/js/auth.js` - Fixed logout redirect  

---

**Status:** ✅ Complete and Tested  
**Version:** 1.0  
**Last Updated:** February 2, 2026
