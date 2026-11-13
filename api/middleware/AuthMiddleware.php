<?php
// api/middleware/AuthMiddleware.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/headers.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/cache.php';

class AuthMiddleware
{
    private const BLACKLIST_NEGATIVE_TTL = 30;   // seconds a "not revoked" answer is reused
    private const PERMISSIONS_CACHE_KEY = 'roles_permissions_matrix';
    private const PERMISSIONS_CACHE_TTL = 60;


    /**
     * Default Role-Permissions Matrix (Single Source of Truth fallback)
     * Matches specifications in rbac_roles_permissions.md
     */
    private const DEFAULT_PERMISSIONS = [
        'customers' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'export'],
            'service_advisor' => ['create', 'read', 'update', 'delete', 'export'],
            'mechanic'        => ['read'],
            'cashier'         => ['create', 'read', 'update'],
            'storekeeper'     => [],
        ],
        'vehicles' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'export'],
            'service_advisor' => ['create', 'read', 'update', 'delete', 'export'],
            'mechanic'        => ['read'],
            'cashier'         => ['create', 'read', 'update'],
            'storekeeper'     => [],
        ],
        'appointments' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'delete', 'export'],
            'service_advisor' => ['create', 'read', 'update', 'delete', 'export'],
            'mechanic'        => ['read'],
            'cashier'         => ['create', 'read', 'update'],
            'storekeeper'     => [],
        ],
        'repair_jobs' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'delete', 'export'],
            'service_advisor' => ['create', 'read', 'update', 'export'],
            'mechanic'        => ['read', 'update'],
            'cashier'         => ['read'],
            'storekeeper'     => ['read'],
        ],
        'services' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'export'],
            'service_advisor' => ['read'],
            'mechanic'        => ['read'],
            'cashier'         => ['read'],
            'storekeeper'     => [],
        ],
        'mechanics' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'export'],
            'service_advisor' => ['read'],
            'mechanic'        => ['read'],
            'cashier'         => [],
            'storekeeper'     => [],
        ],
        'inventory' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'export'],
            'service_advisor' => ['read'],
            'mechanic'        => ['read'],
            'cashier'         => [],
            'storekeeper'     => ['create', 'read', 'update', 'delete', 'export'],
        ],
        'suppliers' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'export'],
            'service_advisor' => [],
            'mechanic'        => [],
            'cashier'         => [],
            'storekeeper'     => ['create', 'read', 'update', 'delete', 'export'],
        ],
        'invoices' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'delete', 'export'],
            'service_advisor' => ['create', 'read', 'export'],
            'mechanic'        => [],
            'cashier'         => ['create', 'read', 'update', 'export'],
            'storekeeper'     => [],
        ],
        'employees' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'delete', 'export'],
            'service_advisor' => ['read'],
            'mechanic'        => ['read'],
            'cashier'         => ['read'],
            'storekeeper'     => ['read'],
        ],
        'reports' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['read', 'export'],
            'service_advisor' => ['read'],
            'mechanic'        => [],
            'cashier'         => ['read', 'export'],
            'storekeeper'     => ['read', 'export'],
        ],
        'settings' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['read'],
            'service_advisor' => [],
            'mechanic'        => [],
            'cashier'         => [],
            'storekeeper'     => [],
        ],
        'service_reminders' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'export'],
            'service_advisor' => ['create', 'read', 'update', 'delete', 'export'],
            'mechanic'        => ['read'],
            'cashier'         => ['read'],
            'storekeeper'     => [],
        ],
    ];

    public static function getDefaultPermissions(): array
    {
        return self::DEFAULT_PERMISSIONS;
    }

    /**
     * Add token to blacklist (revocation upon logout)
     */
    public static function blacklistToken(string $token, int $ttl = 86400): void
    {
        $hash = hash('sha256', $token);
        $ttl = max(60, $ttl);

        // Make revocation visible immediately in the cache tier(s)
        Cache::store("token_blacklist:$hash", true, $ttl);

        // Persist so revocation survives restarts and other instances
        try {
            run(
                "INSERT INTO token_blacklist (token_hash, expires_at)
                 VALUES (?, NOW() + (? || ' seconds')::interval)
                 ON CONFLICT (token_hash) DO NOTHING",
                [$hash, (string) $ttl]
            );

            // Periodic cleanup of expired tokens (1 in 50 chance)
            if (mt_rand(1, 50) === 1) {
                run("DELETE FROM token_blacklist WHERE expires_at < NOW()");
            }
        } catch (Throwable $e) {
            error_log("PostgreSQL token blacklist error: " . $e->getMessage());
        }
    }

    /**
     * Check if a token has been revoked / blacklisted.
     * "Not revoked" is cached briefly so repeated requests skip the database;
     * revocations are written to the cache immediately by blacklistToken().
     */
    public static function isTokenBlacklisted(string $token): bool
    {
        $key = 'token_blacklist:' . hash('sha256', $token);

        $cached = Cache::fetch($key, $hit);
        if ($hit) {
            return (bool) $cached;
        }

        try {
            $row = get(
                "SELECT 1 FROM token_blacklist WHERE token_hash = ? AND expires_at > NOW() LIMIT 1",
                [hash('sha256', $token)]
            );
            $revoked = !empty($row);
        } catch (Throwable $e) {
            error_log("PostgreSQL token blacklist check error: " . $e->getMessage());
            return false;
        }

        Cache::store($key, $revoked, self::BLACKLIST_NEGATIVE_TTL);
        return $revoked;
    }

    /**
     * Validate Bearer token and return decoded payload.
     * Terminates execution with 401 if the token is absent, invalid, or revoked.
     */
    public static function requireAuth(): array
    {
        $token = getBearerToken();

        if (!$token) {
            http_response_code(401);
            echo json_encode([
                'error'   => 'Unauthorized',
                'message' => 'No authorization token provided'
            ]);
            exit;
        }

        // Check if token was logged out or revoked
        if (self::isTokenBlacklisted($token)) {
            http_response_code(401);
            echo json_encode([
                'error'   => 'Unauthorized',
                'message' => 'Token has been revoked. Please log in again.',
                'code'    => 'TOKEN_REVOKED'
            ]);
            exit;
        }

        $secret = getJwtSecret();

        $payload = JWT::decode($token, $secret);
        if (!$payload) {
            http_response_code(401);
            echo json_encode([
                'error'   => 'Unauthorized',
                'message' => 'Invalid or expired token'
            ]);
            exit;
        }

        return $payload;
    }

    /**
     * Require admin role specifically. Terminates with 403 if not admin.
     */
    public static function requireAdmin(array $payload): void
    {
        if (($payload['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode([
                'error'   => 'Forbidden',
                'message' => 'Administrator access required'
            ]);
            exit;
        }
    }

    /** Drop the cached permissions matrix after it is edited. */
    public static function forgetPermissionsMatrix(): void
    {
        Cache::delete(self::PERMISSIONS_CACHE_KEY);
    }

    /**
     * Role-Based Access Control (RBAC) Enforcement
     * Checks if the authenticated user's role has permission for $module and $action.
     * Terminates execution with 403 Forbidden if not permitted.
     *
     * @param string $module Target domain module (e.g. 'customers', 'repair_jobs', 'inventory', etc.)
     * @param string $action Requested action ('create', 'read', 'update', 'delete', 'export')
     * @param array $payload Decoded JWT payload
     */
    public static function authorize(string $module, string $action, array $payload): void
    {
        $userRole = strtolower($payload['role'] ?? '');

        // System Administrator has universal access
        if ($userRole === 'admin') {
            return;
        }

        // Module alias normalization
        $moduleMap = [
            'repairjobs'        => 'repair_jobs',
            'repair-jobs'       => 'repair_jobs',
            'repair_jobs'       => 'repair_jobs',
            'repair-orders'     => 'repair_jobs',
            'spare-parts'       => 'inventory',
            'spare_parts'       => 'inventory',
            'inventory'         => 'inventory',
            'service-reminders' => 'service_reminders',
            'service_reminders' => 'service_reminders',
            'servicereminders'  => 'service_reminders',
        ];

        $normModule = $moduleMap[strtolower($module)] ?? strtolower($module);
        $normAction = strtolower($action);

        // Dynamic permissions matrix (cached; invalidated when settings change)
        $matrix = Cache::remember(self::PERMISSIONS_CACHE_KEY, self::PERMISSIONS_CACHE_TTL, function () {
            try {
                $row = get("SELECT setting_value FROM settings WHERE setting_key = 'roles_permissions_matrix'");
                $decoded = ($row && !empty($row['setting_value'])) ? json_decode($row['setting_value'], true) : null;
                return is_array($decoded) ? $decoded : null;
            } catch (Throwable $e) {
                return null; // fall back to the static matrix
            }
        });

        // Determine effective allowed actions for this role
        $allowedActions = [];
        if ($matrix && isset($matrix[$normModule][$userRole]) && is_array($matrix[$normModule][$userRole])) {
            $allowedActions = $matrix[$normModule][$userRole];
        } else if (isset(self::DEFAULT_PERMISSIONS[$normModule][$userRole])) {
            $allowedActions = self::DEFAULT_PERMISSIONS[$normModule][$userRole];
        }

        if (in_array($normAction, $allowedActions, true)) {
            return; // Permitted
        }

        // Access Denied
        http_response_code(403);
        $roleTitle = $payload['roleTitle'] ?? ucfirst(str_replace('_', ' ', $userRole));
        echo json_encode([
            'error'   => 'Forbidden',
            'message' => "Your current role ('$roleTitle') does not have permission to {$normAction} {$normModule}."
        ]);
        exit;
    }
}
