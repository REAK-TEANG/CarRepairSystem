<?php
// api/routes/inventory.php
require_once __DIR__ . '/../controllers/InventoryController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new InventoryController();
$method      = $_SERVER['REQUEST_METHOD'];

// Stock transactions list
if (preg_match('#^/(?:inventory|spare-parts)/transactions$#', $path) && $method === 'GET') {
    $ctrl->transactions();
    exit;
}

// Adjust stock
if (preg_match('#^/(?:inventory|spare-parts)/(\d+)/adjust$#', $path, $m)) {
    $id = (int) $m[1];
    $ctrl->adjust($id, $authPayload);
    exit;
}

// Single item actions
if (preg_match('#^/(?:inventory|spare-parts)/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT' || $method === 'PATCH') { $ctrl->update($id); exit; }
    if ($method === 'DELETE') { $ctrl->destroy($id); exit; }
}

// List and create
if ($method === 'GET')  { $ctrl->index(); exit; }
if ($method === 'POST') { $ctrl->store(); exit; }

http_response_code(404);
echo json_encode(['error' => 'Inventory endpoint not found']);
