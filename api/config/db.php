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

$host = getenv('DB_HOST') ?: 'localhost';
$port = getenv('DB_PORT') ?: '5432';
$dbname = getenv('DB_NAME') ?: 'carrepairshop';
$user = getenv('DB_USER') ?: 'postgres';
$password = getenv('DB_PASSWORD') ?: '123';
$usePersistent = filter_var(getenv('DB_PERSISTENT') ?: 'false', FILTER_VALIDATE_BOOLEAN);

$sslmode = getenv('DB_SSLMODE') ?: (($host === 'localhost' || $host === '127.0.0.1') ? 'disable' : 'require');

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=$sslmode";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    if ($usePersistent) {
        $options[PDO::ATTR_PERSISTENT] = true;
    }
    $pdo = new PDO($dsn, $user, $password, $options);

    // Self-healing schema synchronization: Ensure enum values match application expectations
    static $schemaChecked = false;
    if (!$schemaChecked) {
        try {
            $pdo->exec("ALTER TYPE repair_status ADD VALUE IF NOT EXISTS 'In Progress'");
            $pdo->exec("ALTER TYPE repair_status ADD VALUE IF NOT EXISTS 'Cancelled'");
            $schemaChecked = true;
        } catch (Throwable $e) {
            // Ignore if already applied or restricted
        }
    }
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'config' => [
            'host' => $host,
            'port' => $port,
            'dbname' => $dbname,
            'user' => $user,
            'sslmode' => $sslmode,
            'has_password' => (!empty($password) && $password !== '123'),
        ]
    ]);
    exit;
}

function query($sql, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
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
    global $pdo;
    $stmt = query($sql, $params);
    $lastId = null;
    $trimmed = ltrim($sql);
    if (stripos($trimmed, 'INSERT') === 0) {
        try {
            $lastId = $pdo->lastInsertId();
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
    global $pdo;
    if ($pdo->inTransaction()) {
        return $callback($pdo);
    }
    $pdo->beginTransaction();
    try {
        $result = $callback($pdo);
        $pdo->commit();
        return $result;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Set the PostgreSQL Row Level Security (RLS) session context
 */
function setDatabaseUserContext($role = null, $userId = null) {
    global $pdo;
    if (!$pdo) return;
    try {
        if ($role !== null && $role !== '') {
            $stmt = $pdo->prepare("SET app.current_user_role = ?");
            $stmt->execute([(string) $role]);
        }
        if ($userId !== null && $userId !== '') {
            $stmt = $pdo->prepare("SET app.current_user_id = ?");
            $stmt->execute([(string) $userId]);
        }
    } catch (Throwable $e) {
        // Silently continue if session variables cannot be set
    }
}

class Database {
    public static function query($sql, $params = []) { return query($sql, $params); }
    public static function get($sql, $params = []) { return get($sql, $params); }
    public static function all($sql, $params = []) { return all($sql, $params); }
    public static function getAll($sql, $params = []) { return all($sql, $params); }
    public static function run($sql, $params = []) { return run($sql, $params); }
    public static function transaction(callable $callback) { return transaction($callback); }
    public static function setUserContext($role = null, $userId = null) { return setDatabaseUserContext($role, $userId); }
}
