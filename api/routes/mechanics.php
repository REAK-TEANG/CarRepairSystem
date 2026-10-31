<?php
// api/routes/mechanics.php
require_once __DIR__ . '/../controllers/MechanicController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new MechanicController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/mechanics/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'GET') {
        AuthMiddleware::authorize('mechanics', 'read', $authPayload);
        $ctrl->show($id);
        exit;
    }
    if ($method === 'PUT' || $method === 'PATCH') {
        AuthMiddleware::authorize('mechanics', 'update', $authPayload);
        $ctrl->update($id);
        exit;
    }
    if ($method === 'DELETE') {
        AuthMiddleware::authorize('mechanics', 'delete', $authPayload);
        $ctrl->destroy($id);
        exit;
    }
}

if ($method === 'GET') {
    AuthMiddleware::authorize('mechanics', 'read', $authPayload);
    $ctrl->index();
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::authorize('mechanics', 'create', $authPayload);
    $ctrl->store();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Mechanic endpoint not found']);
