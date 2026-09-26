<?php
// api/utils/rateLimit.php

class RateLimiter {
    private static $tableInitialized = false;

    /**
     * Ensure the rate limiting table exists in PostgreSQL
     */
    private static function initTable() {
        if (self::$tableInitialized) return;
        try {
            query("
                CREATE TABLE IF NOT EXISTS login_attempts (
                    id SERIAL PRIMARY KEY,
                    ip_address VARCHAR(45) NOT NULL,
                    identifier VARCHAR(100) NOT NULL,
                    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup 
                ON login_attempts (ip_address, identifier, attempted_at);
            ");
            self::$tableInitialized = true;
        } catch (Throwable $e) {
            error_log("RateLimiter table init warning: " . $e->getMessage());
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
     * Check if client IP or username has exceeded maximum failed attempts
     */
    public static function isRateLimited($identifier, $maxAttempts = 5, $decayMinutes = 15) {
        $ip = self::getClientIp();
        $cleanId = strtolower(trim($identifier));
        
        $redis = Cache::getClient();
        if ($redis) {
            try {
                $ipKey = "ratelimit:ip:$ip";
                $idKey = "ratelimit:id:$cleanId";
                $ipAttempts = (int)$redis->get($ipKey);
                $idAttempts = (int)$redis->get($idKey);
                
                if ($ipAttempts >= $maxAttempts || $idAttempts >= $maxAttempts) {
                    return true;
                }
                return false;
            } catch (Throwable $e) {
                error_log("RateLimiter Redis check error: " . $e->getMessage());
            }
        }

        self::initTable();

        try {
            $sql = "
                SELECT COUNT(*) AS cnt 
                FROM login_attempts 
                WHERE (ip_address = ? OR identifier = ?) 
                  AND attempted_at >= NOW() - INTERVAL '$decayMinutes minutes'
            ";
            $row = get($sql, [$ip, $cleanId]);
            return ((int)($row['cnt'] ?? 0)) >= $maxAttempts;
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
}
