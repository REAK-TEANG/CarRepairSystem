<?php
// Run: php api/tests/rate_limit_test.php
// Global request limiter: which bucket a request counts against, and the counting itself.
// A stand-in for APCu is defined so the counter works without the extension.

if (!function_exists('apcu_enabled')) {
    $GLOBALS['__apcu'] = [];
    function apcu_enabled() { return true; }
    function apcu_fetch($k, &$ok = null) { $ok = array_key_exists($k, $GLOBALS['__apcu']); return $ok ? $GLOBALS['__apcu'][$k] : false; }
    function apcu_store($k, $v, $ttl = 0) { $GLOBALS['__apcu'][$k] = $v; return true; }
    function apcu_add($k, $v, $ttl = 0) { if (array_key_exists($k, $GLOBALS['__apcu'])) return false; $GLOBALS['__apcu'][$k] = $v; return true; }
    function apcu_inc($k) { return ++$GLOBALS['__apcu'][$k]; }
    function apcu_delete($k) { unset($GLOBALS['__apcu'][$k]); return true; }
}

$secret = str_repeat('s', 40);
putenv("JWT_SECRET=$secret");
putenv('REDIS_HOST');
putenv('TRUSTED_PROXY=none');
$_SERVER['REMOTE_ADDR'] = '198.51.100.20';
require_once __DIR__ . '/../utils/rateLimit.php';

$failures = 0;
function check(string $name, bool $ok): void {
    global $failures;
    echo ($ok ? 'PASS' : 'FAIL') . "  $name\n";
    if (!$ok) $failures++;
}

$ipBucket = ['ip:198.51.100.20', RateLimiter::ANONYMOUS_LIMIT];

// Bucket selection
check('no token -> IP bucket', RateLimiter::requestBucket(null) === $ipBucket);
check('garbage token -> IP bucket', RateLimiter::requestBucket('not-a-jwt') === $ipBucket);

$valid = JWT::encode(['id' => 42, 'role' => 'mechanic', 'exp' => time() + 60], $secret);
check('valid token -> that user\'s own bucket', RateLimiter::requestBucket($valid) === ['user:42', RateLimiter::USER_LIMIT]);

$forged = JWT::encode(['id' => 42, 'exp' => time() + 60], str_repeat('x', 40));
check('token signed with another secret -> IP bucket', RateLimiter::requestBucket($forged) === $ipBucket);

$expired = JWT::encode(['id' => 42, 'exp' => time() - 1], $secret);
check('expired token -> IP bucket', RateLimiter::requestBucket($expired) === $ipBucket);

$noId = JWT::encode(['role' => 'admin', 'exp' => time() + 60], $secret);
check('token without a user id -> IP bucket', RateLimiter::requestBucket($noId) === $ipBucket);

check('signed-in users get a larger allowance than anonymous traffic', RateLimiter::USER_LIMIT > RateLimiter::ANONYMOUS_LIMIT);

// Counting
$results = [];
for ($i = 0; $i < 4; $i++) { $results[] = RateLimiter::isGlobalThrottled('ip:198.51.100.20', 3); }
check('allows up to the limit, then blocks', $results === [false, false, false, true]);
check('another user\'s bucket is independent', RateLimiter::isGlobalThrottled('user:42', 3) === false);
check('another IP\'s bucket is independent', RateLimiter::isGlobalThrottled('ip:203.0.113.1', 3) === false);

exit($failures ? 1 : 0);
