<?php
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - HR4 Hospital HR Management System</title>
    <link rel="stylesheet" href="public/assets/css/style.css">
</head>
<body class="login-page healthcare-gradient">
    <div class="login-container">
        <div class="login-box">
            <h2>🏥 HR4</h2>
            <p>Healthcare HR Management System</p>

            <form id="loginForm">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="your.email@hospital.com" required>
                    <span class="error-message" id="emailError"></span>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="••••••••" required>
                    <span class="error-message" id="passwordError"></span>
                </div>

                <div class="form-group" style="display: flex; align-items: center;">
                    <input type="checkbox" id="remember" name="remember" style="width: auto; margin: 0;">
                    <label for="remember" style="margin: 0 0 0 0.5rem; margin-bottom: 0;">Remember me</label>
                </div>

                <button type="submit" class="btn btn-primary btn-block">Sign In</button>

                <div class="form-message" id="formMessage"></div>
            </form>

            <!-- Test Accounts Display -->
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.2);">
                <p style="color: #cbd5e1; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 12px;">📋 Test Accounts</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; font-size: 11px; color: #cbd5e1;">
                        <div style="font-weight: 600; color: #60a5fa;">Admin</div>
                        <div>admin@hospital.com</div>
                        <div>admin123</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; font-size: 11px; color: #cbd5e1;">
                        <div style="font-weight: 600; color: #10b981;">HR Chief</div>
                        <div>hrchief@hospital.com</div>
                        <div>hrchief123</div>
                    </div>
                </div>
            </div>

            <div class="login-footer">
                <a href="#">Forgot Password?</a>
                <a href="#">Need Help?</a>
            </div>
        </div>
    </div>

    <script src="public/assets/js/auth.js"></script>
</body>
</html>
