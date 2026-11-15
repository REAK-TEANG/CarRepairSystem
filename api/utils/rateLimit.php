<?php
// api/utils/rateLimit.php

require_once __DIR__ . '/clientIp.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/cache.php';

class RateLimiter {
    /**
     * Check if client IP or username has exceeded maximum failed login attempts
     */
    public static function isRateLimited($identifier, $maxAttempts = 5, $decayMinutes = 15) {
        $ip = clientIp();
        $cleanId = strtolower(trim($identifier));

        // Development only: a relaxed per-identifier limit so developers do not lock themselves out.
        // Never decided by IP: a security limit must not depend on where the request appears to come from.
        if ((getenv('APP_ENV') ?: 'production') === 'development') {
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
        $ip = clientIp();
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
        $ip = clientIp();
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

    public const ANONYMOUS_LIMIT = 120; // requests per minute, per IP, without a valid login
    public const USER_LIMIT = 300;      // requests per minute, per signed-in user

    /**
     * Which allowance a request counts against: [bucket key, requests per minute].
     * A request carrying a validly signed, unexpired token gets that user's own bucket, so
     * colleagues behind one office IP do not use up each other's allowance. Anything else
     * (no token, forged, expired) shares the caller's IP bucket, so made-up tokens gain nothing.
     */
    public static function requestBucket(?string $bearerToken): array {
        if ($bearerToken) {
            try {
                $claims = JWT::decode($bearerToken, getJwtSecret());
            } catch (Throwable $e) {
                $claims = false;
            }
            if (is_array($claims) && !empty($claims['id'])) {
                return ['user:' . (int) $claims['id'], self::USER_LIMIT];
            }
        }
        return ['ip:' . clientIp(), self::ANONYMOUS_LIMIT];
    }

    /**
     * Count this request against a bucket and report whether it is over the limit.
     * Uses the in-memory cache tier (Redis or APCu) only. Without one there is no global
     * throttle: counting in the database would add load exactly when a flood needs less of it.
     * Check "cache" in /health/db to confirm a tier is active in production.
     */
    public static function isGlobalThrottled(string $bucket, int $maxRequests, int $decayMinutes = 1): bool {
        $count = Cache::increment("ratelimit:global:$bucket", $decayMinutes * 60);
        return $count !== null && $count > $maxRequests;
    }
}
