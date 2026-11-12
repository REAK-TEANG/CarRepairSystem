<?php
// api/routes/auditLogs.php

require_once __DIR__ . '/../controllers/AuditLogController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl = new AuditLogController();
$method = $_SERVER['REQUEST_METHOD'];
$action = $segments[1] ?? '';

if ($method === 'GET' && $action === 'stats') {
    $ctrl->stats($authPayload);
    exit;
}

if ($method === 'GET' && $action === 'export') {
    $ctrl->export($authPayload);
    exit;
}

if ($method === 'GET') {
    $ctrl->index($authPayload);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Audit log endpoint not found']);

