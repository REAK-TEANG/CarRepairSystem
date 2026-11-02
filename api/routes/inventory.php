<?php
// api/routes/inventory.php
require_once __DIR__ . '/../controllers/InventoryController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new InventoryController();
$method      = $_SERVER['REQUEST_METHOD'];

// Stock transactions list
if (preg_match('#^/(?:inventory|spare-parts)/transactions$#', $path) && $method === 'GET') {
    AuthMiddleware::authorize('inventory', 'read', $authPayload);
    $ctrl->transactions();
    exit;
}

// Adjust stock
if (preg_match('#^/(?:inventory|spare-parts)/(\d+)/adjust$#', $path, $m)) {
    $id = (int) $m[1];
    AuthMiddleware::authorize('inventory', 'update', $authPayload);
    $ctrl->adjust($id, $authPayload);
    exit;
}

// Single item actions
if (preg_match('#^/(?:inventory|spare-parts)/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'GET') {
        AuthMiddleware::authorize('inventory', 'read', $authPayload);
        $ctrl->show($id);
        exit;
    }
    if ($method === 'PUT' || $method === 'PATCH') {
        AuthMiddleware::authorize('inventory', 'update', $authPayload);
        $ctrl->update($id);
        exit;
    }
    if ($method === 'DELETE') {
        AuthMiddleware::authorize('inventory', 'delete', $authPayload);
        $ctrl->destroy($id);
        exit;
    }
}

// List and create
if ($method === 'GET') {
    AuthMiddleware::authorize('inventory', 'read', $authPayload);
    $ctrl->index();
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::authorize('inventory', 'create', $authPayload);
    $ctrl->store();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Inventory endpoint not found']);
