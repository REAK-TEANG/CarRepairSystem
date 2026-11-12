<?php
// api/utils/rateLimit.php

class RateLimiter {
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
        $isLocal = ($ip === '127.0.0.1' || $ip === '::1' || (getenv('APP_ENV') ?: 'production') === 'development');

        // Never lock out local development by IP
        if ($isLocal) {
            // Only protect against extreme brute force per identifier in local dev (e.g. 50 attempts)
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

        // Fast path: in-memory counter (Redis or APCu), no database round trip
        $count = Cache::increment("ratelimit:global:$ip", $decayMinutes * 60);
        if ($count !== null) {
            return $count > $maxRequests;
        }

        // Fallback when no cache tier is available (e.g. local dev server)
        try {
            $row = get(
                "SELECT COUNT(*) AS cnt FROM global_api_requests
                 WHERE ip_address = ? AND requested_at >= NOW() - INTERVAL '$decayMinutes minutes'",
                [$ip]
            );
            run("INSERT INTO global_api_requests (ip_address) VALUES (?)", [$ip]);

            // Periodic cleanup (1 in 100 chance to minimize lock contention)
            if (mt_rand(1, 100) === 1) {
                run("DELETE FROM global_api_requests WHERE requested_at < NOW() - INTERVAL '1 hour'");
            }

            return (int)($row['cnt'] ?? 0) >= $maxRequests;
        } catch (Throwable $e) {
            error_log("RateLimiter global check error: " . $e->getMessage());
            return false;
        }
    }
}
