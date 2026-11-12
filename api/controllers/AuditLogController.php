<?php
// api/controllers/AuditLogController.php

require_once __DIR__ . '/../models/AuditLogModel.php';
require_once __DIR__ . '/../utils/sanitizer.php';

class AuditLogController
{
    /**
     * GET /api/audit-logs
     */
    public function index(array $authPayload): void
    {
        $role = strtolower($authPayload['role'] ?? '');
        if (!in_array($role, ['admin', 'manager'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden', 'message' => 'Admin or Manager role required']);
            return;
        }

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(5, min(100, (int)($_GET['limit'] ?? 25)));

        $filters = [
            'search' => trim($_GET['search'] ?? ''),
            'userId' => !empty($_GET['userId']) ? (int)$_GET['userId'] : null,
            'module' => trim($_GET['module'] ?? 'all'),
            'action' => trim($_GET['action'] ?? 'all'),
            'startDate' => trim($_GET['startDate'] ?? ''),
            'endDate' => trim($_GET['endDate'] ?? ''),
        ];

        $result = AuditLogModel::queryLogs($filters, $page, $limit);
        echo json_encode([
            'success' => true,
            'data' => $result['logs'],
            'pagination' => $result['pagination'],
        ]);
    }

    /**
     * GET /api/audit-logs/stats
     */
    public function stats(array $authPayload): void
    {
        $role = strtolower($authPayload['role'] ?? '');
        if (!in_array($role, ['admin', 'manager'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden', 'message' => 'Admin or Manager role required']);
            return;
        }

        $stats = AuditLogModel::getStats();
        echo json_encode(['success' => true, 'data' => $stats]);
    }

    /**
     * GET /api/audit-logs/export
     */
    public function export(array $authPayload): void
    {
        $role = strtolower($authPayload['role'] ?? '');
        if (!in_array($role, ['admin', 'manager'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden', 'message' => 'Admin or Manager role required']);
            return;
        }

        $format = strtolower(trim($_GET['format'] ?? 'csv'));
        $filters = [
            'search' => trim($_GET['search'] ?? ''),
            'userId' => !empty($_GET['userId']) ? (int)$_GET['userId'] : null,
            'module' => trim($_GET['module'] ?? 'all'),
            'action' => trim($_GET['action'] ?? 'all'),
            'startDate' => trim($_GET['startDate'] ?? ''),
            'endDate' => trim($_GET['endDate'] ?? ''),
        ];

        $rows = AuditLogModel::getExportData($filters);

        if ($format === 'json') {
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="audit_logs_' . date('Y-m-d_His') . '.json"');
            echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Default CSV Export
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="audit_logs_' . date('Y-m-d_His') . '.csv"');
        
        $output = fopen('php://output', 'w');
        // UTF-8 BOM for Microsoft Excel compatibility
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

        fputcsv($output, ['ID', 'Date & Time', 'Username', 'Role', 'Action', 'Module', 'Entity ID', 'Description', 'IP Address']);

        foreach ($rows as $row) {
            fputcsv($output, [
                $row['id'],
                $row['created_at'],
                $row['username'],
                $row['user_role'],
                $row['action'],
                $row['module'],
                $row['entity_id'] ?? '',
                $row['description'],
                $row['ip_address'] ?? '',
            ]);
        }

        fclose($output);
        exit;
    }
}

