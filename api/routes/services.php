<?php
// api/routes/services.php
require_once __DIR__ . '/../controllers/ServiceController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new ServiceController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/services/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'GET')    { $ctrl->show($id);    exit; }
    if ($method === 'PUT')    { $ctrl->update($id);  exit; }
    if ($method === 'DELETE') { $ctrl->destroy($id); exit; }
}

if ($method === 'GET')  { $ctrl->index(); exit; }
if ($method === 'POST') { $ctrl->store(); exit; }

http_response_code(404);
echo json_encode(['error' => 'Service endpoint not found']);
