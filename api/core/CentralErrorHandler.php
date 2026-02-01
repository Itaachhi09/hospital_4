<?php
/**
 * Central Error Handler
 * Catch all uncaught exceptions; return consistent JSON; log with context.
 * Never expose stack traces in production.
 */

require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../utils/ErrorLogger.php';

class CentralErrorHandler
{
    private static $logErrors = true;
    private static $showDetails = false; // set true only in development

    /**
     * Register as default exception and error handlers.
     */
    public static function register()
    {
        set_exception_handler([__CLASS__, 'handleException']);
        set_error_handler([__CLASS__, 'handleError'], E_ALL);
    }

    /**
     * @param Throwable|Exception $e
     */
    public static function handleException($e)
    {
        $code = method_exists($e, 'getCode') ? (int) $e->getCode() : 500;
        if ($code < 400 || $code > 599) {
            $code = 500;
        }

        $message = $e->getMessage();
        $detail = self::$showDetails ? $e->getTraceAsString() : null;

        if (self::$logErrors && class_exists('ErrorLogger')) {
            ErrorLogger::logError(
                'Exception: ' . $message,
                $e,
                [
                    'code' => $code,
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );
        }

        header('Content-Type: application/json');
        http_response_code($code);
        $body = [
            'success' => false,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s'),
        ];
        if ($detail !== null) {
            $body['detail'] = $detail;
        }
        echo json_encode($body);
        exit;
    }

    /**
     * @param int    $errno
     * @param string $errstr
     * @param string $errfile
     * @param int    $errline
     * @return bool
     */
    public static function handleError($errno, $errstr, $errfile = '', $errline = 0)
    {
        if (!(error_reporting() & $errno)) {
            return false;
        }
        $e = new ErrorException($errstr, 0, $errno, $errfile, $errline);
        self::handleException($e);
        return true;
    }

    /**
     * Configure: show details in response (dev only).
     */
    public static function setShowDetails($show)
    {
        self::$showDetails = (bool) $show;
    }

    /**
     * Configure: log errors.
     */
    public static function setLogErrors($log)
    {
        self::$logErrors = (bool) $log;
    }
}
