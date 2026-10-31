<?php
// api/routes/serviceReminders.php
require_once __DIR__ . '/../controllers/ServiceReminderController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new ServiceReminderController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/(?:service-?reminders|servicereminders)/(\d+)$#i', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT' || $method === 'PATCH') {
        AuthMiddleware::authorize('service_reminders', 'update', $authPayload);
        $ctrl->update($id);
        exit;
    }
    if ($method === 'DELETE') {
        AuthMiddleware::authorize('service_reminders', 'delete', $authPayload);
        $ctrl->destroy($id);
        exit;
    }
}

if ($method === 'GET') {
    AuthMiddleware::authorize('service_reminders', 'read', $authPayload);
    $ctrl->index();
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::authorize('service_reminders', 'create', $authPayload);
    $ctrl->store();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Service Reminders endpoint not found']);
