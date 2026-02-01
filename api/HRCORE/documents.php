<?php
/**
 * Employee Documents Management Endpoints
 * CRUD operations for employee documents
 * Returns fallback sample data by default
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

// Fallback sample documents
$fallbackDocuments = [
    [
        'id' => 'DOC001',
        'employee_id' => '9001',
        'first_name' => 'Maria',
        'last_name' => 'Cruz',
        'employee_number' => '9001',
        'document_title' => 'PRC License - Physician',
        'category_name' => 'Category A',
        'category_id' => '1',
        'module' => 'HR1',
        'uploaded_by' => 'HR Admin',
        'upload_date' => '2025-10-11',
        'status' => 'Active'
    ],
    [
        'id' => 'DOC002',
        'employee_id' => '9001',
        'first_name' => 'Maria',
        'last_name' => 'Cruz',
        'employee_number' => '9001',
        'document_title' => 'Diploma - Doctor of Medicine',
        'category_name' => 'Category A',
        'category_id' => '1',
        'module' => 'HR1',
        'uploaded_by' => 'HR Admin',
        'upload_date' => '2025-10-11',
        'status' => 'Active'
    ],
    [
        'id' => 'DOC003',
        'employee_id' => '9001',
        'first_name' => 'Maria',
        'last_name' => 'Cruz',
        'employee_number' => '9001',
        'document_title' => 'NBI Clearance',
        'category_name' => 'Category B',
        'category_id' => '2',
        'module' => 'HR1',
        'uploaded_by' => 'HR Admin',
        'upload_date' => '2025-10-11',
        'status' => 'Active'
    ],
    [
        'id' => 'DOC004',
        'employee_id' => '9001',
        'first_name' => 'Maria',
        'last_name' => 'Cruz',
        'employee_number' => '9001',
        'document_title' => 'Medical Certificate - Pre-Employment',
        'category_name' => 'Category B',
        'category_id' => '2',
        'module' => 'HR1',
        'uploaded_by' => 'HR Admin',
        'upload_date' => '2025-10-11',
        'status' => 'Active'
    ],
    [
        'id' => 'DOC005',
        'employee_id' => '9001',
        'first_name' => 'Maria',
        'last_name' => 'Cruz',
        'employee_number' => '9001',
        'document_title' => 'ACLS Certificate',
        'category_name' => 'Category C',
        'category_id' => '3',
        'module' => 'HR2',
        'uploaded_by' => 'Training Dept',
        'upload_date' => '2025-10-11',
        'status' => 'Active'
    ],
    [
        'id' => 'DOC006',
        'employee_id' => '9001',
        'first_name' => 'Maria',
        'last_name' => 'Cruz',
        'employee_number' => '9001',
        'document_title' => 'BLS Certificate',
        'category_name' => 'Category C',
        'category_id' => '3',
        'module' => 'HR2',
        'uploaded_by' => 'Training Dept',
        'upload_date' => '2025-10-11',
        'status' => 'Active'
    ],
    [
        'id' => 'DOC007',
        'employee_id' => '9001',
        'first_name' => 'Maria',
        'last_name' => 'Cruz',
        'employee_number' => '9001',
        'document_title' => 'Cardiology Board Certification',
        'category_name' => 'Category C',
        'category_id' => '3',
        'module' => 'HR2',
        'uploaded_by' => 'Medical Staff',
        'upload_date' => '2025-10-11',
        'status' => 'Active'
    ],
    [
        'id' => 'DOC008',
        'employee_id' => '9002',
        'first_name' => 'Juan',
        'last_name' => 'Santos',
        'employee_number' => '9002',
        'document_title' => 'Nursing License',
        'category_name' => 'Category A',
        'category_id' => '1',
        'module' => 'HR1',
        'uploaded_by' => 'HR Admin',
        'upload_date' => '2025-10-10',
        'status' => 'Active'
    ],
    [
        'id' => 'DOC009',
        'employee_id' => '9002',
        'first_name' => 'Juan',
        'last_name' => 'Santos',
        'employee_number' => '9002',
        'document_title' => 'NBI Clearance',
        'category_name' => 'Category B',
        'category_id' => '2',
        'module' => 'HR1',
        'uploaded_by' => 'HR Admin',
        'upload_date' => '2025-10-10',
        'status' => 'Active'
    ],
    [
        'id' => 'DOC010',
        'employee_id' => '9003',
        'first_name' => 'Ana',
        'last_name' => 'Rodriguez',
        'employee_number' => '9003',
        'document_title' => 'Pharmacy Degree',
        'category_name' => 'Category A',
        'category_id' => '1',
        'module' => 'HR1',
        'uploaded_by' => 'HR Admin',
        'upload_date' => '2025-10-09',
        'status' => 'Active'
    ]
];

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    $employeeId = isset($_GET['employee_id']) ? $_GET['employee_id'] : null;

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single document
                $found = false;
                foreach ($fallbackDocuments as $doc) {
                    if ($doc['id'] === $id) {
                        echo json_encode(['success' => true, 'data' => $doc]);
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Document not found']);
                }
            } else {
                // List documents
                $filtered = $fallbackDocuments;
                
                // Filter by employee if specified
                if ($employeeId) {
                    $filtered = array_filter($filtered, function($doc) use ($employeeId) {
                        return $doc['employee_id'] === $employeeId;
                    });
                }
                
                echo json_encode(['success' => true, 'data' => array_values($filtered)]);
            }
            break;
            
        case 'POST':
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Document created (fallback)']);
            break;
            
        case 'PUT':
        case 'PATCH':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Document ID is required']);
            } else {
                echo json_encode(['success' => true, 'message' => 'Document updated (fallback)']);
            }
            break;
            
        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Document ID is required']);
            } else {
                echo json_encode(['success' => true, 'message' => 'Document deleted (fallback)']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
