<?php
// api/utils/auditLogger.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/clientIp.php';

class AuditLogger
{
    /**
     * Resolve device / user agent
     */
    public static function getUserAgent(): string
    {
        return substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown Agent', 0, 500);
    }

    /**
     * Log an action to the audit trail
     */
    public static function log(
        string $action,
        string $module,
        string $description,
        ?string $entityId = null,
        ?array $changes = null,
        ?int $userId = null,
        ?string $username = null,
        ?string $role = null
    ): void {
        try {
            // Auto-resolve user identity from JWT payload if not explicitly supplied
            if ($userId === null && class_exists('AuthMiddleware')) {
                $token = getBearerToken();
                if ($token) {
                    $secret = getJwtSecret();
                    $payload = JWT::decode($token, $secret);
                    if ($payload) {
                        $userId = $payload['id'] ?? null;
                        $username = $payload['username'] ?? null;
                        $role = $payload['role'] ?? null;
                    }
                }
            }

            $ip = clientIp();
            $agent = self::getUserAgent();
            $jsonChanges = $changes !== null ? json_encode($changes, JSON_UNESCAPED_UNICODE) : null;

            run(
                "INSERT INTO audit_logs (
                    user_id, username, user_role, action, module, 
                    entity_id, description, changes, ip_address, user_agent, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, NOW())",
                [
                    $userId,
                    $username,
                    $role,
                    strtoupper(trim($action)),
                    strtolower(trim($module)),
                    $entityId ? (string)$entityId : null,
                    $description,
                    $jsonChanges,
                    $ip,
                    $agent
                ]
            );
        } catch (Throwable $e) {
            error_log("AuditLogger::log failed non-fatally: " . $e->getMessage());
        }
    }
}

