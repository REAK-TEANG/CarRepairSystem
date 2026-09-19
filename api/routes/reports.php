<?php
// api/routes/reports.php
require_once __DIR__ . '/../controllers/ReportController.php';

$authPayload = AuthMiddleware::requireAuth();
$ctrl        = new ReportController();
$method      = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if ($path === '/reports' || $path === '/reports/')                              { $ctrl->summary();          exit; }
if ($path === '/reports/dashboard-metrics' || $path === '/dashboard-metrics')  { $ctrl->dashboardMetrics(); exit; }
if (preg_match('#^/reports/revenue#', $path))                                  { $ctrl->revenue();          exit; }

http_response_code(404);
echo json_encode(['error' => 'Reports endpoint not found']);
