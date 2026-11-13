<?php
// Run: php api/tests/db_error_test.php
// Verifies connection failures map to safe categories (and that no secrets can leak through them).
require_once __DIR__ . '/../config/db.php';

$failures = 0;
function check(string $name, bool $ok): void {
    global $failures;
    echo ($ok ? 'PASS' : 'FAIL') . "  $name\n";
    if (!$ok) $failures++;
}

$cases = [
    'auth_failed'  => [
        'SQLSTATE[08006] [7] connection to server at "aws-0.pooler.supabase.com" (1.2.3.4), port 6543 failed: FATAL:  password authentication failed for user "postgres.abc"',
        'SQLSTATE[08006] [7] connection to server failed: FATAL:  Tenant or user not found',
        'SQLSTATE[08006] [7] fe_sendauth: no password supplied',
    ],
    'pool_full'    => [
        'SQLSTATE[08006] [7] FATAL:  Max client connections reached',
        'SQLSTATE[08006] [7] FATAL:  (EMAXCONNSESSION) max clients reached in session mode',
        'SQLSTATE[08006] [7] FATAL:  remaining connection slots are reserved for non-replication superuser connections',
        'SQLSTATE[08006] [7] FATAL:  sorry, too many clients already',
    ],
    'ssl_error'    => ['SQLSTATE[08006] [7] SSL error: certificate verify failed'],
    'unreachable'  => [
        'SQLSTATE[08006] [7] could not translate host name "db.example" to address: Name or service not known',
        'SQLSTATE[08006] [7] connection to server at "10.0.0.1", port 5432 failed: Connection refused',
        'SQLSTATE[08006] [7] connection to server failed: timeout expired',
    ],
    'db_not_found' => ['SQLSTATE[08006] [7] FATAL:  database "carrepair" does not exist'],
    'unknown'      => ['something completely unexpected'],
];
foreach ($cases as $expected => $messages) {
    foreach ($messages as $m) {
        $got = dbErrorCategory(new PDOException($m));
        check("$expected <- " . substr($m, 0, 60), $got === $expected);
    }
}

// Categories are fixed words only: nothing from the message can appear in them.
$leaky = 'password authentication failed for user "postgres.secretref" at aws-0.pooler.supabase.com';
$cat = dbErrorCategory(new PDOException($leaky));
check('category never contains host or user', !preg_match('/supabase|postgres|secretref/i', $cat));

exit($failures ? 1 : 0);
