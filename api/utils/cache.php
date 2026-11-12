<?php
// api/utils/cache.php

class Cache {
    private static $client = null;

    /**
     * Get Predis client instance
     */
    public static function getClient() {
        if (self::$client === null) {
            $redisHost = getenv('REDIS_HOST');
            $redisEnabled = getenv('REDIS_ENABLED');
            
            // Skip Redis immediately if not explicitly configured/enabled to avoid 1s TCP timeout penalty
            if (!$redisHost || $redisEnabled === 'false' || $redisEnabled === '0') {
                self::$client = false;
                return null;
            }

            try {
                $redisPort = getenv('REDIS_PORT') ?: 6379;
                $redisPassword = getenv('REDIS_PASSWORD') ?: null;
                
                $config = [
                    'scheme'  => 'tcp',
                    'host'    => $redisHost,
                    'port'    => $redisPort,
                    'timeout' => 0.5,
                ];
                if ($redisPassword) {
                    $config['password'] = $redisPassword;
                }

                self::$client = new \Predis\Client($config);
                
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
     * Whether the in-process APCu cache is usable. Apache workers share one APCu
     * segment, so it works as a zero-network cache on a single instance.
     */
    public static function apcuAvailable(): bool
    {
        static $available = null;
        $available ??= function_exists('apcu_enabled') && apcu_enabled();
        return $available;
    }

    /**
     * Read a value. $hit tells a cached null/false apart from a miss.
     * Tiers: Redis (shared, if configured) then APCu (per instance).
     */
    public static function fetch(string $key, ?bool &$hit = null): mixed
    {
        $hit = false;
        $redis = self::getClient();
        if ($redis) {
            try {
                $raw = $redis->get($key);
                if ($raw !== null) {
                    $hit = true;
                    return json_decode($raw, true);
                }
            } catch (Throwable $e) {
                error_log("Redis GET error: " . $e->getMessage());
            }
        }
        if (self::apcuAvailable()) {
            $value = apcu_fetch($key, $found);
            if ($found) {
                $hit = true;
                return $value;
            }
        }
        return null;
    }

    /** Write a value to every available tier. */
    public static function store(string $key, mixed $value, int $ttl = 3600): void
    {
        $redis = self::getClient();
        if ($redis) {
            try {
                $redis->setex($key, $ttl, json_encode($value));
            } catch (Throwable $e) {
                error_log("Redis SET error: " . $e->getMessage());
            }
        }
        if (self::apcuAvailable()) {
            apcu_store($key, $value, $ttl);
        }
    }

    /** Return the cached value, or compute it with $producer and cache it. */
    public static function remember(string $key, int $ttl, callable $producer): mixed
    {
        $value = self::fetch($key, $hit);
        if ($hit) {
            return $value;
        }
        $value = $producer();
        self::store($key, $value, $ttl);
        return $value;
    }

    /** Remove a key from every tier. */
    public static function delete(string $key): void
    {
        $redis = self::getClient();
        if ($redis) {
            try {
                $redis->del($key);
            } catch (Throwable $e) {
                error_log("Redis DEL error: " . $e->getMessage());
            }
        }
        if (self::apcuAvailable()) {
            apcu_delete($key);
        }
    }

    /**
     * Atomic fixed-window counter. Returns the new count, or null when no cache
     * tier is available (callers then fall back to the database).
     */
    public static function increment(string $key, int $ttl): ?int
    {
        $redis = self::getClient();
        if ($redis) {
            try {
                $count = (int) $redis->incr($key);
                if ($count === 1) {
                    $redis->expire($key, $ttl);
                }
                return $count;
            } catch (Throwable $e) {
                error_log("Redis INCR error: " . $e->getMessage());
            }
        }
        if (self::apcuAvailable()) {
            apcu_add($key, 0, $ttl);
            $count = apcu_inc($key);
            return $count === false ? null : (int) $count;
        }
        return null;
    }
}
