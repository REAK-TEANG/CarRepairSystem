<?php
// api/routes/mechanics.php
require_once __DIR__ . '/../controllers/MechanicController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new MechanicController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/mechanics/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT')    { $ctrl->update($id);  exit; }
    if ($method === 'DELETE') { $ctrl->destroy($id); exit; }
}

if ($method === 'GET')  { $ctrl->index(); exit; }
if ($method === 'POST') { $ctrl->store(); exit; }

http_response_code(404);
echo json_encode(['error' => 'Mechanic endpoint not found']);
