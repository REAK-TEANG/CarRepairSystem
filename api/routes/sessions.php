<?php
// api/routes/sessions.php

require_once __DIR__ . '/../controllers/SessionController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $segments[1] ?? '';
$ctrl = new SessionController();

// 1. Unload / Close Beacon (can pass token via body or authorization header)
if ($method === 'POST' && $action === 'close') {
    $ctrl->close();
    exit;
}

// All following session routes require valid authentication
$authPayload = AuthMiddleware::requireAuth();

if ($method === 'POST' && $action === 'heartbeat') {
    $ctrl->heartbeat($authPayload);
    exit;
}

if ($method === 'GET' && ($action === 'active' || $action === '')) {
    $ctrl->active($authPayload);
    exit;
}

if ($method === 'GET' && $action === 'history') {
    $ctrl->history($authPayload);
    exit;
}

if ($method === 'POST' && $action === 'revoke') {
    $ctrl->revoke($authPayload);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Sessions endpoint not found']);

