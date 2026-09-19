<?php
// api/routes/suppliers.php
require_once __DIR__ . '/../controllers/SupplierController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new SupplierController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/suppliers/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT')    { $ctrl->update($id);  exit; }
    if ($method === 'DELETE') { $ctrl->destroy($id); exit; }
}

if ($method === 'GET')  { $ctrl->index(); exit; }
if ($method === 'POST') { $ctrl->store(); exit; }

http_response_code(404);
echo json_encode(['error' => 'Supplier endpoint not found']);
