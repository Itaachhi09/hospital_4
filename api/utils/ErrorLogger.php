<?php
/**
 * Error Logger - Centralized Error and Activity Logging
 * Logs errors, API requests, and security events to files and database
 */

class ErrorLogger {
    
    private static $logDir = __DIR__ . '/../../logs';
    private static $logLevel = 'INFO'; // DEBUG, INFO, WARNING, ERROR, CRITICAL
    
    /**
     * Initialize logger
     */
    public static function initialize() {
        if (!is_dir(self::$logDir)) {
            mkdir(self::$logDir, 0755, true);
        }
    }
    
    /**
     * Log an error
     */
    public static function logError($message, $exception = null, $context = []) {
        self::initialize();
        
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => 'ERROR',
            'message' => $message,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'path' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'context' => $context
        ];
        
        if ($exception) {
            $logEntry['exception'] = [
                'type' => get_class($exception),
                'code' => $exception->getCode(),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString()
            ];
        }
        
        self::writeLog($logEntry, 'error');
        
        // Also log to database if available
        self::logToDatabase($logEntry);
    }
    
    /**
     * Log API request
     */
    public static function logRequest($user = null) {
        self::initialize();
        
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => 'INFO',
            'type' => 'API_REQUEST',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'path' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'user_id' => $user['id'] ?? 'anonymous',
            'user_role' => $user['role'] ?? 'unknown'
        ];
        
        self::writeLog($logEntry, 'api');
    }
    
    /**
     * Log security event
     */
    public static function logSecurityEvent($eventType, $message, $user = null, $severity = 'WARNING') {
        self::initialize();
        
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => $severity,
            'type' => 'SECURITY_EVENT',
            'event' => $eventType,
            'message' => $message,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_id' => $user['id'] ?? 'unknown',
            'user_role' => $user['role'] ?? 'unknown'
        ];
        
        self::writeLog($logEntry, 'security');
        self::logToDatabase($logEntry);
    }
    
    /**
     * Log payroll audit
     */
    public static function logPayrollAudit($action, $details, $user, $oldData = null, $newData = null) {
        self::initialize();
        
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => 'INFO',
            'type' => 'PAYROLL_AUDIT',
            'action' => $action,
            'details' => $details,
            'user_id' => $user['id'] ?? 'unknown',
            'user_role' => $user['role'] ?? 'unknown',
            'old_data' => $oldData,
            'new_data' => $newData
        ];
        
        self::writeLog($logEntry, 'payroll');
        self::logToDatabase($logEntry);
    }
    
    /**
     * Write log to file
     */
    private static function writeLog($logEntry, $type = 'general') {
        $logFile = self::$logDir . '/' . $type . '_' . date('Y-m-d') . '.log';
        
        $logMessage = json_encode($logEntry) . "\n";
        
        if (!file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX)) {
            error_log('Failed to write to log file: ' . $logFile);
        }
    }
    
    /**
     * Log to database (optional - requires database connection)
     */
    private static function logToDatabase($logEntry) {
        global $conn;
        
        if (!isset($conn) || !$conn) {
            return; // Database not available
        }
        
        try {
            $sql = "INSERT INTO activity_logs (log_type, log_level, log_message, user_id, ip_address, request_path, request_method, details, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                return; // Prepare failed
            }
            
            $logType = $logEntry['type'] ?? 'GENERAL';
            $logLevel = $logEntry['level'] ?? 'INFO';
            $logMessage = $logEntry['message'] ?? '';
            $userId = $logEntry['user_id'] ?? null;
            $ipAddress = $logEntry['ip'] ?? '';
            $requestPath = $logEntry['path'] ?? '';
            $requestMethod = $logEntry['method'] ?? '';
            $details = json_encode($logEntry);
            
            $stmt->bind_param('sssssssss',
                $logType,
                $logLevel,
                $logMessage,
                $userId,
                $ipAddress,
                $requestPath,
                $requestMethod,
                $details
            );
            
            $stmt->execute();
            $stmt->close();
        } catch (Exception $e) {
            error_log('Error logging to database: ' . $e->getMessage());
        }
    }
    
    /**
     * Get recent logs
     */
    public static function getRecentLogs($type = 'error', $limit = 50) {
        self::initialize();
        
        $logFile = self::$logDir . '/' . $type . '_' . date('Y-m-d') . '.log';
        
        if (!file_exists($logFile)) {
            return [];
        }
        
        $lines = file($logFile, FILE_IGNORE_NEW_LINES);
        $logs = [];
        
        foreach (array_slice($lines, -$limit) as $line) {
            $log = json_decode($line, true);
            if ($log) {
                $logs[] = $log;
            }
        }
        
        return array_reverse($logs);
    }
    
    /**
     * Clear old logs (keep last 30 days)
     */
    public static function cleanupOldLogs($daysToKeep = 30) {
        self::initialize();
        
        $cutoffDate = time() - ($daysToKeep * 86400);
        
        foreach (glob(self::$logDir . '/*.log') as $file) {
            if (filemtime($file) < $cutoffDate) {
                unlink($file);
            }
        }
    }
}

?>
