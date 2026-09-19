<?php
// api/routes/vehicles.php
require_once __DIR__ . '/../controllers/VehicleController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new VehicleController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/vehicles/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT')    { $ctrl->update($id);  exit; }
    if ($method === 'DELETE') { $ctrl->destroy($id); exit; }
}

if ($method === 'GET')  { $ctrl->index(); exit; }
if ($method === 'POST') { $ctrl->store(); exit; }

http_response_code(404);
echo json_encode(['error' => 'Vehicle endpoint not found']);
