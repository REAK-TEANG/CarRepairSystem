<?php
// api/routes/inventory.php
require_once __DIR__ . '/../controllers/InventoryController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new InventoryController();
$method      = $_SERVER['REQUEST_METHOD'];

// Transactions list
if (($path === '/spare-parts/transactions' || $path === '/inventory/transactions') && $method === 'GET') {
    $ctrl->transactions();
    exit;
}

// Adjust stock
if (preg_match('#^/spare-parts/(\d+)/adjust$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'POST') { $ctrl->adjust($id, $authPayload); exit; }
}

if (preg_match('#^/spare-parts/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT')    { $ctrl->update($id);  exit; }
    if ($method === 'DELETE') { $ctrl->destroy($id); exit; }
}

if ($method === 'GET')  { $ctrl->index(); exit; }
if ($method === 'POST') { $ctrl->store(); exit; }

http_response_code(404);
echo json_encode(['error' => 'Inventory endpoint not found']);
