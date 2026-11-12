<?php
// api/utils/eventBus.php
// Real-time event log. The system_events table is created by api/schema/*.sql.

class EventBus {
    /**
     * Publish a real-time event
     * @param string $topic Domain topic ('repair_jobs', 'inventory', 'appointments', 'invoices', 'alerts')
     * @param string $eventType Event action ('created', 'updated', 'status_changed', 'stock_low', etc.)
     * @param array $payload Additional event data
     * @return int|null Event ID
     */
    public static function publish($topic, $eventType, array $payload = []) {
        try {
            // Insert and notify LISTEN subscribers in a single round trip
            $row = get(
                "WITH e AS (
                     INSERT INTO system_events (topic, event_type, payload, created_at)
                     VALUES (?, ?, ?::jsonb, NOW()) RETURNING id
                 )
                 SELECT id, pg_notify('system_events', json_build_object('id', id, 'topic', ?::text, 'type', ?::text)::text) FROM e",
                [$topic, $eventType, json_encode($payload), $topic, $eventType]
            );

            // Prune events older than 24 hours (1 in 50 chance)
            if (mt_rand(1, 50) === 1) {
                run("DELETE FROM system_events WHERE created_at < NOW() - INTERVAL '24 hours'");
            }

            return (int)($row['id'] ?? 0);
        } catch (Throwable $e) {
            error_log("EventBus publish error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Retrieve events occurring after a given event ID
     */
    public static function getEventsSince($afterId = 0, $limit = 50) {
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
        try {
            $row = get("SELECT COALESCE(MAX(id), 0) AS max_id FROM system_events");
            return (int)($row['max_id'] ?? 0);
        } catch (Throwable $e) {
            error_log("EventBus getLatestEventId error: " . $e->getMessage());
            return 0;
        }
    }
}
