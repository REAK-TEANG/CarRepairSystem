<?php
// api/routes/vehicles.php
require_once __DIR__ . '/../controllers/VehicleController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new VehicleController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/vehicles/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'GET') {
        AuthMiddleware::authorize('vehicles', 'read', $authPayload);
        $ctrl->show($id);
        exit;
    }
    if ($method === 'PUT' || $method === 'PATCH') {
        AuthMiddleware::authorize('vehicles', 'update', $authPayload);
        $ctrl->update($id);
        exit;
    }
    if ($method === 'DELETE') {
        AuthMiddleware::authorize('vehicles', 'delete', $authPayload);
        $ctrl->destroy($id);
        exit;
    }
}

if ($method === 'GET') {
    AuthMiddleware::authorize('vehicles', 'read', $authPayload);
    $ctrl->index();
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::authorize('vehicles', 'create', $authPayload);
    $ctrl->store();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Vehicle endpoint not found']);
