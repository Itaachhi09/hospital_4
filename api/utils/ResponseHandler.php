<?php
/**
 * API Response Handler
 * Standardizes API responses across the application
 */

class ResponseHandler {
    
    public static function success($data = null, $message = 'Success', $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        
        return json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    public static function error($message, $statusCode = 400, $errors = null) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        
        $response = [
            'success' => false,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        if ($errors) {
            $response['errors'] = $errors;
        }
        
        return json_encode($response);
    }
    
    public static function paginated($data, $total, $page, $pageSize, $message = 'Success') {
        http_response_code(200);
        header('Content-Type: application/json');
        
        return json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'pageSize' => $pageSize,
                'totalPages' => ceil($total / $pageSize)
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}
?>
