<?php
// api/routes/customers.php
require_once __DIR__ . '/../controllers/CustomerController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new CustomerController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/customers/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'GET')    { $ctrl->show($id);    exit; }
    if ($method === 'PUT')    { $ctrl->update($id);  exit; }
    if ($method === 'DELETE') { $ctrl->destroy($id); exit; }
}

if ($method === 'GET')  { $ctrl->index(); exit; }
if ($method === 'POST') { $ctrl->store(); exit; }

http_response_code(404);
echo json_encode(['error' => 'Customer endpoint not found']);
