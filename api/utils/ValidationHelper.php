<?php
/**
 * Input Validation Helper
 * Validates user inputs and request data
 */

class ValidationHelper {
    
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    public static function validatePhone($phone) {
        // Simple phone validation - adjust based on your requirements
        return preg_match('/^[\d\-\+\s\(\)]{7,}$/', $phone);
    }
    
    public static function validateRequired($value) {
        return !empty(trim((string)$value));
    }
    
    public static function validateLength($value, $min = 0, $max = PHP_INT_MAX) {
        $length = strlen((string)$value);
        return $length >= $min && $length <= $max;
    }
    
    public static function validateNumeric($value) {
        return is_numeric($value);
    }
    
    public static function validateDate($date, $format = 'Y-m-d') {
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
    
    public static function sanitizeInput($input) {
        if (is_array($input)) {
            return array_map('self::sanitizeInput', $input);
        }
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
    
    public static function validatePasswordStrength($password) {
        $strength = 0;
        $feedback = [];
        
        if (strlen($password) >= 8) $strength++;
        else $feedback[] = 'At least 8 characters';
        
        if (preg_match('/[a-z]/', $password)) $strength++;
        else $feedback[] = 'At least one lowercase letter';
        
        if (preg_match('/[A-Z]/', $password)) $strength++;
        else $feedback[] = 'At least one uppercase letter';
        
        if (preg_match('/[0-9]/', $password)) $strength++;
        else $feedback[] = 'At least one number';
        
        if (preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) $strength++;
        else $feedback[] = 'At least one special character';
        
        return [
            'strength' => $strength,
            'valid' => $strength >= 4,
            'feedback' => $feedback
        ];
    }
    
    /**
     * SECURITY ENHANCEMENT: Validate SQL injection patterns
     */
    public static function isSuspiciousSQL($value) {
        $patterns = [
            '/(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT)\b)/i',
            '/(--|#|\/\*|\*\/|;)/i',
            '/(\bOR\b|\bAND\b).*=.*/i',
            '/(>|<|=).*[\'"].*(\bOR\b|\bAND\b)/i'
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * SECURITY ENHANCEMENT: Validate XSS patterns
     */
    public static function isSuspiciousXSS($value) {
        $patterns = [
            '/<script[^>]*>.*?<\/script>/i',
            '/javascript:/i',
            '/on\w+\s*=/i', // Event handlers like onclick=, onload=, etc.
            '/<iframe/i',
            '/<embed/i',
            '/<object/i',
            '/eval\(/i',
            '/expression\(/i'
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * SECURITY ENHANCEMENT: Validate currency format
     */
    public static function validateCurrency($value) {
        return preg_match('/^\d+(\.\d{2})?$/', $value);
    }
    
    /**
     * SECURITY ENHANCEMENT: Validate integer
     */
    public static function validateInteger($value, $min = null, $max = null) {
        if (!is_numeric($value) || strpos($value, '.') !== false) {
            return false;
        }
        
        $intVal = (int)$value;
        
        if ($min !== null && $intVal < $min) {
            return false;
        }
        
        if ($max !== null && $intVal > $max) {
            return false;
        }
        
        return true;
    }
    
    /**
     * SECURITY ENHANCEMENT: Sanitize SQL (last resort - prepared statements preferred)
     */
    public static function sanitizeForSQL($value, $conn) {
        if (is_array($value)) {
            return array_map(function($v) use ($conn) {
                return self::sanitizeForSQL($v, $conn);
            }, $value);
        }
        
        // Use mysqli_real_escape_string as fallback (prepared statements preferred)
        return mysqli_real_escape_string($conn, $value);
    }
}
?>
