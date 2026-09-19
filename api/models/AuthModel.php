<?php
// api/models/AuthModel.php

class AuthModel
{
    /** Find user by username OR email (case-insensitive). */
    public static function findByCredential(string $credential): ?array
    {
        return Database::get(
            "SELECT u.*, r.name AS role_name
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE LOWER(u.username) = ? OR LOWER(u.email) = ?",
            [$credential, $credential]
        ) ?: null;
    }

    /** Find user by role_id to support quick-login. */
    public static function findFirstByRoleOrUsername(string $username, int $roleId): ?array
    {
        return Database::get(
            "SELECT u.*, r.name AS role_name
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE LOWER(u.username) = ? OR u.role_id = ?
             ORDER BY u.id ASC LIMIT 1",
            [$username, $roleId]
        ) ?: null;
    }

    /** Find user by id. */
    public static function findById(int $id): ?array
    {
        return Database::get(
            "SELECT u.id, u.username, u.email, u.full_name, u.phone, u.avatar_url, u.is_active, u.last_login,
                    r.name AS role_name
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?",
            [$id]
        ) ?: null;
    }

    /** Update last login timestamp. */
    public static function updateLastLogin(int $id): void
    {
        Database::run('UPDATE users SET last_login = NOW() WHERE id = ?', [$id]);
    }

    /** Upgrade plain-text password to bcrypt hash. */
    public static function upgradePasswordHash(int $id, string $plainPassword): void
    {
        $hash = password_hash($plainPassword, PASSWORD_BCRYPT);
        Database::run('UPDATE users SET password_hash = ? WHERE id = ?', [$hash, $id]);
    }

    /** Create a default demo user for quick-login. */
    public static function createDefault(array $roleDef): ?array
    {
        $hash = password_hash('password123', PASSWORD_BCRYPT);
        Database::run(
            "INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES (?, ?, ?, ?, ?)",
            [$roleDef['username'], $roleDef['email'], $hash, $roleDef['name'], $roleDef['roleId']]
        );
        return self::findFirstByRoleOrUsername($roleDef['username'], $roleDef['roleId']);
    }

    /** Build the normalised role string from the DB role_name. */
    public static function normalizeRole(string $roleName): string
    {
        return strtolower(preg_replace('/\s+/', '_', $roleName));
    }

    /** Build a standard user response array. */
    public static function formatUser(array $user): array
    {
        $roleName = $user['role_name'] ?: 'Admin';
        return [
            'id'        => $user['id'],
            'username'  => $user['username'],
            'name'      => $user['full_name'],
            'role'      => self::normalizeRole($roleName),
            'roleTitle' => $roleName,
            'email'     => $user['email'],
            'phone'     => $user['phone'] ?? '',
            'avatar'    => $user['avatar_url'] ?: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        ];
    }
}
