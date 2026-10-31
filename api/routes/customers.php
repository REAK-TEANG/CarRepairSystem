<?php
// api/routes/customers.php
require_once __DIR__ . '/../controllers/CustomerController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new CustomerController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/customers/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'GET') {
        AuthMiddleware::authorize('customers', 'read', $authPayload);
        $ctrl->show($id);
        exit;
    }
    if ($method === 'PUT' || $method === 'PATCH') {
        AuthMiddleware::authorize('customers', 'update', $authPayload);
        $ctrl->update($id);
        exit;
    }
    if ($method === 'DELETE') {
        AuthMiddleware::authorize('customers', 'delete', $authPayload);
        $ctrl->destroy($id);
        exit;
    }
}

if ($method === 'GET') {
    AuthMiddleware::authorize('customers', 'read', $authPayload);
    $ctrl->index();
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::authorize('customers', 'create', $authPayload);
    $ctrl->store();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Customer endpoint not found']);
