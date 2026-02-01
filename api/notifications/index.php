<?php
/**
 * Notifications API Endpoint
 * Provides notifications for employees
 * v1.0 - Fallback implementation with sample data
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$requestMethod = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : 'list';

switch ($requestMethod) {
    case 'GET':
        if ($action === 'single' && isset($_GET['id'])) {
            handleGetSingle($_GET['id']);
        } else {
            handleGetList();
        }
        break;
    case 'PUT':
        if (isset($_GET['id'])) {
            handleMarkAsRead($_GET['id']);
        }
        break;
    case 'DELETE':
        if (isset($_GET['id'])) {
            handleDelete($_GET['id']);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}

/**
 * Handle GET list of notifications
 */
function handleGetList() {
    $fallbackNotifications = [
        [
            'id' => 'NOTIF001',
            'type' => 'leave',
            'title' => 'Leave Request Approved',
            'message' => 'Your leave request for January 15-17, 2026 has been approved by your manager.',
            'icon' => '📅',
            'read' => false,
            'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
            'action_url' => '?section=leave',
            'priority' => 'high'
        ],
        [
            'id' => 'NOTIF002',
            'type' => 'payroll',
            'title' => 'Payslip Generated',
            'message' => 'Your payslip for January 2026 is now available for download.',
            'icon' => '💳',
            'read' => false,
            'created_at' => date('Y-m-d H:i:s', strtotime('-4 hours')),
            'action_url' => '?section=payslips',
            'priority' => 'medium'
        ],
        [
            'id' => 'NOTIF003',
            'type' => 'hmo',
            'title' => 'HMO Claim Processed',
            'message' => 'Your medical claim #CLM-2026-001 has been processed successfully.',
            'icon' => '🏥',
            'read' => false,
            'created_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
            'action_url' => '?section=hmo-claims',
            'priority' => 'medium'
        ],
        [
            'id' => 'NOTIF004',
            'type' => 'approval',
            'title' => 'Document Approval Required',
            'message' => 'Employee Juan Santos requires your approval for certification document submission.',
            'icon' => '📋',
            'read' => true,
            'created_at' => date('Y-m-d H:i:s', strtotime('-2 days')),
            'action_url' => '?section=hrcore-documents',
            'priority' => 'high'
        ],
        [
            'id' => 'NOTIF005',
            'type' => 'system',
            'title' => 'System Maintenance Scheduled',
            'message' => 'The system will undergo maintenance on January 31, 2026 from 10 PM to 12 AM.',
            'icon' => '⚙️',
            'read' => true,
            'created_at' => date('Y-m-d H:i:s', strtotime('-3 days')),
            'action_url' => null,
            'priority' => 'low'
        ],
        [
            'id' => 'NOTIF006',
            'type' => 'compensation',
            'title' => 'Salary Grade Updated',
            'message' => 'A new salary grade structure has been implemented. Review the compensation module for details.',
            'icon' => '💰',
            'read' => true,
            'created_at' => date('Y-m-d H:i:s', strtotime('-5 days')),
            'action_url' => '?section=compensation',
            'priority' => 'medium'
        ],
        [
            'id' => 'NOTIF007',
            'type' => 'leave',
            'title' => 'Leave Balance Updated',
            'message' => 'Your leave balance has been updated. You now have 15 days remaining for 2026.',
            'icon' => '📅',
            'read' => true,
            'created_at' => date('Y-m-d H:i:s', strtotime('-1 week')),
            'action_url' => null,
            'priority' => 'low'
        ],
        [
            'id' => 'NOTIF008',
            'type' => 'system',
            'title' => 'New System Feature Available',
            'message' => 'Check out the new HR Analytics Dashboard for advanced workforce insights.',
            'icon' => '📊',
            'read' => true,
            'created_at' => date('Y-m-d H:i:s', strtotime('-10 days')),
            'action_url' => '?section=analytics-dashboard',
            'priority' => 'low'
        ]
    ];

    // Get pagination parameters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $per_page = isset($_GET['per_page']) ? min(50, intval($_GET['per_page'])) : 10;
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';

    // Apply filter
    $filtered = $fallbackNotifications;
    if ($filter === 'unread') {
        $filtered = array_filter($fallbackNotifications, fn($n) => !$n['read']);
    } elseif ($filter === 'read') {
        $filtered = array_filter($fallbackNotifications, fn($n) => $n['read']);
    }

    // Count unread
    $unread_count = count(array_filter($fallbackNotifications, fn($n) => !$n['read']));

    // Pagination
    $total = count($filtered);
    $total_pages = ceil($total / $per_page);
    $offset = ($page - 1) * $per_page;
    $paginated = array_slice(array_values($filtered), $offset, $per_page);

    echo json_encode([
        'success' => true,
        'data' => $paginated,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $per_page,
            'total' => $total,
            'total_pages' => $total_pages
        ],
        'unread_count' => $unread_count
    ]);
}

/**
 * Handle GET single notification
 */
function handleGetSingle($id) {
    $notifications = [
        'NOTIF001' => [
            'id' => 'NOTIF001',
            'type' => 'leave',
            'title' => 'Leave Request Approved',
            'message' => 'Your leave request for January 15-17, 2026 has been approved by your manager.',
            'details' => 'This is an approved leave request. You can now plan your time off accordingly.',
            'icon' => '📅',
            'read' => false,
            'created_at' => date('Y-m-d H:i:s'),
            'action_url' => '?section=leave'
        ]
    ];

    if (isset($notifications[$id])) {
        echo json_encode(['success' => true, 'data' => $notifications[$id]]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Notification not found']);
    }
}

/**
 * Handle marking notification as read
 */
function handleMarkAsRead($id) {
    // In a real implementation, this would update the database
    echo json_encode([
        'success' => true,
        'message' => 'Notification marked as read',
        'data' => [
            'id' => $id,
            'read' => true
        ]
    ]);
}

/**
 * Handle deleting notification
 */
function handleDelete($id) {
    // In a real implementation, this would delete from database
    echo json_encode([
        'success' => true,
        'message' => 'Notification deleted',
        'data' => [
            'id' => $id,
            'deleted' => true
        ]
    ]);
}
