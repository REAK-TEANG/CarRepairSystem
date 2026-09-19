<?php
// api/middleware/AuthMiddleware.php

class AuthMiddleware
{
    /**
     * Validate Bearer token and return decoded payload.
     * Terminates execution with 401 if the token is absent or invalid.
     */
    public static function requireAuth(): array
    {
        $headers    = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(['error' => 'No token provided']);
            exit;
        }

        $token  = $matches[1];
        $secret = getenv('JWT_SECRET') ?: 'carrepair_super_secret_jwt_key_2026_x89!@#%^&_workshop_pro';

        $payload = JWT::decode($token, $secret);
        if (!$payload) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token']);
            exit;
        }

        return $payload;
    }

    /**
     * Require admin role specifically. Terminates with 403 if not admin.
     */
    public static function requireAdmin(array $payload): void
    {
        if (($payload['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden — Admin access required']);
            exit;
        }
    }
}
