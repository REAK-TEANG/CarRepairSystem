<?php
// api/routes/repairJobs.php
require_once __DIR__ . '/../controllers/RepairJobController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new RepairJobController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/(?:repair-orders|repair-jobs|repair_jobs|repairjobs)/(\d+)(?:/status)?$#i', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'GET') {
        AuthMiddleware::authorize('repair_jobs', 'read', $authPayload);
        $ctrl->show($id);
        exit;
    }
    if ($method === 'PUT' || $method === 'PATCH') {
        AuthMiddleware::authorize('repair_jobs', 'update', $authPayload);
        $ctrl->update($id, $authPayload);
        exit;
    }
    if ($method === 'DELETE') {
        AuthMiddleware::authorize('repair_jobs', 'delete', $authPayload);
        $ctrl->destroy($id);
        exit;
    }
}

if ($method === 'GET') {
    AuthMiddleware::authorize('repair_jobs', 'read', $authPayload);
    $ctrl->index();
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::authorize('repair_jobs', 'create', $authPayload);
    $ctrl->store($authPayload);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Repair job endpoint not found']);
