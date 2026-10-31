<?php
// api/middleware/AuthMiddleware.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/headers.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/cache.php';

class AuthMiddleware
{
    private static $blacklistTableInitialized = false;

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
            'cashier'         => ['read'],
            'storekeeper'     => [],
        ],
        'vehicles' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'export'],
            'service_advisor' => ['create', 'read', 'update', 'delete', 'export'],
            'mechanic'        => ['read'],
            'cashier'         => ['read'],
            'storekeeper'     => [],
        ],
        'appointments' => [
            'admin'           => ['create', 'read', 'update', 'delete', 'export'],
            'manager'         => ['create', 'read', 'update', 'delete', 'export'],
            'service_advisor' => ['create', 'read', 'update', 'delete', 'export'],
            'mechanic'        => ['read'],
            'cashier'         => ['read'],
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
            'admin'           => ['read', 'export'],
            'manager'         => ['read', 'export'],
            'service_advisor' => ['read'],
            'mechanic'        => ['read'],
            'cashier'         => ['read'],
            'storekeeper'     => ['read'],
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

    /**
     * Ensure the token blacklist table exists in PostgreSQL
     */
    private static function initBlacklistTable(): void
    {
        if (self::$blacklistTableInitialized) return;
        global $pdo;
        try {
            if ($pdo) {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS token_blacklist (
                        id SERIAL PRIMARY KEY,
                        token_hash VARCHAR(64) UNIQUE NOT NULL,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                ");
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash_exp 
                    ON token_blacklist (token_hash, expires_at)
                ");
            }
            self::$blacklistTableInitialized = true;
        } catch (Throwable $e) {
            error_log("Token blacklist table init warning: " . $e->getMessage());
        }
    }

    /**
     * Add token to blacklist (revocation upon logout)
     */
    public static function blacklistToken(string $token, int $ttl = 86400): void
    {
        $hash = hash('sha256', $token);
        $ttl = max(60, $ttl);

        // 1. Invalidate in Redis if active
        $redis = Cache::getClient();
        if ($redis) {
            try {
                $redis->setex("token_blacklist:$hash", $ttl, '1');
            } catch (Throwable $e) {
                error_log("Redis token blacklist error: " . $e->getMessage());
            }
        }

        // 2. Persist in PostgreSQL fallback
        self::initBlacklistTable();
        try {
            run(
                "INSERT INTO token_blacklist (token_hash, expires_at) 
                 VALUES (?, NOW() + INTERVAL '$ttl seconds') 
                 ON CONFLICT (token_hash) DO NOTHING",
                [$hash]
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
     * Check if a token has been revoked / blacklisted
     */
    public static function isTokenBlacklisted(string $token): bool
    {
        $hash = hash('sha256', $token);

        // Check Redis first
        $redis = Cache::getClient();
        if ($redis) {
            try {
                if ($redis->exists("token_blacklist:$hash")) {
                    return true;
                }
            } catch (Throwable $e) {
                error_log("Redis token blacklist check error: " . $e->getMessage());
            }
        }

        // Check PostgreSQL fallback
        self::initBlacklistTable();
        try {
            $row = get(
                "SELECT 1 FROM token_blacklist WHERE token_hash = ? AND expires_at > NOW() LIMIT 1",
                [$hash]
            );
            return !empty($row);
        } catch (Throwable $e) {
            error_log("PostgreSQL token blacklist check error: " . $e->getMessage());
            return false;
        }
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

        $secret = function_exists('getJwtSecret') 
            ? getJwtSecret() 
            : (getenv('JWT_SECRET') ?: 'carrepair_super_secret_jwt_key_2026_x89!@#%^&_workshop_pro');

        $payload = JWT::decode($token, $secret);
        if (!$payload) {
            http_response_code(401);
            echo json_encode([
                'error'   => 'Unauthorized',
                'message' => 'Invalid or expired token'
            ]);
            exit;
        }

        // Set PostgreSQL Row Level Security (RLS) context for this request
        if (function_exists('setDatabaseUserContext')) {
            setDatabaseUserContext($payload['role'] ?? null, $payload['id'] ?? null);
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

        // Fetch dynamic permissions matrix (cached or from database settings)
        $matrix = null;
        try {
            $row = get("SELECT setting_value FROM settings WHERE setting_key = 'roles_permissions_matrix'");
            if ($row && !empty($row['setting_value'])) {
                $decoded = json_decode($row['setting_value'], true);
                if (is_array($decoded)) {
                    $matrix = $decoded;
                }
            }
        } catch (Throwable $e) {
            // DB query failed; fall back to static matrix
        }

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
