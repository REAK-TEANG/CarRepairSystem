<?php
// api/routes/appointments.php
require_once __DIR__ . '/../controllers/AppointmentController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new AppointmentController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/appointments/(\d+)/status$#', $path, $m)) {
    $id = (int) $m[1];
    if (in_array($method, ['PUT', 'PATCH'])) {
        AuthMiddleware::authorize('appointments', 'update', $authPayload);
        $ctrl->updateStatus($id);
        exit;
    }
} else if (preg_match('#^/appointments/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT' || $method === 'PATCH') {
        AuthMiddleware::authorize('appointments', 'update', $authPayload);
        $ctrl->update($id);
        exit;
    }
    if ($method === 'DELETE') {
        AuthMiddleware::authorize('appointments', 'delete', $authPayload);
        $ctrl->destroy($id);
        exit;
    }
}

if ($method === 'GET') {
    AuthMiddleware::authorize('appointments', 'read', $authPayload);
    $ctrl->index();
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::authorize('appointments', 'create', $authPayload);
    $ctrl->store();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Appointment endpoint not found']);
