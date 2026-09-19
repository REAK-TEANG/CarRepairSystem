<?php
// api/routes/auth.php
require_once __DIR__ . '/../controllers/AuthController.php';

$ctrl   = new AuthController();
$method = $_SERVER['REQUEST_METHOD'];
$sub    = $segments[1] ?? '';

if ($method === 'POST' && $sub === 'login')       { $ctrl->login();      exit; }
if ($method === 'POST' && $sub === 'quick-login') { $ctrl->quickLogin(); exit; }
if ($method === 'GET'  && $sub === 'me') {
    $authPayload = AuthMiddleware::requireAuth();
    $ctrl->me($authPayload);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Auth endpoint not found']);
