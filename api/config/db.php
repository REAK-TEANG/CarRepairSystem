<?php
// api/config/db.php

class Database
{
    private static ?PDO $pdo = null;

    private static function loadEnv(string $path): void
    {
        if (!file_exists($path)) {
            return;
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            list($name, $value) = explode('=', $line, 2) + [NULL, NULL];
            if ($name !== NULL && $value !== NULL) {
                $name = trim($name);
                $value = trim($value);
                if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                    putenv(sprintf('%s=%s', $name, $value));
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }

    public static function getConnection(): PDO
    {
        if (self::$pdo === null) {
            if (file_exists(__DIR__ . '/../../.env')) {
                self::loadEnv(__DIR__ . '/../../.env');
            }

            $host     = getenv('DB_HOST') ?: 'localhost';
            $port     = getenv('DB_PORT') ?: '5432';
            $dbname   = getenv('DB_NAME') ?: 'carrepairshop';
            $user     = getenv('DB_USER') ?: 'postgres';
            $password = getenv('DB_PASSWORD') ?: '123';

            try {
                $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
                self::$pdo = new PDO($dsn, $user, $password, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed', 'message' => $e->getMessage()]);
                exit;
            }
        }
        return self::$pdo;
    }

    public static function query(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function get(string $sql, array $params = [])
    {
        $stmt = self::query($sql, $params);
        return $stmt->fetch();
    }

    public static function all(string $sql, array $params = []): array
    {
        $stmt = self::query($sql, $params);
        return $stmt->fetchAll();
    }

    public static function run(string $sql, array $params = []): array
    {
        $stmt = self::query($sql, $params);
        return [
            'rowCount'     => $stmt->rowCount(),
            'lastInsertId' => self::getConnection()->lastInsertId()
        ];
    }
}
