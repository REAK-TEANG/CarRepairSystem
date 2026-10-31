<?php
// api/routes/employees.php
require_once __DIR__ . '/../controllers/EmployeeController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new EmployeeController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/employees/(\d+)/toggle-attendance$#', $path, $m)) {
    $id = (int) $m[1];
    AuthMiddleware::authorize('employees', 'update', $authPayload);
    $ctrl->toggleAttendance($id);
    exit;
}

if (preg_match('#^/employees/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT' || $method === 'PATCH') {
        AuthMiddleware::authorize('employees', 'update', $authPayload);
        $ctrl->update($id);
        exit;
    }
    if ($method === 'DELETE') {
        AuthMiddleware::authorize('employees', 'delete', $authPayload);
        $ctrl->destroy($id);
        exit;
    }
}

if ($path === '/employees/roles' && $method === 'GET') {
    AuthMiddleware::authorize('employees', 'read', $authPayload);
    $roles = Database::all('SELECT id, name, description FROM roles ORDER BY id ASC');
    echo json_encode(['data' => $roles]);
    exit;
}

if ($method === 'GET') {
    AuthMiddleware::authorize('employees', 'read', $authPayload);
    $ctrl->index();
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::authorize('employees', 'create', $authPayload);
    $ctrl->store();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Employee endpoint not found']);
