<?php
// api/models/AuditLogModel.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/auditLogger.php';

class AuditLogModel
{
    public static function queryLogs(array $filters = [], int $page = 1, int $limit = 25): array
    {
        $offset = max(0, ($page - 1) * $limit);
        $where = [];
        $params = [];

        // Search text (description, entity_id, or username)
        if (!empty($filters['search'])) {
            $term = '%' . trim($filters['search']) . '%';
            $where[] = "(a.description ILIKE ? OR a.entity_id ILIKE ? OR a.username ILIKE ?)";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        // Filter by user ID
        if (!empty($filters['userId'])) {
            $where[] = "a.user_id = ?";
            $params[] = (int)$filters['userId'];
        }

        // Filter by module
        if (!empty($filters['module']) && $filters['module'] !== 'all') {
            $where[] = "a.module = ?";
            $params[] = strtolower(trim($filters['module']));
        }

        // Filter by action
        if (!empty($filters['action']) && $filters['action'] !== 'all') {
            $where[] = "a.action = ?";
            $params[] = strtoupper(trim($filters['action']));
        }

        // Filter by date range
        if (!empty($filters['startDate'])) {
            $where[] = "a.created_at >= ?::timestamptz";
            $params[] = $filters['startDate'] . ' 00:00:00';
        }
        if (!empty($filters['endDate'])) {
            $where[] = "a.created_at <= ?::timestamptz";
            $params[] = $filters['endDate'] . ' 23:59:59.999';
        }

        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

        $countRow = get("SELECT COUNT(*) as total FROM audit_logs a $whereClause", $params);
        $total = (int)($countRow['total'] ?? 0);

        $sql = "SELECT a.id, a.user_id, a.username, a.user_role, a.action, a.module, 
                       a.entity_id, a.description, a.changes, a.ip_address, a.user_agent, a.created_at,
                       u.full_name as user_name, u.avatar_url
                FROM audit_logs a
                LEFT JOIN users u ON a.user_id = u.id
                $whereClause
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?";

        $queryParams = array_merge($params, [$limit, $offset]);
        $rows = all($sql, $queryParams);

        $logs = array_map(function($r) {
            $changesDecoded = null;
            if (!empty($r['changes'])) {
                $changesDecoded = is_string($r['changes']) ? json_decode($r['changes'], true) : $r['changes'];
            }

            return [
                'id' => (int)$r['id'],
                'userId' => $r['user_id'] ? (int)$r['user_id'] : null,
                'username' => $r['username'] ?: 'system',
                'userName' => $r['user_name'] ?: ($r['username'] ?: 'System'),
                'userRole' => $r['user_role'] ?: 'system',
                'avatar' => $r['avatar_url'] ?: null,
                'action' => $r['action'],
                'module' => $r['module'],
                'entityId' => $r['entity_id'],
                'description' => $r['description'],
                'changes' => $changesDecoded,
                'ipAddress' => $r['ip_address'],
                'userAgent' => $r['user_agent'],
                'createdAt' => $r['created_at'],
            ];
        }, $rows);

        return [
            'logs' => $logs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => ceil($total / $limit) ?: 1,
            ]
        ];
    }

    public static function getStats(): array
    {
        $todayRow = get("SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= CURRENT_DATE");
        $todayCount = (int)($todayRow['count'] ?? 0);

        $weekRow = get("SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= NOW() - INTERVAL '7 days'");
        $weekCount = (int)($weekRow['count'] ?? 0);

        $activeUsersRow = get("SELECT COUNT(DISTINCT user_id) as count FROM audit_logs WHERE created_at >= CURRENT_DATE AND user_id IS NOT NULL");
        $activeUsersCount = (int)($activeUsersRow['count'] ?? 0);

        $modulesBreakdown = all(
            "SELECT module, COUNT(*) as count 
             FROM audit_logs 
             WHERE created_at >= NOW() - INTERVAL '7 days'
             GROUP BY module 
             ORDER BY count DESC 
             LIMIT 8"
        );

        $actionsBreakdown = all(
            "SELECT action, COUNT(*) as count 
             FROM audit_logs 
             WHERE created_at >= NOW() - INTERVAL '7 days'
             GROUP BY action 
             ORDER BY count DESC 
             LIMIT 8"
        );

        return [
            'todayActions' => $todayCount,
            'weekActions' => $weekCount,
            'activeUsersToday' => $activeUsersCount,
            'modulesBreakdown' => $modulesBreakdown,
            'actionsBreakdown' => $actionsBreakdown,
        ];
    }

    public static function getExportData(array $filters = []): array
    {
        $where = [];
        $params = [];

        if (!empty($filters['search'])) {
            $term = '%' . trim($filters['search']) . '%';
            $where[] = "(a.description ILIKE ? OR a.entity_id ILIKE ? OR a.username ILIKE ?)";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        if (!empty($filters['userId'])) {
            $where[] = "a.user_id = ?";
            $params[] = (int)$filters['userId'];
        }

        if (!empty($filters['module']) && $filters['module'] !== 'all') {
            $where[] = "a.module = ?";
            $params[] = strtolower(trim($filters['module']));
        }

        if (!empty($filters['action']) && $filters['action'] !== 'all') {
            $where[] = "a.action = ?";
            $params[] = strtoupper(trim($filters['action']));
        }

        if (!empty($filters['startDate'])) {
            $where[] = "a.created_at >= ?::timestamptz";
            $params[] = $filters['startDate'] . ' 00:00:00';
        }
        if (!empty($filters['endDate'])) {
            $where[] = "a.created_at <= ?::timestamptz";
            $params[] = $filters['endDate'] . ' 23:59:59.999';
        }

        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

        $sql = "SELECT a.id, a.created_at, a.username, a.user_role, a.action, a.module, 
                       a.entity_id, a.description, a.ip_address
                FROM audit_logs a
                $whereClause
                ORDER BY a.created_at DESC
                LIMIT 5000";

        return all($sql, $params);
    }
}

