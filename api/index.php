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
    foreach (explode(',', $envFrontend) as $url) {
        $trimmed = trim(rtrim($url, '/'));
        if ($trimmed) $allowedOrigins[] = $trimmed;
    }
}
if ($envClient = getenv('CLIENT_URL')) {
    foreach (explode(',', $envClient) as $url) {
        $trimmed = trim(rtrim($url, '/'));
        if ($trimmed) $allowedOrigins[] = $trimmed;
    }
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$isDev = (getenv('APP_ENV') ?: 'development') === 'development';
$isVercelOrigin = (bool) preg_match('#^https://[a-zA-Z0-9\-_.]+\.vercel\.app$#i', $origin);

if ($origin && (in_array($origin, $allowedOrigins) || $isVercelOrigin || $isDev)) {
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
require_once __DIR__ . '/utils/headers.php';
require_once __DIR__ . '/utils/jwt.php';
require_once __DIR__ . '/utils/cache.php';
require_once __DIR__ . '/utils/pagination.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

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
    $token = getBearerToken();
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'No authorization token provided']);
        exit;
    }
    
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

// Router: normalize $path and extract $module regardless of root/subfolder deployment
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

// Strip script filename if present (e.g. index.php)
$cleanUri = preg_replace('#^.*?/index\.php#i', '', $requestUri);

// If URL contains /api or /api/, extract whatever follows /api
if (preg_match('#(?:^|/)api(?:/(.*))?$#i', $cleanUri, $apiMatches)) {
    $path = '/' . ($apiMatches[1] ?? '');
} else {
    // If running under a subfolder in WAMP without explicit /api/ prefix
    $scriptDir = trim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
    if ($scriptDir && str_starts_with($cleanUri, '/' . $scriptDir)) {
        $cleanUri = substr($cleanUri, strlen('/' . $scriptDir));
    }
    $path = '/' . ltrim($cleanUri, '/');
}

$path = '/' . trim($path, '/');
if ($path === '//') $path = '/';
$segments = array_values(array_filter(explode('/', trim($path, '/'))));
$module = strtolower($segments[0] ?? '');

try {
    switch ($module) {
    case '':
    case 'health':
        echo json_encode([
            'status' => 'ok',
            'service' => 'Car Repair Shop Management API',
            'version' => '1.0.0',
            'environment' => getenv('APP_ENV') ?: 'development',
            'timestamp' => date('c'),
        ]);
        break;
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
