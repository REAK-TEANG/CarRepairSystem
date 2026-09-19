<?php
// api/routes/appointments.php
require_once __DIR__ . '/../controllers/AppointmentController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new AppointmentController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/appointments/(\d+)/status$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PATCH') { $ctrl->updateStatus($id); exit; }
}

if (preg_match('#^/appointments/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT')    { $ctrl->update($id);  exit; }
    if ($method === 'DELETE') { $ctrl->destroy($id); exit; }
}

if ($method === 'GET')  { $ctrl->index(); exit; }
if ($method === 'POST') { $ctrl->store(); exit; }

http_response_code(404);
echo json_encode(['error' => 'Appointment endpoint not found']);
