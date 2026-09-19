<?php
// api/routes/settings.php
require_once __DIR__ . '/../controllers/SettingsController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new SettingsController();
$method      = $_SERVER['REQUEST_METHOD'];

if ($path === '/settings/permissions') {
    if ($method === 'GET') { $ctrl->getPermissions();               exit; }
    if ($method === 'PUT') { $ctrl->updatePermissions($authPayload); exit; }
}

if ($path === '/settings' || $path === '/settings/') {
    if ($method === 'GET') { $ctrl->index();  exit; }
    if ($method === 'PUT') { $ctrl->update(); exit; }
}

http_response_code(404);
echo json_encode(['error' => 'Settings endpoint not found']);
