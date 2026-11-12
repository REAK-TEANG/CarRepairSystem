<?php
// Applies pending api/schema/*.sql files in filename order. Run at container start
// (see entrypoint.sh) or manually: php api/bin/migrate.php
// Exits non-zero on failure so deploys can notice; each file runs in one transaction.

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = createPdoInstance();
    $pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
    )');
    $applied = $pdo->query('SELECT filename FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);

    $files = glob(__DIR__ . '/../schema/*.sql') ?: [];
    sort($files);
    foreach ($files as $file) {
        $name = basename($file);
        if (in_array($name, $applied, true)) {
            continue;
        }
        $pdo->beginTransaction();
        try {
            $pdo->exec(file_get_contents($file));
            $insert = $pdo->prepare('INSERT INTO schema_migrations (filename) VALUES (?)');
            $insert->execute([$name]);
            $pdo->commit();
            echo "applied $name\n";
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw new RuntimeException("$name failed: " . $e->getMessage(), 0, $e);
        }
    }
    echo "schema up to date\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'migration error: ' . $e->getMessage() . "\n");
    exit(1);
}
