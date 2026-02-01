<?php
/**
 * Document Categories Endpoints
 * List document categories
 */

// Suppress error display, we'll handle it ourselves
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

// Fallback categories
$fallbackCategories = [
    ['id' => 'DOC_CAT_001', 'category_name' => 'Category A', 'description' => 'Category A Documents', 'status' => 'active'],
    ['id' => 'DOC_CAT_002', 'category_name' => 'Category B', 'description' => 'Category B Documents', 'status' => 'active'],
    ['id' => 'DOC_CAT_003', 'category_name' => 'Category C', 'description' => 'Category C Documents', 'status' => 'active']
];

try {
    require_once __DIR__ . '/../config/constants.php';
    require_once __DIR__ . '/../utils/ResponseHandler.php';
    
    // Get database connection
    $conn = require __DIR__ . '/../config/database.php';
    
    if (!$conn || $conn->connect_error) {
        // Return fallback data if database unavailable
        echo json_encode(['success' => true, 'data' => $fallbackCategories, 'message' => 'Using fallback data']);
        exit;
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        try {
            $sql = "SELECT id, category_name, description, status FROM document_categories WHERE status = 'active' ORDER BY category_name";
            $result = $conn->query($sql);
            if (!$result) {
                echo json_encode(['success' => true, 'data' => $fallbackCategories, 'message' => 'Using fallback data']);
                exit;
            }
            $categories = [];
            while ($row = $result->fetch_assoc()) {
                $categories[] = $row;
            }
            if (empty($categories)) {
                echo json_encode(['success' => true, 'data' => $fallbackCategories, 'message' => 'Using fallback data']);
            } else {
                echo json_encode(['success' => true, 'data' => $categories, 'message' => 'Categories retrieved']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => true, 'data' => $fallbackCategories, 'message' => 'Using fallback data']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => true, 'data' => $fallbackCategories, 'message' => 'Using fallback data']);
}
?>
