<?php
// api/routes/auth.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/sanitizer.php';
require_once __DIR__ . '/../utils/password.php';
require_once __DIR__ . '/../utils/rateLimit.php';
require_once __DIR__ . '/../utils/auditLogger.php';
require_once __DIR__ . '/../models/SessionModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $segments[1] ?? '';
$secret = getJwtSecret();

if ($method === 'GET' && $path === 'permissions') {
    // Return role permissions matrix directly from the database (settings table)
    $row = get("SELECT setting_value FROM settings WHERE setting_key = 'roles_permissions_matrix'");
    $matrix = null;
    if ($row && !empty($row['setting_value'])) {
        $matrix = json_decode($row['setting_value'], true);
    }
    if (!$matrix) {
        http_response_code(404);
        echo json_encode(['error' => 'Permission matrix not found in database settings']);
        exit;
    }
    echo json_encode(['success' => true, 'data' => $matrix]);
    exit;

} else if ($method === 'POST' && $path === 'login') {
    $input = Sanitizer::getJsonInput();
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    if (!$username || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Username/email and password are required']);
        exit;
    }

    $cleanUsername = strtolower(trim($username));
    
    // -------------------------------------------------------------------------
    // Rate Limiting: 5 failed attempts per 15-minute window
    // -------------------------------------------------------------------------
    // Per-IP cap (20 failures / 15 min) stops one client spraying many usernames
    $ipKey = 'ip:' . RateLimiter::getClientIp();
    if (RateLimiter::isRateLimited($cleanUsername, 5, 15) || RateLimiter::isRateLimited($ipKey, 20, 15)) {
        http_response_code(429);
        echo json_encode([
            'error' => 'Too Many Requests',
            'message' => 'Too many failed login attempts. Please wait 15 minutes before trying again.'
        ]);
        exit;
    }
    
    // Query authenticated user directly from the database using PDO prepared statements
    $user = get(
        "SELECT u.*, r.name as role_name 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE LOWER(u.username) = ? OR LOWER(u.email) = ?",
        [$cleanUsername, $cleanUsername]
    );

    if (!$user) {
        RateLimiter::recordFailure($cleanUsername);
        RateLimiter::recordFailure($ipKey);
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        exit;
    }

    if (isset($user['is_active']) && $user['is_active'] === false) {
        http_response_code(403);
        echo json_encode(['error' => 'Account is deactivated. Please contact an administrator.']);
        exit;
    }

    $storedHash = (string) ($user['password_hash'] ?? '');
    $isPasswordValid = verifyLoginPassword($storedHash, (string) $password);
    if ($isPasswordValid && !isPasswordHash($storedHash)) {
        // Legacy plaintext value: upgrade it to a bcrypt hash now that it has been verified
        run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_BCRYPT), $user['id']]);
    }

    if (!$isPasswordValid) {
        RateLimiter::recordFailure($cleanUsername);
        RateLimiter::recordFailure($ipKey);
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        exit;
    }

    // Reset failed attempts on successful authentication
    RateLimiter::resetAttempts($cleanUsername);

    run('UPDATE users SET last_login = NOW() WHERE id = ?', [$user['id']]);

    $roleName = $user['role_name'] ?: 'Admin';
    $normalizedRole = strtolower(preg_replace('/\s+/', '_', $roleName));
    $roleTitle = $roleName ?: 'Administrator';

    $payload = [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'name' => $user['full_name'],
        'role' => $normalizedRole,
        'roleTitle' => $roleTitle,
        'exp' => time() + (24 * 60 * 60)
    ];

    $token = JWT::encode($payload, $secret);

    // Track active session & audit login event
    SessionModel::createSession((int)$user['id'], $token);
    AuditLogger::log(
        'LOGIN',
        'auth',
        "User {$user['full_name']} (@{$user['username']}) signed in",
        (string)$user['id'],
        ['role' => $normalizedRole],
        (int)$user['id'],
        $user['username'],
        $normalizedRole
    );

    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['full_name'],
            'role' => $normalizedRole,
            'roleTitle' => $roleTitle,
            'email' => $user['email'],
            'phone' => $user['phone'] ?? '',
            'avatar' => $user['avatar_url'] ?: null,
        ]
    ]);
    exit;

} else if ($method === 'GET' && $path === 'me') {
    $authPayload = AuthMiddleware::requireAuth();
    
    $user = get(
        "SELECT u.id, u.username, u.email, u.full_name, u.phone, u.avatar_url, u.is_active, u.last_login,
                r.name as role_name 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?",
        [$authPayload['id']]
    );

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    $roleName = $user['role_name'] ?: 'Admin';
    $normalizedRole = strtolower(preg_replace('/\s+/', '_', $roleName));

    echo json_encode([
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['full_name'],
            'role' => $normalizedRole,
            'roleTitle' => $roleName,
            'email' => $user['email'],
            'phone' => $user['phone'] ?? '',
            'avatar' => $user['avatar_url'] ?: null,
            'lastLogin' => $user['last_login'],
        ]
    ]);
    exit;

} else if ($method === 'POST' && $path === 'logout') {
    $token = getBearerToken();
    if ($token) {
        $payload = JWT::decode($token, $secret);
        $ttl = ($payload && isset($payload['exp'])) ? max(60, $payload['exp'] - time()) : 86400;
        AuthMiddleware::blacklistToken($token, $ttl);
        SessionModel::closeSession($token, 'manual_logout');

        if ($payload) {
            AuditLogger::log(
                'LOGOUT',
                'auth',
                "User " . ($payload['name'] ?? $payload['username']) . " (@" . ($payload['username'] ?? 'user') . ") logged out",
                (string)($payload['id'] ?? ''),
                null,
                $payload['id'] ?? null,
                $payload['username'] ?? null,
                $payload['role'] ?? null
            );
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
    exit;

} else if ($method === 'POST' && ($path === 'change-password' || $path === 'change_password')) {
    $authPayload = AuthMiddleware::requireAuth();
    $input = Sanitizer::getJsonInput();
    $current = $input['currentPassword'] ?? '';
    $new = $input['newPassword'] ?? '';

    if (!$current || !$new) {
        http_response_code(400);
        echo json_encode(['error' => 'Current password and new password are required']);
        exit;
    }

    // Enforce strong password complexity policy
    $passwordCheck = Sanitizer::validatePassword($new);
    if (!$passwordCheck['valid']) {
        http_response_code(400);
        echo json_encode(['error' => $passwordCheck['error']]);
        exit;
    }

    $user = get('SELECT id, password_hash FROM users WHERE id = ?', [$authPayload['id']]);
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    $valid = verifyLoginPassword((string) $user['password_hash'], (string) $current);
    if (!$valid) {
        http_response_code(400);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }

    $newHash = password_hash($new, PASSWORD_BCRYPT);
    run('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [$newHash, $user['id']]);

    echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
    exit;

} else if ($method === 'POST' && ($path === 'forgot-password' || $path === 'forgot_password')) {
    $input = Sanitizer::getJsonInput();
    $ident = strtolower(trim($input['emailOrUsername'] ?? $input['email'] ?? ''));

    if (!$ident) {
        http_response_code(400);
        echo json_encode(['error' => 'Email or username is required']);
        exit;
    }

    $user = get('SELECT id, email FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?', [$ident, $ident]);
    if ($user) {
        $code = (string) random_int(100000, 999999);
        run(
            "UPDATE users SET reset_token = ?, reset_expires_at = NOW() + INTERVAL '1 hour' WHERE id = ?",
            [$code, $user['id']]
        );
    }

    echo json_encode([
        'success' => true,
        'message' => 'If an account matches that email or username, a reset code has been sent.'
    ]);
    exit;

} else if ($method === 'POST' && ($path === 'reset-password' || $path === 'reset_password')) {
    $input = Sanitizer::getJsonInput();
    $ident = strtolower(trim($input['emailOrUsername'] ?? $input['email'] ?? ''));
    $code = trim($input['resetCode'] ?? '');
    $newPass = $input['newPassword'] ?? '';

    if (!$ident || !$code || !$newPass) {
        http_response_code(400);
        echo json_encode(['error' => 'Email/username, reset code, and new password are required']);
        exit;
    }

    // Enforce strong password complexity policy
    $passwordCheck = Sanitizer::validatePassword($newPass);
    if (!$passwordCheck['valid']) {
        http_response_code(400);
        echo json_encode(['error' => $passwordCheck['error']]);
        exit;
    }

    $user = get(
        "SELECT id, reset_token, reset_expires_at 
         FROM users 
         WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND reset_token = ? AND reset_expires_at > NOW()",
        [$ident, $ident, $code]
    );

    if (!$user) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired password reset code']);
        exit;
    }

    $hash = password_hash($newPass, PASSWORD_BCRYPT);
    run(
        "UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL, updated_at = NOW() WHERE id = ?",
        [$hash, $user['id']]
    );

    echo json_encode(['success' => true, 'message' => 'Password has been reset successfully. You can now log in.']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Auth endpoint not found']);
