<?php
// Run: php api/tests/rls_lockdown_test.php   (needs a database where you are a superuser; changes are rolled back)
$_SERVER['APP_ENV'] = $_SERVER['APP_ENV'] ?? 'development';
require_once __DIR__ . '/../config/db.php';

$failures = 0;
function check(string $name, bool $ok): void {
    global $failures;
    echo ($ok ? 'PASS' : 'FAIL') . "  $name\n";
    if (!$ok) $failures++;
}

$sql = file_get_contents(__DIR__ . '/../schema/003_lock_down_public_api.sql');
$pdo = createPdoInstance();
$pdo->beginTransaction();
try {
    // Simulate Supabase: public roles that currently have access, plus an allow-all policy.
    $pdo->exec("CREATE ROLE rls_test_anon NOLOGIN");
    $pdo->exec("GRANT SELECT ON users TO rls_test_anon");
    $pdo->exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO rls_test_anon");
    $pdo->exec("CREATE POLICY test_allow_all ON users FOR SELECT USING (true)");
    // The migration revokes from roles literally named anon/authenticated; create those too.
    $pdo->exec("CREATE ROLE anon NOLOGIN");
    $pdo->exec("GRANT SELECT ON users TO anon");
    $pdo->exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon");

    check('before: anon can read users', (bool) $pdo->query("SELECT has_table_privilege('anon','users','SELECT')")->fetchColumn());

    $pdo->exec($sql);
    $pdo->exec($sql); // idempotent
    check('migration applies twice without error', true);

    $off = $pdo->query("SELECT string_agg(tablename, ',') FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity")->fetchColumn();
    check('RLS is enabled on every public table' . ($off ? " (off: $off)" : ''), $off === null || $off === '');
    check('no policies remain', (int) $pdo->query("SELECT COUNT(*) FROM pg_policies WHERE schemaname='public'")->fetchColumn() === 0);
    check('anon can no longer read users', !$pdo->query("SELECT has_table_privilege('anon','users','SELECT')")->fetchColumn());

    $pdo->exec("CREATE TABLE rls_test_future_table (id int)");
    check('tables created later are not readable by anon', !$pdo->query("SELECT has_table_privilege('anon','rls_test_future_table','SELECT')")->fetchColumn());

    // Replay every schema file in order: a later file that adds a table without enabling RLS fails here.
    $files = glob(__DIR__ . '/../schema/*.sql');
    sort($files);
    foreach ($files as $file) { $pdo->exec(file_get_contents($file)); }
    $open = $pdo->query("SELECT string_agg(tablename, ',') FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity")->fetchColumn();
    check('after all schema files, no table is left without RLS' . ($open ? " (open: $open)" : ''), $open === null || $open === '');

    // The application role must keep full access.
    $n = (int) $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    check("application role still reads users ($n rows)", $n > 0);

    // Guard: a role that cannot bypass RLS must not be able to apply the migration.
    $pdo->exec("CREATE ROLE rls_test_app NOLOGIN NOBYPASSRLS");
    $pdo->exec("GRANT USAGE ON SCHEMA public TO rls_test_app");
    $pdo->exec("SAVEPOINT guard");
    $pdo->exec("SET LOCAL ROLE rls_test_app");
    $refused = false;
    try { $pdo->exec($sql); } catch (PDOException $e) { $refused = str_contains($e->getMessage(), 'refusing to enable row level security'); }
    $pdo->exec("ROLLBACK TO SAVEPOINT guard");
    check('guard refuses a role that cannot bypass RLS', $refused);
} catch (Throwable $e) {
    check('test aborted: ' . $e->getMessage(), false);
}
$pdo->rollBack();
echo "rolled back (database unchanged)\n";
exit($failures ? 1 : 0);
