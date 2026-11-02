<?php
// api/utils/rateLimit.php

class RateLimiter {
    private static $tableInitialized = false;
    private static $globalTableInitialized = false;

    /**
     * Ensure the rate limiting table exists in PostgreSQL
     */
    private static function initTable() {
        if (self::$tableInitialized) return;
        global $pdo;
        try {
            if ($pdo) {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS login_attempts (
                        id SERIAL PRIMARY KEY,
                        ip_address VARCHAR(45) NOT NULL,
                        identifier VARCHAR(100) NOT NULL,
                        attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                ");
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup 
                    ON login_attempts (ip_address, identifier, attempted_at)
                ");
            }
            self::$tableInitialized = true;
        } catch (Throwable $e) {
            error_log("RateLimiter table init warning: " . $e->getMessage());
        }
    }

    /**
     * Ensure the global requests tracking table exists in PostgreSQL
     */
    private static function initGlobalTable() {
        if (self::$globalTableInitialized) return;
        global $pdo;
        try {
            if ($pdo) {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS global_api_requests (
                        id SERIAL PRIMARY KEY,
                        ip_address VARCHAR(45) NOT NULL,
                        requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                ");
                $pdo->exec("
                    CREATE INDEX IF NOT EXISTS idx_global_requests_ip_time 
                    ON global_api_requests (ip_address, requested_at)
                ");
            }
            self::$globalTableInitialized = true;
        } catch (Throwable $e) {
            error_log("RateLimiter global table init warning: " . $e->getMessage());
        }
    }

    /**
     * Get client IP address securely
     */
    public static function getClientIp() {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    /**
     * Check if client IP or username has exceeded maximum failed login attempts
     */
    public static function isRateLimited($identifier, $maxAttempts = 5, $decayMinutes = 15) {
        $ip = self::getClientIp();
        $cleanId = strtolower(trim($identifier));
        $isLocal = ($ip === '127.0.0.1' || $ip === '::1' || (getenv('APP_ENV') ?: 'development') === 'development');

        // Never lock out local development by IP
        if ($isLocal) {
            // Only protect against extreme brute force per identifier in local dev (e.g. 50 attempts)
            self::initTable();
            try {
                $row = get("SELECT COUNT(*) AS cnt FROM login_attempts WHERE identifier = ? AND attempted_at >= NOW() - INTERVAL '$decayMinutes minutes'", [$cleanId]);
                return ((int)($row['cnt'] ?? 0)) >= 50;
            } catch (Throwable $e) {
                return false;
            }
        }
        
        $redis = Cache::getClient();
        if ($redis) {
            try {
                $ipKey = "ratelimit:ip:$ip";
                $idKey = "ratelimit:id:$cleanId";
                $ipAttempts = (int)$redis->get($ipKey);
                $idAttempts = (int)$redis->get($idKey);
                
                if ($ipAttempts >= 30 || $idAttempts >= $maxAttempts) {
                    return true;
                }
                return false;
            } catch (Throwable $e) {
                error_log("RateLimiter Redis check error: " . $e->getMessage());
            }
        }

        self::initTable();

        try {
            // Check account-level lockout (5 attempts) OR IP-level DDoS lockout (30 attempts)
            $idRow = get("SELECT COUNT(*) AS cnt FROM login_attempts WHERE identifier = ? AND attempted_at >= NOW() - INTERVAL '$decayMinutes minutes'", [$cleanId]);
            if (((int)($idRow['cnt'] ?? 0)) >= $maxAttempts) {
                return true;
            }

            $ipRow = get("SELECT COUNT(*) AS cnt FROM login_attempts WHERE ip_address = ? AND attempted_at >= NOW() - INTERVAL '$decayMinutes minutes'", [$ip]);
            return ((int)($ipRow['cnt'] ?? 0)) >= 30;
        } catch (Throwable $e) {
            error_log("RateLimiter PG check error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Record a failed login attempt
     */
    public static function recordFailure($identifier, $decayMinutes = 15) {
        $ip = self::getClientIp();
        $cleanId = strtolower(trim($identifier));
        
        $redis = Cache::getClient();
        if ($redis) {
            try {
                $ipKey = "ratelimit:ip:$ip";
                $idKey = "ratelimit:id:$cleanId";
                $decaySeconds = $decayMinutes * 60;
                
                $redis->incr($ipKey);
                $redis->expire($ipKey, $decaySeconds);
                
                $redis->incr($idKey);
                $redis->expire($idKey, $decaySeconds);
                return;
            } catch (Throwable $e) {
                error_log("RateLimiter Redis record error: " . $e->getMessage());
            }
        }

        self::initTable();

        try {
            run("INSERT INTO login_attempts (ip_address, identifier) VALUES (?, ?)", [$ip, $cleanId]);
            
            // Randomly clean up old entries (1 in 20 chance)
            if (mt_rand(1, 20) === 1) {
                run("DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours'");
            }
        } catch (Throwable $e) {
            error_log("RateLimiter PG record failure error: " . $e->getMessage());
        }
    }

    /**
     * Clear all recorded failures on successful login
     */
    public static function resetAttempts($identifier) {
        $ip = self::getClientIp();
        $cleanId = strtolower(trim($identifier));
        
        $redis = Cache::getClient();
        if ($redis) {
            try {
                $redis->del(["ratelimit:ip:$ip", "ratelimit:id:$cleanId"]);
                return;
            } catch (Throwable $e) {
                error_log("RateLimiter Redis reset error: " . $e->getMessage());
            }
        }

        self::initTable();

        try {
            run("DELETE FROM login_attempts WHERE ip_address = ? OR identifier = ?", [$ip, $cleanId]);
        } catch (Throwable $e) {
            error_log("RateLimiter PG reset error: " . $e->getMessage());
        }
    }

    /**
     * Check if client IP has exceeded maximum allowed global API requests
     */
    public static function isGlobalThrottled(int $maxRequests = 120, int $decayMinutes = 1): bool {
        $ip = self::getClientIp();
        $redis = Cache::getClient();
        if ($redis) {
            try {
                $key = "ratelimit:global:$ip";
                $count = $redis->incr($key);
                if ($count === 1) {
                    $redis->expire($key, $decayMinutes * 60);
                }
                return $count > $maxRequests;
            } catch (Throwable $e) {
                error_log("RateLimiter Redis global check error: " . $e->getMessage());
            }
        }

        try {
            $sql = "
                SELECT COUNT(*) AS cnt 
                FROM global_api_requests 
                WHERE ip_address = ? 
                  AND requested_at >= NOW() - INTERVAL '$decayMinutes minutes'
            ";
            $row = get($sql, [$ip]);
            $currentCount = (int)($row['cnt'] ?? 0);

            // Record this request
            run("INSERT INTO global_api_requests (ip_address) VALUES (?)", [$ip]);

            // Periodic cleanup (1 in 100 chance to minimize lock contention)
            if (mt_rand(1, 100) === 1) {
                run("DELETE FROM global_api_requests WHERE requested_at < NOW() - INTERVAL '1 hour'");
            }

            return $currentCount >= $maxRequests;
        } catch (Throwable $e) {
            if (str_contains($e->getMessage(), 'does not exist') || str_contains($e->getMessage(), '42P01')) {
                self::initGlobalTable();
                try {
                    run("INSERT INTO global_api_requests (ip_address) VALUES (?)", [$ip]);
                } catch (Throwable) {}
            } else {
                error_log("RateLimiter PG global check error: " . $e->getMessage());
            }
            return false;
        }
    }
}
