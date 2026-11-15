<?php
// Run: php api/tests/authorization_test.php [api-base-url]   (default http://127.0.0.1:8098)
// Every role x every endpoint. Expected outcome comes from the live permissions matrix:
//   not permitted -> must be 403;  permitted -> must not be 403 (and never 401).
// Writes target record id 999999999 (does not exist), so nothing is changed. Create (POST to a
// collection) is only sent where it must be refused, so no records are ever created.

$_SERVER['APP_ENV'] = $_SERVER['APP_ENV'] ?? 'development';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/cache.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../models/SessionModel.php';

$base = rtrim($argv[1] ?? 'http://127.0.0.1:8098', '/');
$missing = 999999999;

function api(string $method, string $path, ?string $token, ?array $body = null): int {
    global $base;
    $headers = "Content-Type: application/json\r\n" . ($token ? "Authorization: Bearer $token\r\n" : '');
    $ctx = stream_context_create(['http' => ['method' => $method, 'header' => $headers, 'content' => $body === null ? '' : json_encode($body), 'ignore_errors' => true, 'timeout' => 20]]);
    @file_get_contents($base . $path, false, $ctx);
    return isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m) ? (int) $m[1] : 0;
}

// [method, path, module, action] ; module null = special rule given in $special
$checks = [];
$crud = [
    'customers' => 'customers', 'vehicles' => 'vehicles', 'appointments' => 'appointments',
    'repair-jobs' => 'repair_jobs', 'invoices' => 'invoices', 'spare-parts' => 'inventory',
    'suppliers' => 'suppliers', 'employees' => 'employees', 'mechanics' => 'mechanics',
    'services' => 'services', 'service-reminders' => 'service_reminders',
];
foreach ($crud as $path => $module) {
    $checks[] = ['GET', "/$path", $module, 'read'];
    $checks[] = ['GET', "/$path/$missing", $module, 'read'];
    $checks[] = ['PUT', "/$path/$missing", $module, 'update'];
    $checks[] = ['DELETE', "/$path/$missing", $module, 'delete'];
    $checks[] = ['POST', "/$path", $module, 'create'];
}
$checks[] = ['PATCH', "/appointments/$missing/status", 'appointments', 'update'];
$checks[] = ['PATCH', "/repair-jobs/$missing/status", 'repair_jobs', 'update'];
$checks[] = ['POST', "/invoices/$missing/payments", 'invoices', 'update'];
$checks[] = ['POST', "/spare-parts/$missing/adjust", 'inventory', 'update'];
$checks[] = ['GET', '/spare-parts/transactions', 'inventory', 'read'];
$checks[] = ['POST', "/employees/$missing/toggle-attendance", 'employees', 'update'];
$checks[] = ['GET', '/employees/roles', 'employees', 'read'];
$checks[] = ['GET', '/reports', 'reports', 'read'];
$checks[] = ['GET', '/settings', 'settings', 'read'];

// Fixed-role endpoints: [method, path, allowed roles]
$special = [
    ['PUT', '/settings', ['admin']],
    ['PUT', '/settings/permissions', ['admin']],
    ['GET', '/audit-logs', ['admin', 'manager']],
    ['GET', '/audit-logs/stats', ['admin', 'manager']],
    ['GET', '/audit-logs/export', ['admin', 'manager']],
    ['GET', '/sessions/active', ['admin', 'manager']],
    ['GET', '/sessions/history', ['admin', 'manager']],
    ['POST', '/sessions/revoke', ['admin']],
];

$roles = ['admin' => 'admin', 'manager' => 'manager', 'service_advisor' => 'advisor', 'mechanic' => 'mechanic', 'cashier' => 'cashier', 'storekeeper' => 'storekeeper'];
$failures = 0; $total = 0; $problems = [];

foreach ($roles as $role => $username) {
    $user = get("SELECT id, username FROM users WHERE username = ?", [$username]);
    if (!$user) { echo "SKIP  role $role: no user '$username'\n"; continue; }
    $payload = ['id' => (int) $user['id'], 'username' => $user['username'], 'role' => $role, 'exp' => time() + 600];
    $token = JWT::encode($payload, getJwtSecret());
    SessionModel::createSession((int) $user['id'], $token);

    foreach ($checks as [$method, $path, $module, $action]) {
        $allowed = AuthMiddleware::can($module, $action, $payload);
        if ($method === 'POST' && $action === 'create' && $allowed) continue; // would create a record
        $status = api($method, $path, $token, $method === 'GET' || $method === 'DELETE' ? null : []);
        $ok = $allowed ? ($status !== 403 && $status !== 401 && $status !== 0) : $status === 403;
        $total++;
        if (!$ok) { $failures++; $problems[] = sprintf('%-15s %-6s %-40s expected %-9s got %d', $role, $method, $path, $allowed ? 'allowed' : '403', $status); }
    }
    foreach ($special as [$method, $path, $allowedRoles]) {
        $allowed = in_array($role, $allowedRoles, true);
        if ($allowed && $method !== 'GET') continue; // never perform admin writes in a test
        $status = api($method, $path, $token, $method === 'GET' ? null : []);
        $ok = $allowed ? ($status !== 403 && $status !== 401) : $status === 403;
        $total++;
        if (!$ok) { $failures++; $problems[] = sprintf('%-15s %-6s %-40s expected %-9s got %d', $role, $method, $path, $allowed ? 'allowed' : '403', $status); }
    }

    // Event feed only carries events for modules the role may read
    $since = (int) get('SELECT COALESCE(MAX(id), 0) AS m FROM system_events')['m'];
    run("INSERT INTO system_events (topic, event_type, payload) VALUES ('invoices', 'authz_test', '{}'::jsonb)");
    $ctx = stream_context_create(['http' => ['header' => "Authorization: Bearer $token\r\n", 'ignore_errors' => true]]);
    $feed = json_decode((string) @file_get_contents("$base/events/poll?afterId=$since", false, $ctx), true);
    $seesInvoiceEvent = in_array('authz_test', array_column($feed['data'] ?? [], 'event_type'), true);
    $total++;
    if ($seesInvoiceEvent !== AuthMiddleware::can('invoices', 'read', $payload)) {
        $failures++; $problems[] = "$role sees invoice events: " . var_export($seesInvoiceEvent, true) . ', may read invoices: ' . var_export(AuthMiddleware::can('invoices', 'read', $payload), true);
    }
    run("DELETE FROM system_events WHERE event_type = 'authz_test'");
    SessionModel::closeSession($token);
}

// Unauthenticated
foreach (['/customers', '/settings/permissions', '/events/poll', '/audit-logs', '/reports'] as $p) {
    $total++;
    if (($s = api('GET', $p, null)) !== 401) { $failures++; $problems[] = "anonymous GET $p expected 401 got $s"; }
}
$total++;
if (($s = api('GET', '/auth/permissions', null)) === 200) { $failures++; $problems[] = "anonymous GET /auth/permissions still returns the matrix"; }

foreach ($problems as $p) echo "FAIL  $p\n";
echo ($failures ? "FAIL" : "PASS") . "  authorization matrix: " . ($total - $failures) . "/$total checks as expected\n";
exit($failures ? 1 : 0);
