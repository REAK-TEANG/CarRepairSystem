<?php
// api/models/SessionModel.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/headers.php';
require_once __DIR__ . '/../utils/auditLogger.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class SessionModel
{
    /**
     * Detect device type based on user agent string
     */
    public static function detectDeviceType(string $userAgent): string
    {
        $ua = strtolower($userAgent);
        if (str_contains($ua, 'ipad') || str_contains($ua, 'tablet') || (str_contains($ua, 'android') && !str_contains($ua, 'mobile'))) {
            return 'Tablet';
        }
        if (str_contains($ua, 'mobile') || str_contains($ua, 'iphone') || str_contains($ua, 'android') || str_contains($ua, 'phone')) {
            return 'Mobile';
        }
        return 'Desktop';
    }

    /**
     * Create new session on login
     */
    public static function createSession(int $userId, string $token, string $currentRoute = '/'): ?int
    {
        $tokenHash = hash('sha256', $token);
        $ip = AuditLogger::getClientIp();
        $userAgent = AuditLogger::getUserAgent();
        $deviceType = self::detectDeviceType($userAgent);

        try {
            // Close old sessions from the same token if already exists
            run(
                "INSERT INTO user_sessions (
                    session_token_hash, user_id, ip_address, user_agent, device_type,
                    current_route, status, login_at, last_activity_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW(), NOW(), NOW())
                ON CONFLICT (session_token_hash) DO UPDATE SET
                    status = 'active',
                    last_activity_at = NOW(),
                    current_route = EXCLUDED.current_route,
                    updated_at = NOW()",
                [$tokenHash, $userId, $ip, $userAgent, $deviceType, $currentRoute]
            );

            $row = get("SELECT id FROM user_sessions WHERE session_token_hash = ?", [$tokenHash]);
            return (int)($row['id'] ?? 0);
        } catch (Throwable $e) {
            error_log("SessionModel::createSession error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Heartbeat telemetry ping from active client
     */
    public static function heartbeat(string $token, string $currentRoute = '/'): array
    {
        $tokenHash = hash('sha256', $token);

        $session = get("SELECT id, status, user_id FROM user_sessions WHERE session_token_hash = ?", [$tokenHash]);
        if (!$session) {
            return ['valid' => false, 'reason' => 'session_not_found'];
        }

        if ($session['status'] === 'revoked') {
            return ['valid' => false, 'reason' => 'admin_revoked'];
        }

        run(
            "UPDATE user_sessions 
             SET last_activity_at = NOW(), 
                 current_route = ?, 
                 status = 'active', 
                 updated_at = NOW() 
             WHERE session_token_hash = ? AND status IN ('active', 'idle')",
            [$currentRoute, $tokenHash]
        );

        return ['valid' => true, 'sessionId' => $session['id']];
    }

    /**
     * Record explicit logout or browser window/tab close
     */
    public static function closeSession(string $token, string $closeReason = 'manual_logout'): bool
    {
        $tokenHash = hash('sha256', $token);

        $res = run(
            "UPDATE user_sessions 
             SET status = 'closed', 
                 close_reason = ?, 
                 logout_at = NOW(), 
                 updated_at = NOW() 
             WHERE session_token_hash = ? AND status IN ('active', 'idle')",
            [$closeReason, $tokenHash]
        );

        return ($res['rowCount'] ?? 0) > 0;
    }

    /**
     * Routine maintenance: marks abandoned sessions as timed out
     */
    public static function cleanupStaleSessions(): void
    {
        try {
            // Sessions with no heartbeat for > 15 minutes are marked timed_out
            run(
                "UPDATE user_sessions 
                 SET status = 'timed_out', 
                     close_reason = 'session_timeout', 
                     logout_at = last_activity_at, 
                     updated_at = NOW() 
                 WHERE status IN ('active', 'idle') 
                   AND last_activity_at < NOW() - INTERVAL '15 minutes'"
            );
        } catch (Throwable $e) {
            error_log("cleanupStaleSessions warning: " . $e->getMessage());
        }
    }

    /**
     * Get all active and idle sessions for Admin monitoring
     */
    public static function getActiveSessions(): array
    {
        self::cleanupStaleSessions();

        $rows = all(
            "SELECT s.id, s.session_token_hash, s.user_id, s.ip_address, s.user_agent, s.device_type,
                    s.current_route,
                    CASE 
                        WHEN s.last_activity_at < NOW() - INTERVAL '3 minutes' THEN 'idle'
                        ELSE 'active'
                    END as computed_status,
                    s.login_at, s.last_activity_at,
                    ROUND(EXTRACT(EPOCH FROM (NOW() - s.last_activity_at))) as seconds_since_activity,
                    ROUND(EXTRACT(EPOCH FROM (NOW() - s.login_at))) as session_duration_seconds,
                    u.username, u.full_name as name, u.email, u.avatar_url,
                    r.name as role_name
             FROM user_sessions s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE s.status IN ('active', 'idle')
             ORDER BY s.last_activity_at DESC"
        );

        return array_map(function($r) {
            return [
                'id' => (int)$r['id'],
                'userId' => (int)$r['user_id'],
                'username' => $r['username'],
                'name' => $r['name'],
                'email' => $r['email'],
                'avatar' => $r['avatar_url'] ?: null,
                'role' => strtolower(preg_replace('/\s+/', '_', $r['role_name'] ?: 'Staff')),
                'roleTitle' => $r['role_name'] ?: 'Staff',
                'ipAddress' => $r['ip_address'],
                'userAgent' => $r['user_agent'],
                'deviceType' => $r['device_type'],
                'currentRoute' => $r['current_route'],
                'status' => $r['computed_status'],
                'loginAt' => $r['login_at'],
                'lastActivityAt' => $r['last_activity_at'],
                'secondsSinceActivity' => (int)$r['seconds_since_activity'],
                'durationSeconds' => (int)$r['session_duration_seconds'],
            ];
        }, $rows);
    }

    /**
     * Get paginated session history
     */
    public static function getSessionHistory(int $page = 1, int $limit = 20, ?int $userId = null): array
    {
        self::cleanupStaleSessions();

        $offset = max(0, ($page - 1) * $limit);
        $where = [];
        $params = [];

        if ($userId) {
            $where[] = "s.user_id = ?";
            $params[] = $userId;
        }

        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

        $countRow = get("SELECT COUNT(*) as total FROM user_sessions s $whereClause", $params);
        $total = (int)($countRow['total'] ?? 0);

        $sql = "SELECT s.id, s.user_id, s.ip_address, s.user_agent, s.device_type,
                       s.current_route, s.status, s.close_reason, s.login_at, s.last_activity_at, s.logout_at,
                       ROUND(EXTRACT(EPOCH FROM (COALESCE(s.logout_at, s.last_activity_at) - s.login_at))) as duration_seconds,
                       u.username, u.full_name as name, u.avatar_url,
                       r.name as role_name
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN roles r ON u.role_id = r.id
                $whereClause
                ORDER BY s.login_at DESC
                LIMIT ? OFFSET ?";

        $queryParams = array_merge($params, [$limit, $offset]);
        $rows = all($sql, $queryParams);

        $sessions = array_map(function($r) {
            return [
                'id' => (int)$r['id'],
                'userId' => (int)$r['user_id'],
                'username' => $r['username'],
                'name' => $r['name'],
                'avatar' => $r['avatar_url'] ?: null,
                'role' => strtolower(preg_replace('/\s+/', '_', $r['role_name'] ?: 'Staff')),
                'roleTitle' => $r['role_name'] ?: 'Staff',
                'ipAddress' => $r['ip_address'],
                'userAgent' => $r['user_agent'],
                'deviceType' => $r['device_type'],
                'currentRoute' => $r['current_route'],
                'status' => $r['status'],
                'closeReason' => $r['close_reason'],
                'loginAt' => $r['login_at'],
                'lastActivityAt' => $r['last_activity_at'],
                'logoutAt' => $r['logout_at'],
                'durationSeconds' => max(0, (int)$r['duration_seconds']),
            ];
        }, $rows);

        return [
            'sessions' => $sessions,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => ceil($total / $limit) ?: 1,
            ]
        ];
    }

    /**
     * Terminate / Revoke session by Admin (Kill Switch)
     */
    public static function revokeSession(int $sessionId, array $adminUser): bool
    {

        $session = get(
            "SELECT s.*, u.username, u.full_name 
             FROM user_sessions s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.id = ?",
            [$sessionId]
        );

        if (!$session) {
            return false;
        }

        // 1. Mark session as revoked
        run(
            "UPDATE user_sessions 
             SET status = 'revoked', 
                 close_reason = 'admin_revoked', 
                 logout_at = NOW(), 
                 updated_at = NOW() 
             WHERE id = ?",
            [$sessionId]
        );

        // 2. Blacklist the token hash in token_blacklist so immediate requests fail
        try {
            $tokenHash = $session['session_token_hash'];
            run(
                "INSERT INTO token_blacklist (token_hash, expires_at) 
                 VALUES (?, NOW() + INTERVAL '24 hours') 
                 ON CONFLICT (token_hash) DO NOTHING",
                [$tokenHash]
            );
        } catch (Throwable $e) {
            error_log("Failed to insert into token_blacklist: " . $e->getMessage());
        }

        // 3. Log the administrative revocation in audit logs
        AuditLogger::log(
            'REVOKE_SESSION',
            'auth',
            "Administrator {$adminUser['name']} (@{$adminUser['username']}) terminated active session #$sessionId for user {$session['full_name']} (@{$session['username']})",
            (string)$sessionId,
            [
                'target_user_id' => $session['user_id'],
                'target_username' => $session['username'],
                'ip_address' => $session['ip_address'],
                'device_type' => $session['device_type'],
            ],
            $adminUser['id'],
            $adminUser['username'],
            $adminUser['role']
        );

        return true;
    }
}

