<?php
// api/utils/cache.php

class Cache {
    private static $client = null;

    /**
     * Get Predis client instance
     */
    public static function getClient() {
        if (self::$client === null) {
            try {
                $redisHost = getenv('REDIS_HOST') ?: '127.0.0.1';
                $redisPort = getenv('REDIS_PORT') ?: 6379;
                
                self::$client = new \Predis\Client([
                    'scheme' => 'tcp',
                    'host'   => $redisHost,
                    'port'   => $redisPort,
                    'timeout' => 1.0, // short timeout so it doesn't hang if Redis is down
                ]);
                
                // Test connection
                self::$client->ping();
            } catch (Throwable $e) {
                // If Redis fails, log it and return null so we can fallback
                error_log("Redis connection error: " . $e->getMessage());
                self::$client = false;
            }
        }
        
        return self::$client !== false ? self::$client : null;
    }

    /**
     * Get value from cache
     */
    public static function get($key) {
        $redis = self::getClient();
        if ($redis) {
            try {
                $value = $redis->get($key);
                return $value ? json_decode($value, true) : null;
            } catch (Throwable $e) {
                error_log("Redis GET error: " . $e->getMessage());
            }
        }
        return null;
    }

    /**
     * Set value in cache
     * @param int $ttl Time to live in seconds
     */
    public static function set($key, $value, $ttl = 3600) {
        $redis = self::getClient();
        if ($redis) {
            try {
                $redis->setex($key, $ttl, json_encode($value));
                return true;
            } catch (Throwable $e) {
                error_log("Redis SET error: " . $e->getMessage());
            }
        }
        return false;
    }

    /**
     * Delete key from cache
     */
    public static function delete($key) {
        $redis = self::getClient();
        if ($redis) {
            try {
                $redis->del($key);
                return true;
            } catch (Throwable $e) {
                error_log("Redis DEL error: " . $e->getMessage());
            }
        }
        return false;
    }
}
