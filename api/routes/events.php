<?php
// api/routes/events.php
// GET /api/events/poll?afterId=123 — real-time events for the signed-in user.
// Each event's topic is a module name; users only receive events for modules they may read.
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/eventBus.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET' || ($segments[1] ?? '') !== 'poll') {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found']);
    exit;
}

$afterId = (int) ($_GET['afterId'] ?? 0);
$events = array_values(array_filter(
    EventBus::getEventsSince($afterId, 50),
    fn ($event) => AuthMiddleware::can((string) $event['topic'], 'read', $authPayload)
));

echo json_encode([
    'data' => $events,
    'latestId' => EventBus::getLatestEventId(),
]);
