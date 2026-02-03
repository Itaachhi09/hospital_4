<?php
/**
 * Compensation Dashboard API
 * HR4 Hospital HR Management System
 * 
 * Provides summary data for compensation dashboard
 * Returns: statistics, pending approvals, recent activities
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/constants.php';
$conn = require __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/ResponseHandler.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

try {
    $user = AuthMiddleware::verifyToken();

    $dashboard = [];

    // Get active compensation plans count
    $sql = "SELECT COUNT(*) as count FROM compensation_plans WHERE status = 'active'";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $dashboard['total_plans'] = $stmt->get_result()->fetch_assoc()['count'];

    // Get employees with compensation plans
    $sql = "SELECT COUNT(DISTINCT employee_id) as count FROM employee_compensation_assignments WHERE status = 'active'";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $dashboard['covered_employees'] = $stmt->get_result()->fetch_assoc()['count'];

    // Get pending salary adjustments
    $sql = "SELECT COUNT(*) as count FROM salary_adjustments WHERE approval_status = 'pending'";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $dashboard['pending_adjustments'] = $stmt->get_result()->fetch_assoc()['count'];

    // Get pending incentive approvals
    $sql = "SELECT COUNT(*) as count FROM incentive_issuances WHERE approval_status = 'pending'";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $dashboard['pending_incentives'] = $stmt->get_result()->fetch_assoc()['count'];

    // Get active pay bonds
    $sql = "SELECT COUNT(*) as count FROM pay_bonds WHERE bond_status IN ('active', 'draft')";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $dashboard['active_bonds'] = $stmt->get_result()->fetch_assoc()['count'];

    // Get total bond balance
    $sql = "SELECT COALESCE(SUM(remaining_balance), 0) as total FROM pay_bonds WHERE bond_status IN ('active', 'draft')";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $dashboard['total_bond_balance'] = (float)$stmt->get_result()->fetch_assoc()['total'];

    // Get recent adjustments
    $sql = "SELECT sa.id, sa.employee_id, e.employee_code, e.first_name, e.last_name, 
            sa.adjustment_type, sa.amount_adjusted, sa.approval_status, sa.created_at
            FROM salary_adjustments sa 
            JOIN employees e ON sa.employee_id = e.id 
            ORDER BY sa.created_at DESC LIMIT 5";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $dashboard['recent_adjustments'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Get recent incentives
    $sql = "SELECT ii.id, ii.employee_id, e.employee_code, e.first_name, e.last_name,
            it.name as incentive_type, ii.amount, ii.approval_status, ii.created_at
            FROM incentive_issuances ii 
            JOIN employees e ON ii.employee_id = e.id 
            JOIN incentive_types it ON ii.incentive_type_id = it.id
            ORDER BY ii.created_at DESC LIMIT 5";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $dashboard['recent_incentives'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Get pending approvals by type
    $sql = "SELECT 'salary_adjustment' as type, COUNT(*) as count FROM salary_adjustments WHERE approval_status = 'pending'
            UNION ALL
            SELECT 'incentive', COUNT(*) FROM incentive_issuances WHERE approval_status = 'pending'";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $dashboard['pending_by_type'] = [];
    foreach ($stmt->get_result()->fetch_all(MYSQLI_ASSOC) as $item) {
        if ($item['count'] > 0) {
            $dashboard['pending_by_type'][] = $item;
        }
    }

    http_response_code(200);
    echo json_encode(ResponseHandler::success($dashboard));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(ResponseHandler::error('Server error: ' . $e->getMessage()));
}
?>
