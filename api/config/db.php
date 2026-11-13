<?php
// api/config/db.php

// Simple .env parser to avoid requiring external libraries
function loadEnv($path) {
    if (!file_exists($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2) + [NULL, NULL];
        if ($name !== NULL && $value !== NULL) {
            $name = trim($name);
            $value = trim($value, " \t\n\r\0\x0B\"'");
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

// Load env from the root directory if exists (fallback to server/.env during transition)
if (file_exists(__DIR__ . '/../../.env')) {
    loadEnv(__DIR__ . '/../../.env');
} else if (file_exists(__DIR__ . '/../../server/.env')) {
    loadEnv(__DIR__ . '/../../server/.env');
}

/**
 * Database settings, resolved once. Deliberately a function with a static cache rather
 * than top-level variables: route files run in the global scope and use names like
 * $user and $password, which would silently overwrite global settings.
 */
function dbConfig(): array {
    static $config = null;
    if ($config === null) {
        $host = getenv('DB_HOST') ?: 'localhost';
        $config = [
            'host'       => $host,
            'port'       => getenv('DB_PORT') ?: '5432',
            'dbname'     => getenv('DB_NAME') ?: 'carrepairshop',
            'user'       => getenv('DB_USER') ?: 'postgres',
            'password'   => getenv('DB_PASSWORD') ?: '',
            'persistent' => filter_var(getenv('DB_PERSISTENT') ?: 'false', FILTER_VALIDATE_BOOLEAN),
            'sslmode'    => getenv('DB_SSLMODE') ?: (($host === 'localhost' || $host === '127.0.0.1') ? 'disable' : 'require'),
        ];
    }
    return $config;
}

/**
 * Instantiate a fresh PDO instance configured for PostgreSQL and PgBouncer connection poolers
 */
function createPdoInstance() {
    $c = dbConfig();
    $dsn = "pgsql:host={$c['host']};port={$c['port']};dbname={$c['dbname']};sslmode={$c['sslmode']}";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        // Emulated prepares must be true for PgBouncer transaction pooling (Supabase port 6543)
        // to prevent prepared statement name collisions across pooled connections
        PDO::ATTR_EMULATE_PREPARES => true,
    ];
    if ($c['persistent']) {
        $options[PDO::ATTR_PERSISTENT] = true;
    }
    return new PDO($dsn, $c['user'], $c['password'], $options);
}

/**
 * Map a connection failure to a coarse, non-sensitive category that is safe to show
 * operators (health endpoint) without revealing hosts, users or passwords.
 * Full details stay in the server log.
 */
function dbErrorCategory(Throwable $e): string {
    $msg = $e->getMessage();
    $rules = [
        'auth_failed'  => '/password authentication failed|Tenant or user not found|authentication failed|no password supplied|role ".*" does not exist/i',
        'pool_full'    => '/max(imum)? (client|connection)s?|too many (clients|connections)|remaining connection slots|EMAXCONN/i',
        'ssl_error'    => '/SSL|certificate/i',
        'unreachable'  => '/could not (connect|translate host|resolve)|connection (refused|timed out)|timeout expired|Name or service not known|No route to host|Network is unreachable/i',
        'db_not_found' => '/database ".*" does not exist/i',
    ];
    foreach ($rules as $category => $pattern) {
        if (preg_match($pattern, $msg)) {
            return $category;
        }
    }
    return 'unknown';
}

/**
 * Lazily open the shared PDO connection on first use. Requests that never touch
 * the database (health checks, auth rejections) skip the TLS handshake entirely.
 * Pass $reconnect = true to replace a severed connection. The connection lives in a
 * static, not a global, so route code cannot overwrite it.
 */
function db(bool $reconnect = false): PDO {
    static $connection = null;
    if ($reconnect || $connection === null) {
        try {
            $connection = createPdoInstance();
        } catch (PDOException $e) {
            error_log(sprintf('Database connection failed [%s]: %s', dbErrorCategory($e), $e->getMessage()));
            http_response_code(503);
            header('Retry-After: 5');
            echo json_encode(['error' => 'Service Unavailable', 'message' => 'Database is temporarily unavailable']);
            exit;
        }
    }
    return $connection;
}

/**
 * Determine if a PDOException was caused by a severed or stale connection
 */
function isConnectionLost(Throwable $e): bool {
    $msg = $e->getMessage();
    $code = (string) $e->getCode();
    return $code === '08006' ||
           $code === '57P01' ||
           stripos($msg, 'server closed the connection') !== false ||
           stripos($msg, 'SSL SYSCALL error') !== false ||
           stripos($msg, 'connection to server') !== false ||
           stripos($msg, 'Broken pipe') !== false ||
           stripos($msg, 'terminating connection') !== false ||
           stripos($msg, 'no connection to the server') !== false ||
           stripos($msg, 'could not receive data from server') !== false;
}

function query($sql, $params = []) {
    $pdo = db();
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch (PDOException $e) {
        // If connection was severed by PgBouncer or network timeout, reconnect and retry once
        if (isConnectionLost($e) && !$pdo->inTransaction()) {
            error_log("Database connection dropped, auto-reconnecting: " . $e->getMessage());
            try {
                $pdo = db(true);
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                return $stmt;
            } catch (Throwable $retryException) {
                error_log("Database reconnect retry failed: " . $retryException->getMessage());
                throw $retryException;
            }
        }
        throw $e;
    }
}

function get($sql, $params = []) {
    $stmt = query($sql, $params);
    return $stmt->fetch();
}

function all($sql, $params = []) {
    $stmt = query($sql, $params);
    return $stmt->fetchAll();
}

function getAll($sql, $params = []) {
    return all($sql, $params);
}

function run($sql, $params = []) {
    $stmt = query($sql, $params);
    $lastId = null;
    $trimmed = ltrim($sql);
    if (stripos($trimmed, 'INSERT') === 0) {
        try {
            $lastId = db()->lastInsertId();
        } catch (Throwable $e) {
            $lastId = null;
        }
    }
    return ['rowCount' => $stmt->rowCount(), 'lastInsertId' => $lastId];
}

/**
 * Execute a callback within an atomic database transaction
 * Automatically rolls back on any Exception/Throwable and re-throws.
 */
function transaction(callable $callback) {
    $pdo = db();
    if ($pdo->inTransaction()) {
        return $callback($pdo);
    }
    // Ping/test connection before starting transaction
    try {
        $pdo->query("SELECT 1");
    } catch (Throwable $e) {
        if (isConnectionLost($e)) {
            $pdo = db(true);
        }
    }
    $pdo->beginTransaction();
    try {
        $result = $callback($pdo);
        $pdo->commit();
        return $result;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Generate a collision-free unique code for a given table/column.
 * Uses MAX-based extraction instead of COUNT(*) to avoid gaps/collision issues.
 *
 * @param string $table     Table name (unquoted, trusted input)
 * @param string $column    Column name holding the code
 * @param string $prefix    e.g. 'RO-2026', 'INV-2026', 'CUST'
 * @param int    $padLength Zero-pad length for the numeric suffix
 * @return string           e.g. 'RO-2026-0059'
 */
function generateUniqueCode(string $table, string $column, string $prefix, int $padLength = 4): string {
    $rows = all(
        "SELECT $column FROM $table WHERE $column LIKE ? ORDER BY id DESC LIMIT 100",
        ["$prefix-%"]
    );
    $maxNum = 0;
    foreach ($rows as $r) {
        if (preg_match('/(\d+)$/', $r[$column] ?? '', $m)) {
            $num = (int) $m[1];
            if ($num > $maxNum) $maxNum = $num;
        }
    }
    $next = $maxNum + 1;
    do {
        $candidate = sprintf('%s-%0' . $padLength . 'd', $prefix, $next++);
        $exists = get("SELECT 1 FROM $table WHERE $column = ?", [$candidate]);
    } while ($exists);
    return $candidate;
}

class Database {
    public static function query($sql, $params = []) { return query($sql, $params); }
    public static function get($sql, $params = []) { return get($sql, $params); }
    public static function all($sql, $params = []) { return all($sql, $params); }
    public static function getAll($sql, $params = []) { return all($sql, $params); }
    public static function run($sql, $params = []) { return run($sql, $params); }
    public static function transaction(callable $callback) { return transaction($callback); }
}
