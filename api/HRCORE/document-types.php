<?php
/**
 * Document Types Endpoints
 * List document types
 */

// Suppress error display, we'll handle it ourselves
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../config/constants.php';
    require_once __DIR__ . '/../utils/ResponseHandler.php';
    
    // Get database connection
    $conn = null;
    @include __DIR__ . '/../config/database.php';
    
    if (!$conn || ($conn && $conn->connect_error)) {
        // Return fallback data if database unavailable
        $fallbackTypes = [
            ['id' => 'DOC_TYPE_001', 'category_id' => 'DOC_CAT_001', 'type_name' => 'National ID', 'category_name' => 'Personal Documents', 'description' => 'National Identification Document', 'requires_expiry' => 1, 'status' => 'active'],
            ['id' => 'DOC_TYPE_002', 'category_id' => 'DOC_CAT_001', 'type_name' => 'Passport', 'category_name' => 'Personal Documents', 'description' => 'International Passport', 'requires_expiry' => 1, 'status' => 'active'],
            ['id' => 'DOC_TYPE_003', 'category_id' => 'DOC_CAT_002', 'type_name' => 'Work Permit', 'category_name' => 'Work Authorization', 'description' => 'Work authorization permit', 'requires_expiry' => 1, 'status' => 'active'],
            ['id' => 'DOC_TYPE_004', 'category_id' => 'DOC_CAT_003', 'type_name' => 'Medical License', 'category_name' => 'Certifications', 'description' => 'Medical professional license', 'requires_expiry' => 1, 'status' => 'active']
        ];
        echo ResponseHandler::success($fallbackTypes, 'Document types retrieved (fallback)');
        exit;
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    $categoryId = isset($_GET['category_id']) ? $_GET['category_id'] : null;
    
    $fallbackTypes = [
        ['id' => 'DOC_TYPE_001', 'category_id' => 'DOC_CAT_001', 'type_name' => 'National ID', 'description' => 'National Identification Document', 'requires_expiry' => 1, 'status' => 'active'],
        ['id' => 'DOC_TYPE_002', 'category_id' => 'DOC_CAT_001', 'type_name' => 'Passport', 'description' => 'International Passport', 'requires_expiry' => 1, 'status' => 'active'],
        ['id' => 'DOC_TYPE_003', 'category_id' => 'DOC_CAT_002', 'type_name' => 'Work Permit', 'description' => 'Work authorization permit', 'requires_expiry' => 1, 'status' => 'active'],
        ['id' => 'DOC_TYPE_004', 'category_id' => 'DOC_CAT_003', 'type_name' => 'Medical License', 'description' => 'Medical professional license', 'requires_expiry' => 1, 'status' => 'active']
    ];
    if ($method === 'GET') {
        try {
            $sql = "SELECT dt.id, dt.category_id, dt.type_name, dt.description, dt.requires_expiry, dt.status FROM document_types dt WHERE dt.status = 'active'";
            if ($categoryId) {
                $sql .= " AND dt.category_id = '" . $conn->real_escape_string($categoryId) . "'";
            }
            $sql .= " ORDER BY dt.type_name";
            $result = $conn->query($sql);
            if (!$result) {
                echo ResponseHandler::success($fallbackTypes, 'Document types retrieved (fallback)');
                exit;
            }
            $types = [];
            while ($row = $result->fetch_assoc()) {
                $types[] = $row;
            }
            if (empty($types)) {
                echo ResponseHandler::success($fallbackTypes, 'Document types retrieved (fallback)');
                exit;
            }
            echo ResponseHandler::success($types, 'Document types retrieved successfully');
        } catch (Exception $e) {
            if (strpos($e->getMessage(), "doesn't exist") !== false) {
                echo ResponseHandler::success($fallbackTypes, 'Document types retrieved (fallback)');
            } else {
                http_response_code(500);
                die(ResponseHandler::error('Server error: ' . $e->getMessage(), 500));
            }
        }
    } else {
        http_response_code(405);
        die(ResponseHandler::error('Method not allowed'));
    }
} catch (Exception $e) {
    $fallbackTypes = [
        ['id' => 'DOC_TYPE_001', 'category_id' => 'DOC_CAT_001', 'type_name' => 'National ID', 'description' => 'National Identification Document', 'requires_expiry' => 1, 'status' => 'active'],
        ['id' => 'DOC_TYPE_002', 'category_id' => 'DOC_CAT_001', 'type_name' => 'Passport', 'description' => 'International Passport', 'requires_expiry' => 1, 'status' => 'active'],
        ['id' => 'DOC_TYPE_003', 'category_id' => 'DOC_CAT_002', 'type_name' => 'Work Permit', 'description' => 'Work authorization permit', 'requires_expiry' => 1, 'status' => 'active'],
        ['id' => 'DOC_TYPE_004', 'category_id' => 'DOC_CAT_003', 'type_name' => 'Medical License', 'description' => 'Medical professional license', 'requires_expiry' => 1, 'status' => 'active']
    ];
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        echo ResponseHandler::success($fallbackTypes, 'Document types retrieved (fallback)');
    } else {
        http_response_code(500);
        die(ResponseHandler::error('Server error: ' . $e->getMessage(), 500));
    }
}
?>
