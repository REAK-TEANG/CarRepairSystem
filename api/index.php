<?php
// api/index.php — Front Controller

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/utils/jwt.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// Normalize request path
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path       = str_replace('/api/', '/', $requestUri);
if (strpos($path, '/') !== 0) {
    $path = '/' . $path;
}

$segments = explode('/', trim($path, '/'));
$module   = $segments[0] ?? '';

try {
    switch ($module) {
        case 'auth':
            require_once __DIR__ . '/routes/auth.php';
            break;
        case 'customers':
            require_once __DIR__ . '/routes/customers.php';
            break;
        case 'vehicles':
            require_once __DIR__ . '/routes/vehicles.php';
            break;
        case 'appointments':
            require_once __DIR__ . '/routes/appointments.php';
            break;
        case 'employees':
            require_once __DIR__ . '/routes/employees.php';
            break;
        case 'mechanics':
            require_once __DIR__ . '/routes/mechanics.php';
            break;
        case 'services':
            require_once __DIR__ . '/routes/services.php';
            break;
        case 'inventory':
        case 'spare-parts':
            require_once __DIR__ . '/routes/inventory.php';
            break;
        case 'suppliers':
            require_once __DIR__ . '/routes/suppliers.php';
            break;
        case 'invoices':
            require_once __DIR__ . '/routes/invoices.php';
            break;
        case 'repairjobs':
        case 'repair-jobs':
        case 'repair_jobs':
        case 'repair-orders':
            require_once __DIR__ . '/routes/repairJobs.php';
            break;
        case 'reports':
        case 'dashboard':
        case 'dashboard-metrics':
            require_once __DIR__ . '/routes/reports.php';
            break;
        case 'settings':
            require_once __DIR__ . '/routes/settings.php';
            break;
        case 'service-reminders':
        case 'service_reminders':
        case 'servicereminders':
            require_once __DIR__ . '/routes/serviceReminders.php';
            break;
        case 'health':
            echo json_encode(['status' => 'ok', 'backend' => 'PHP MVC']);
            break;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'path' => $path]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error'   => 'Internal Server Error',
        'message' => $e->getMessage(),
        'file'    => $e->getFile(),
        'line'    => $e->getLine(),
    ]);
}
