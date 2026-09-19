<?php
// api/routes/invoices.php
require_once __DIR__ . '/../controllers/InvoiceController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new InvoiceController();
$method      = $_SERVER['REQUEST_METHOD'];

if (preg_match('#^/invoices/(\d+)/(pay|payments)$#', $path, $m)) {
    $id = (int) $m[1];
    if ($method === 'POST') { $ctrl->pay($id, $authPayload); exit; }
}

if ($method === 'GET')  { $ctrl->index(); exit; }
if ($method === 'POST') { $ctrl->store(); exit; }

http_response_code(404);
echo json_encode(['error' => 'Invoice endpoint not found']);
