<?php
// Run: php api/tests/jwt_test.php   (exits non-zero on failure)
require_once __DIR__ . '/../utils/jwt.php';

$failures = 0;
function check(string $name, bool $ok): void {
    global $failures;
    echo ($ok ? 'PASS' : 'FAIL') . "  $name\n";
    if (!$ok) $failures++;
}

putenv('JWT_SECRET');
try { getJwtSecret(); check('missing secret is rejected', false); }
catch (RuntimeException $e) { check('missing secret is rejected', true); }

putenv('JWT_SECRET=short');
try { getJwtSecret(); check('short secret is rejected', false); }
catch (RuntimeException $e) { check('short secret is rejected', true); }

$secret = str_repeat('k', 40);
putenv("JWT_SECRET=$secret");
check('valid secret is returned', getJwtSecret() === $secret);

$token = JWT::encode(['sub' => 1, 'exp' => time() + 60], $secret);
check('valid token decodes', (JWT::decode($token, $secret)['sub'] ?? null) === 1);
check('wrong secret rejected', JWT::decode($token, str_repeat('x', 40)) === false);
check('expired token rejected', JWT::decode(JWT::encode(['exp' => time() - 1], $secret), $secret) === false);
check('tampered token rejected', JWT::decode(substr($token, 0, -2) . 'xx', $secret) === false);

exit($failures ? 1 : 0);
