<?php
// api/utils/eventBus.php

class EventBus {
    private static $initialized = false;

    /**
     * Ensure system_events table exists
     */
    public static function init() {
        if (self::$initialized) return;
        try {
            query("
                CREATE TABLE IF NOT EXISTS system_events (
                    id BIGSERIAL PRIMARY KEY,
                    topic VARCHAR(50) NOT NULL,
                    event_type VARCHAR(50) NOT NULL,
                    payload JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_system_events_lookup 
                ON system_events (id DESC, topic);
            ");
            self::$initialized = true;
        } catch (Throwable $e) {
            error_log("EventBus init warning: " . $e->getMessage());
        }
    }

    /**
     * Publish a real-time event
     * @param string $topic Domain topic ('repair_jobs', 'inventory', 'appointments', 'invoices', 'alerts')
     * @param string $eventType Event action ('created', 'updated', 'status_changed', 'stock_low', etc.)
     * @param array $payload Additional event data
     * @return int|null Event ID
     */
    public static function publish($topic, $eventType, array $payload = []) {
        self::init();
        global $pdo;

        try {
            $jsonPayload = json_encode($payload);
            run(
                "INSERT INTO system_events (topic, event_type, payload, created_at) VALUES (?, ?, ?::jsonb, NOW())",
                [$topic, $eventType, $jsonPayload]
            );
            $eventId = $pdo->lastInsertId();

            // Notify PostgreSQL LISTEN listeners if any
            try {
                $notifyData = json_encode(['id' => $eventId, 'topic' => $topic, 'type' => $eventType]);
                $safePayload = str_replace("'", "''", $notifyData);
                $pdo->exec("NOTIFY system_events, '{$safePayload}'");
            } catch (Throwable $pe) {
                // Ignore if notify is not permitted in connection mode
            }

            // Prune events older than 24 hours (1 in 50 chance)
            if (mt_rand(1, 50) === 1) {
                run("DELETE FROM system_events WHERE created_at < NOW() - INTERVAL '24 hours'");
            }

            return $eventId;
        } catch (Throwable $e) {
            error_log("EventBus publish error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Retrieve events occurring after a given event ID
     */
    public static function getEventsSince($afterId = 0, $limit = 50) {
        self::init();
        try {
            return all(
                "SELECT id, topic, event_type, payload, created_at 
                 FROM system_events 
                 WHERE id > ? 
                 ORDER BY id ASC 
                 LIMIT ?",
                [(int)$afterId, (int)$limit]
            );
        } catch (Throwable $e) {
            error_log("EventBus getEventsSince error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get the latest event ID currently in the system
     */
    public static function getLatestEventId() {
        self::init();
        try {
            $row = get("SELECT COALESCE(MAX(id), 0) AS max_id FROM system_events");
            return (int)($row['max_id'] ?? 0);
        } catch (Throwable $e) {
            return 0;
        }
    }
}
