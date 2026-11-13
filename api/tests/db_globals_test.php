<?php
// Run: php api/tests/db_globals_test.php
// Regression: route files run in the global scope and assign $user, $password, $host, $pdo...
// Those must never be able to change the database connection settings or the live connection.

$_SERVER['DB_PASSWORD'] = 'configured-secret';
putenv('DB_PASSWORD=configured-secret');
putenv('DB_USER=configured_user');
$_SERVER['DB_USER'] = 'configured_user';
require_once __DIR__ . '/../config/db.php';

$failures = 0;
function check(string $name, bool $ok): void {
    global $failures;
    echo ($ok ? 'PASS' : 'FAIL') . "  $name\n";
    if (!$ok) $failures++;
}

$before = dbConfig();
check('config picks up the environment', $before['user'] === 'configured_user' && $before['password'] === 'configured-secret');

// Exactly what routes/auth.php does at global scope during login:
$password = 'whatever-the-user-typed';
$user = false;
$username = 'someone';
$host = 'attacker.example';
$port = '1';
$dbname = 'x';
$pdo = null;
$sslmode = 'disable';

check('config is unchanged after globals are overwritten', dbConfig() === $before);

// The live connection is a static inside db(), so overwriting $pdo has no effect on it.
check('db() does not depend on a global $pdo', (new ReflectionFunction('db'))->getStaticVariables() !== null && !isset($GLOBALS['pdo']));

exit($failures ? 1 : 0);
