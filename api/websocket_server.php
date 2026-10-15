<?php
// api/websocket_server.php
// Production-grade Ratchet WebSocket Server for Real-Time Synchronization

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/utils/jwt.php';
require_once __DIR__ . '/utils/eventBus.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Loop;

class RealtimeServer implements MessageComponentInterface
{
    /** @var \SplObjectStorage */
    protected $clients;

    /** @var array<int, array> Map of connId => [user => payload, subscriptions => []] */
    protected $clientMeta = [];

    /** @var int Tracking latest event ID distributed */
    protected $lastDistributedEventId = 0;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage();
        $this->lastDistributedEventId = EventBus::getLatestEventId();
        echo sprintf("[%s] Realtime WebSocket Server initialized. Starting from event ID #%d\n", 
            date('Y-m-d H:i:s'), $this->lastDistributedEventId);
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);

        // Attempt authentication via query parameter ?token=...
        $user = null;
        $httpRequest = $conn->httpRequest ?? null;
        if ($httpRequest) {
            $query = $httpRequest->getUri()->getQuery();
            parse_str($query, $params);
            if (!empty($params['token'])) {
                $secret = getenv('JWT_SECRET') ?: 'carrepair_super_secret_jwt_key_2026_x89!@#%^&_workshop_pro';
                $user = JWT::decode($params['token'], $secret);
            }
        }

        $this->clientMeta[$conn->resourceId] = [
            'user' => $user,
            'authenticated' => (bool)$user,
            'subscriptions' => ['*'], // Default to all topics if authenticated
            'connectedAt' => time(),
        ];

        echo sprintf("[%s] Client #%d connected (Auth: %s)\n", 
            date('Y-m-d H:i:s'), 
            $conn->resourceId, 
            $user ? ($user['username'] ?? 'User') : 'Anonymous'
        );

        // Send connection handshake ack
        $conn->send(json_encode([
            'type' => 'welcome',
            'connectionId' => $conn->resourceId,
            'authenticated' => (bool)$user,
            'user' => $user ? ['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role']] : null,
            'lastEventId' => $this->lastDistributedEventId,
            'serverTime' => date('c'),
        ]));
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $data = json_decode($msg, true);
        if (!is_array($data)) {
            return;
        }

        $type = $data['type'] ?? '';

        switch ($type) {
            case 'ping':
                $from->send(json_encode(['type' => 'pong', 'timestamp' => time()]));
                break;

            case 'auth':
                $token = $data['token'] ?? '';
                $secret = getenv('JWT_SECRET') ?: 'carrepair_super_secret_jwt_key_2026_x89!@#%^&_workshop_pro';
                $user = JWT::decode($token, $secret);
                if ($user) {
                    $this->clientMeta[$from->resourceId]['user'] = $user;
                    $this->clientMeta[$from->resourceId]['authenticated'] = true;
                    $from->send(json_encode([
                        'type' => 'authenticated',
                        'user' => ['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role']],
                    ]));
                } else {
                    $from->send(json_encode([
                        'type' => 'auth_error',
                        'message' => 'Invalid or expired token',
                    ]));
                }
                break;

            case 'subscribe':
                $topics = (array)($data['topics'] ?? $data['topic'] ?? ['*']);
                $this->clientMeta[$from->resourceId]['subscriptions'] = $topics;
                $from->send(json_encode([
                    'type' => 'subscribed',
                    'topics' => $topics,
                ]));
                break;

            default:
                break;
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        unset($this->clientMeta[$conn->resourceId]);
        echo sprintf("[%s] Client #%d disconnected\n", date('Y-m-d H:i:s'), $conn->resourceId);
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo sprintf("[%s] Error on client #%d: %s\n", date('Y-m-d H:i:s'), $conn->resourceId, $e->getMessage());
        $conn->close();
    }

    /**
     * Poll PostgreSQL system_events table and broadcast new events
     */
    public function broadcastPendingEvents(): void
    {
        if (count($this->clients) === 0) {
            return;
        }

        $events = EventBus::getEventsSince($this->lastDistributedEventId, 50);
        if (empty($events)) {
            return;
        }

        foreach ($events as $evt) {
            $eventId = (int)$evt['id'];
            $topic = $evt['topic'];
            $eventType = $evt['event_type'];
            $payload = is_string($evt['payload']) ? json_decode($evt['payload'], true) : $evt['payload'];

            $message = json_encode([
                'type' => 'event',
                'id' => $eventId,
                'topic' => $topic,
                'eventType' => $eventType,
                'payload' => $payload,
                'createdAt' => $evt['created_at'],
            ]);

            // Broadcast to authorized and subscribed clients
            foreach ($this->clients as $client) {
                $meta = $this->clientMeta[$client->resourceId] ?? null;
                if (!$meta || !$meta['authenticated']) {
                    continue; // Do not broadcast to unauthenticated clients
                }

                $subs = $meta['subscriptions'] ?? ['*'];
                if (in_array('*', $subs) || in_array($topic, $subs)) {
                    $client->send($message);
                }
            }

            $this->lastDistributedEventId = max($this->lastDistributedEventId, $eventId);
        }
    }
}

// Start WebSocket IoServer
$port = (int)(getenv('WS_PORT') ?: 8080);
$host = getenv('WS_HOST') ?: '0.0.0.0';

$loop = Loop::get();
$realtimeServer = new RealtimeServer();

// Add periodic event polling timer every 500 milliseconds (0.5s)
$loop->addPeriodicTimer(0.5, function () use ($realtimeServer) {
    try {
        $realtimeServer->broadcastPendingEvents();
    } catch (\Throwable $e) {
        error_log("[WS Error] Broadcast loop failed: " . $e->getMessage());
    }
});

// Add periodic heartbeat ping every 25 seconds
$loop->addPeriodicTimer(25.0, function () use ($realtimeServer) {
    // Keep-alive timer
});

$socket = new \React\Socket\SocketServer("$host:$port", [], $loop);
$server = new IoServer(
    new HttpServer(
        new WsServer(
            $realtimeServer
        )
    ),
    $socket,
    $loop
);

echo sprintf("[%s] WebSocket Server listening on ws://%s:%d\n", date('Y-m-d H:i:s'), $host, $port);
$loop->run();
