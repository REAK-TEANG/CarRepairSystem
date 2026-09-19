<?php
// api/controllers/AuthController.php

require_once __DIR__ . '/../models/AuthModel.php';
require_once __DIR__ . '/../utils/jwt.php';

class AuthController
{
    private const DEFAULT_ROLE_ACCOUNTS = [
        'admin'           => ['username' => 'admin',       'name' => 'Jane Doe',      'email' => 'admin@carrepair.com',   'roleName' => 'Admin',           'roleId' => 1, 'roleTitle' => 'System Administrator'],
        'manager'         => ['username' => 'manager',     'name' => 'Marcus Vance',  'email' => 'manager@workshop.com',  'roleName' => 'Manager',         'roleId' => 2, 'roleTitle' => 'Workshop Manager'],
        'service_advisor' => ['username' => 'advisor',     'name' => 'Sarah Jenkins', 'email' => 'advisor@workshop.com',  'roleName' => 'Service Advisor', 'roleId' => 3, 'roleTitle' => 'Service Advisor'],
        'mechanic'        => ['username' => 'mechanic',    'name' => 'Mike Johnson',  'email' => 'mike@workshop.com',     'roleName' => 'Mechanic',        'roleId' => 4, 'roleTitle' => 'Master Technician'],
        'cashier'         => ['username' => 'cashier',     'name' => 'Emily Watson',  'email' => 'cashier@workshop.com',  'roleName' => 'Cashier',         'roleId' => 5, 'roleTitle' => 'Chief Cashier'],
        'storekeeper'     => ['username' => 'storekeeper', 'name' => 'David Miller',  'email' => 'store@workshop.com',    'roleName' => 'Storekeeper',     'roleId' => 6, 'roleTitle' => 'Inventory Storekeeper'],
    ];

    public function login(): void
    {
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';

        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Username/email and password are required']);
            return;
        }

        $credential = strtolower(trim($username));
        $user       = AuthModel::findByCredential($credential);

        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid username or password']);
            return;
        }

        if (isset($user['is_active']) && $user['is_active'] === false) {
            http_response_code(403);
            echo json_encode(['error' => 'Account is deactivated. Please contact an administrator.']);
            return;
        }

        $isValid = false;
        if (!empty($user['password_hash'])) {
            if ($user['password_hash'] === $password) {
                // Upgrade plain-text to bcrypt
                $isValid = true;
                AuthModel::upgradePasswordHash($user['id'], $password);
            } else {
                $isValid = password_verify($password, $user['password_hash']);
            }
        }

        if (!$isValid) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid username or password']);
            return;
        }

        AuthModel::updateLastLogin($user['id']);

        $token = $this->issueToken($user);
        echo json_encode(['success' => true, 'token' => $token, 'user' => AuthModel::formatUser($user)]);
    }

    public function quickLogin(): void
    {
        $input     = json_decode(file_get_contents('php://input'), true) ?? [];
        $role      = strtolower(preg_replace('/\s+/', '_', $input['role'] ?? 'admin'));
        $roleDef   = self::DEFAULT_ROLE_ACCOUNTS[$role] ?? self::DEFAULT_ROLE_ACCOUNTS['admin'];

        $user = AuthModel::findFirstByRoleOrUsername($roleDef['username'], $roleDef['roleId']);
        if (!$user) {
            $user = AuthModel::createDefault($roleDef);
        }

        $token = $this->issueToken($user);
        echo json_encode(['success' => true, 'token' => $token, 'user' => AuthModel::formatUser($user)]);
    }

    public function me(array $authPayload): void
    {
        $user = AuthModel::findById((int) $authPayload['id']);
        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }

        $formatted              = AuthModel::formatUser($user);
        $formatted['lastLogin'] = $user['last_login'];

        echo json_encode(['user' => $formatted]);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function issueToken(array $user): string
    {
        $roleName = $user['role_name'] ?: 'Admin';
        $secret   = getenv('JWT_SECRET') ?: 'carrepair_super_secret_jwt_key_2026_x89!@#%^&_workshop_pro';

        return JWT::encode([
            'id'        => $user['id'],
            'username'  => $user['username'],
            'email'     => $user['email'],
            'name'      => $user['full_name'],
            'role'      => AuthModel::normalizeRole($roleName),
            'roleTitle' => $roleName,
            'exp'       => time() + (24 * 60 * 60),
        ], $secret);
    }
}
