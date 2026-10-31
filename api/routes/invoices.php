<?php
// api/routes/invoices.php
require_once __DIR__ . '/../controllers/InvoiceController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new InvoiceController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/invoices/(\d+)/(?:pay|payments)$#', $path, $m)) {
    $id = (int) $m[1];
    AuthMiddleware::authorize('invoices', 'update', $authPayload);
    $ctrl->pay($id, $authPayload);
    exit;
}

if ($method === 'GET') {
    AuthMiddleware::authorize('invoices', 'read', $authPayload);
    $ctrl->index();
    exit;
}

if ($method === 'POST') {
    AuthMiddleware::authorize('invoices', 'create', $authPayload);
    $ctrl->store();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Invoice endpoint not found']);
