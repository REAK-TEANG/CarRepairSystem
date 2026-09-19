<?php
// api/routes/repairJobs.php
require_once __DIR__ . '/../controllers/RepairJobController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new RepairJobController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/repair-orders/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'GET')    { $ctrl->show($id);              exit; }
    if ($method === 'PUT')    { $ctrl->update($id, $authPayload); exit; }
    if ($method === 'DELETE') { $ctrl->destroy($id);           exit; }
}

if ($method === 'GET')  { $ctrl->index();              exit; }
if ($method === 'POST') { $ctrl->store($authPayload);  exit; }

http_response_code(404);
echo json_encode(['error' => 'Repair Jobs endpoint not found']);
