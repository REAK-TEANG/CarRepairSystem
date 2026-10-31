<?php
// api/routes/suppliers.php
require_once __DIR__ . '/../controllers/SupplierController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new SupplierController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/suppliers/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT' || $method === 'PATCH') {
        AuthMiddleware::authorize('suppliers', 'update', $authPayload);
        $ctrl->update($id);
        exit;
    }
    if ($method === 'DELETE') {
        AuthMiddleware::authorize('suppliers', 'delete', $authPayload);
        $ctrl->destroy($id);
        exit;
    }
}

if ($method === 'GET') {
    AuthMiddleware::authorize('suppliers', 'read', $authPayload);
    $ctrl->index();
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::authorize('suppliers', 'create', $authPayload);
    $ctrl->store();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Supplier endpoint not found']);
