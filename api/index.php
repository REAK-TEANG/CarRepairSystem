<?php
// api/index.php

// -----------------------------------------------------------------------------
// 1. Security Headers
// -----------------------------------------------------------------------------
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("Referrer-Policy: strict-origin-when-cross-origin");

// -----------------------------------------------------------------------------
// 2. Dynamic CORS Whitelist & Preflight Handling
// -----------------------------------------------------------------------------
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
];
if ($envFrontend = getenv('FRONTEND_URL')) {
    $allowedOrigins[] = rtrim($envFrontend, '/');
}
if ($envClient = getenv('CLIENT_URL')) {
    $allowedOrigins[] = rtrim($envClient, '/');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$isDev = (getenv('APP_ENV') ?: 'development') === 'development';

if ($origin && (in_array($origin, $allowedOrigins) || $isDev)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, X-Client-Version");
header("Access-Control-Max-Age: 86400"); // 24 hours preflight cache

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/utils/jwt.php';
require_once __DIR__ . '/utils/cache.php';

// Helper: Safely resolve JWT secret
function getJwtSecret() {
    $secret = getenv('JWT_SECRET');
    if (!$secret) {
        $isDev = (getenv('APP_ENV') ?: 'development') === 'development';
        if ($isDev) {
            return 'carrepair_super_secret_jwt_key_2026_x89!@#%^&_workshop_pro';
        }
        http_response_code(500);
        echo json_encode(['error' => 'Fatal: JWT_SECRET environment variable is not configured']);
        exit;
    }
    return $secret;
}

// Auth middleware function
function authenticate() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'No authorization token provided']);
        exit;
    }
    
    $token = $matches[1];
    $secret = getJwtSecret();
    
    $payload = JWT::decode($token, $secret);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }
    
    return $payload;
}

/**
 * Role-Based Access Control (RBAC) middleware check
 */
function authorizeRoles(array $allowedRoles, array $authPayload) {
    $userRole = strtolower($authPayload['role'] ?? '');
    $allowed = array_map('strtolower', $allowedRoles);
    if (!in_array($userRole, $allowed)) {
        http_response_code(403);
        echo json_encode([
            'error' => 'Forbidden',
            'message' => 'Your current role (' . ($authPayload['roleTitle'] ?? $userRole) . ') does not have permission to perform this action.'
        ]);
        exit;
    }
}

// Router
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Base path might be /api/ in production, but with php -S it might just be /
// Let's normalize it
$path = str_replace('/api/', '/', $requestUri);
if (strpos($path, '/') !== 0) {
    $path = '/' . $path;
}

$segments = explode('/', trim($path, '/'));
$module = $segments[0] ?? '';

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
    case 'events':
    case 'realtime':
        require_once __DIR__ . '/routes/events.php';
        break;
    case 'health':
        echo json_encode(['status' => 'ok', 'backend' => 'PHP']);
        break;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'path' => $path]);
            break;
    }
} catch (Throwable $e) {
    error_log(sprintf("[%s] Uncaught Exception: %s in %s on line %d\nStack Trace:\n%s", 
        date('Y-m-d H:i:s'), 
        $e->getMessage(), 
        $e->getFile(), 
        $e->getLine(), 
        $e->getTraceAsString()
    ));
    http_response_code(500);
    $isDev = (getenv('APP_ENV') ?: 'development') === 'development';
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => $isDev ? $e->getMessage() : 'An unexpected server error occurred. Please try again later.',
        'details' => $isDev ? ['file' => $e->getFile(), 'line' => $e->getLine()] : null
    ]);
}
