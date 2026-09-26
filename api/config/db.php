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
$usePersistent = filter_var(getenv('DB_PERSISTENT') ?: 'true', FILTER_VALIDATE_BOOLEAN);

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    if ($usePersistent) {
        $options[PDO::ATTR_PERSISTENT] = true;
    }
    $pdo = new PDO($dsn, $user, $password, $options);
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    $isDev = (getenv('APP_ENV') ?: 'development') === 'development';
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $isDev ? $e->getMessage() : 'Unable to connect to database. Please check server configuration.'
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

function run($sql, $params = []) {
    global $pdo;
    $stmt = query($sql, $params);
    return ['rowCount' => $stmt->rowCount(), 'lastInsertId' => $pdo->lastInsertId()];
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
