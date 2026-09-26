<?php
// api/routes/events.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/eventBus.php';

// Support authentication via Header or ?token= query parameter (standard for EventSource)
$token = null;
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
} else if (!empty($_GET['token'])) {
    $token = $_GET['token'];
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'No token provided for real-time stream']);
    exit;
}

$secret = function_exists('getJwtSecret') ? getJwtSecret() : (getenv('JWT_SECRET') ?: 'carrepair_super_secret_jwt_key_2026_x89!@#%^&_workshop_pro');
$userPayload = JWT::decode($token, $secret);
if (!$userPayload) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token for real-time stream']);
    exit;
}

$subPath = $segments[1] ?? '';

// -----------------------------------------------------------------------------
// REST Polling Fallback: GET /api/events/poll?afterId=123
// -----------------------------------------------------------------------------
if ($subPath === 'poll') {
    $afterId = (int)($_GET['afterId'] ?? 0);
    $events = EventBus::getEventsSince($afterId, 50);
    $latestId = EventBus::getLatestEventId();
    echo json_encode([
        'data' => $events,
        'latestId' => $latestId
    ]);
    exit;
}

// -----------------------------------------------------------------------------
// Server-Sent Events (SSE) Stream: GET /api/events or GET /api/realtime
// -----------------------------------------------------------------------------
// Prevent output buffering interference
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
@ini_set('zlib.output_compression', '0');
@ini_set('implicit_flush', '1');
while (ob_get_level() > 0) {
    ob_end_clean();
}

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache, no-transform');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

// Determine starting event ID
$lastEventId = 0;
if (isset($_SERVER['HTTP_LAST_EVENT_ID'])) {
    $lastEventId = (int)$_SERVER['HTTP_LAST_EVENT_ID'];
} else if (!empty($_GET['lastEventId'])) {
    $lastEventId = (int)$_GET['lastEventId'];
} else {
    $lastEventId = EventBus::getLatestEventId();
}

// Initial Handshake
echo "retry: 3000\n";
echo "event: connected\n";
echo "data: " . json_encode([
    'status' => 'connected',
    'lastEventId' => $lastEventId,
    'user' => $userPayload['username'] ?? 'user'
]) . "\n\n";
flush();

// Event Stream Loop (Run for 25 seconds, then let client reconnect gracefully)
$maxExecutionSeconds = 25;
$startTime = time();

while ((time() - $startTime) < $maxExecutionSeconds) {
    if (connection_aborted()) {
        break;
    }

    $events = EventBus::getEventsSince($lastEventId, 20);

    if (!empty($events)) {
        foreach ($events as $evt) {
            $eventId = (int)$evt['id'];
            $topic = $evt['topic'];
            $eventType = $evt['event_type'];
            $payload = is_string($evt['payload']) ? json_decode($evt['payload'], true) : $evt['payload'];

            echo "id: {$eventId}\n";
            echo "event: {$topic}\n";
            echo "data: " . json_encode([
                'id' => $eventId,
                'topic' => $topic,
                'eventType' => $eventType,
                'payload' => $payload,
                'createdAt' => $evt['created_at']
            ]) . "\n\n";

            $lastEventId = max($lastEventId, $eventId);
        }
        flush();
    } else {
        // Send lightweight heartbeat comment to keep socket alive
        echo ": heartbeat\n\n";
        flush();
    }

    sleep(1);
}

exit;
