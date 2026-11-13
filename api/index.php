<?php
// api/index.php

// Ensure PHP warnings and notices never corrupt REST API JSON responses
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// -----------------------------------------------------------------------------
// 0. Transparent Response Compression (Gzip)
// -----------------------------------------------------------------------------
if (!ob_get_level() && !headers_sent() && extension_loaded('zlib')) {
    $acceptEncoding = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
    if (str_contains($acceptEncoding, 'gzip')) {
        ob_start('ob_gzhandler');
    }
}

// -----------------------------------------------------------------------------
// 1. Comprehensive HTTP Security Headers
// -----------------------------------------------------------------------------
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
header("Permissions-Policy: camera=(), microphone=(), geolocation=()");
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

// -----------------------------------------------------------------------------
// 2. Dynamic CORS Whitelist & Preflight Handling
// -----------------------------------------------------------------------------
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://car-repair-system-ebon.vercel.app',
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
$isDev = (getenv('APP_ENV') ?: 'production') === 'development';
$isLocalNetwork = (bool) preg_match('#^https?://(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+)(?::\d+)?$#', $origin);

if ($origin && (in_array($origin, $allowedOrigins, true) || ($isDev && $isLocalNetwork))) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
$reqHeaders = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? '';
if ($reqHeaders) {
    header("Access-Control-Allow-Headers: $reqHeaders");
} else {
    header("Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, X-Client-Version, Cache-Control, Pragma, Expires, Origin");
}
header("Access-Control-Max-Age: 86400"); // 24 hours preflight cache

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// -----------------------------------------------------------------------------
// 3. Core Dependencies & Utilities
// -----------------------------------------------------------------------------
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/utils/headers.php';
require_once __DIR__ . '/utils/jwt.php';
require_once __DIR__ . '/utils/cache.php';
require_once __DIR__ . '/utils/sanitizer.php';
require_once __DIR__ . '/utils/rateLimit.php';
require_once __DIR__ . '/utils/pagination.php';
require_once __DIR__ . '/utils/eventBus.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// Sanitize global incoming inputs to prevent XSS injection
$_GET     = Sanitizer::clean($_GET);
$_POST    = Sanitizer::clean($_POST);
$_COOKIE  = Sanitizer::clean($_COOKIE);
$_REQUEST = Sanitizer::clean($_REQUEST);

// Global Authentication helper: Unified with AuthMiddleware
function authenticate() {
    return AuthMiddleware::requireAuth();
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

// -----------------------------------------------------------------------------
// 4. Global API Rate Limiting / Flooding Protection (120 req/min per IP)
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS' && $module !== 'health' && $module !== '') {
    if (RateLimiter::isGlobalThrottled(120, 1)) {
        http_response_code(429);
        header('Retry-After: 60');
        echo json_encode([
            'error' => 'Too Many Requests',
            'message' => 'API rate limit exceeded. Maximum 120 requests per minute.'
        ]);
        exit;
    }
}

try {
    switch ($module) {
    case 'health':
        if (($segments[1] ?? '') === 'db') {
            // Deep check: opens a real connection and reports a coarse failure category.
            // Throttled because every call costs a database connection.
            $hits = Cache::increment('healthdb:' . RateLimiter::getClientIp(), 60);
            if ($hits !== null && $hits > 10) {
                http_response_code(429);
                header('Retry-After: 60');
                echo json_encode(['status' => 'error', 'message' => 'Too many health checks']);
                break;
            }
            $t = microtime(true);
            try {
                createPdoInstance()->query('SELECT 1');
                echo json_encode(['status' => 'ok', 'database' => 'up', 'latency_ms' => (int) round((microtime(true) - $t) * 1000)]);
            } catch (Throwable $e) {
                $category = dbErrorCategory($e);
                error_log(sprintf('Health DB check failed [%s]: %s', $category, $e->getMessage()));
                http_response_code(503);
                echo json_encode(['status' => 'error', 'database' => 'down', 'reason' => $category]);
            }
            break;
        }
        // fall through to shallow health
    case '':
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
    case 'sessions':
    case 'user-sessions':
    case 'user_sessions':
        require_once __DIR__ . '/routes/sessions.php';
        break;
    case 'audit-logs':
    case 'audit_logs':
    case 'auditlogs':
    case 'activity-logs':
    case 'activity_logs':
        require_once __DIR__ . '/routes/auditLogs.php';
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
    $isDebug = (getenv('APP_ENV') ?: 'production') === 'development';
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => $isDebug ? $e->getMessage() : 'An unexpected server error occurred. Please try again later.',
        'details' => $isDebug ? ['file' => $e->getFile(), 'line' => $e->getLine()] : null
    ]);
}
