<?php
// api/routes/employees.php
require_once __DIR__ . '/../controllers/EmployeeController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new EmployeeController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/employees/(\d+)/toggle-attendance$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'POST') { $ctrl->toggleAttendance($id); exit; }
}

if (preg_match('#^/employees/(\d+)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'PUT')    { $ctrl->update($id);  exit; }
    if ($method === 'DELETE') { $ctrl->destroy($id); exit; }
}

if ($method === 'GET')  { $ctrl->index(); exit; }
if ($method === 'POST') { $ctrl->store(); exit; }

http_response_code(404);
echo json_encode(['error' => 'Employee endpoint not found']);
