<?php
// api/controllers/AuthController.php

require_once __DIR__ . '/../models/AuthModel.php';
require_once __DIR__ . '/../utils/jwt.php';

class AuthController
{
    public function accounts(): void
    {
        $accounts = AuthModel::getAvailableAccounts();
        $formatted = array_map(function($u) {
            $roleName = $u['role_name'] ?: 'Staff';
            return [
                'id' => $u['id'],
                'username' => $u['username'],
                'name' => $u['name'],
                'email' => $u['email'],
                'phone' => $u['phone'] ?? '',
                'avatar' => $u['avatar_url'] ?: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                'role' => AuthModel::normalizeRole($roleName),
                'roleTitle' => $roleName,
                'roleId' => $u['role_id'],
                'roleDescription' => $u['role_description'] ?? '',
                'lastLogin' => $u['last_login'],
            ];
        }, $accounts);

        echo json_encode(['success' => true, 'accounts' => $formatted]);
    }

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

        $roleKey = AuthModel::normalizeRole($user['role_name'] ?: 'admin');
        if (function_exists('setDatabaseUserContext')) {
            setDatabaseUserContext($roleKey, $user['id']);
        }

        $token = $this->issueToken($user);
        echo json_encode(['success' => true, 'token' => $token, 'user' => AuthModel::formatUser($user)]);
    }

    public function quickLogin(): void
    {
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $role     = trim($input['role'] ?? '');
        $username = trim($input['username'] ?? '');

        $user = null;
        if (!empty($username)) {
            $user = Database::get(
                "SELECT u.*, r.name as role_name 
                 FROM users u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE (LOWER(u.username) = LOWER(?) OR LOWER(u.email) = LOWER(?)) AND u.is_active = true 
                 LIMIT 1",
                [$username, $username]
            );
        } else if (!empty($role)) {
            $cleanRole = strtolower(preg_replace('/\s+/', '_', $role));
            $user = Database::get(
                "SELECT u.*, r.name as role_name 
                 FROM users u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE (LOWER(r.name) = LOWER(?) OR LOWER(REPLACE(r.name, ' ', '_')) = ? OR LOWER(u.username) = ?) AND u.is_active = true 
                 ORDER BY u.id ASC LIMIT 1",
                [$role, $cleanRole, $cleanRole]
            );
        }

        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'No active database account found for the selected role or user.']);
            return;
        }

        $roleKey = AuthModel::normalizeRole($user['role_name'] ?: 'staff');
        if (function_exists('setDatabaseUserContext')) {
            setDatabaseUserContext($roleKey, $user['id']);
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
