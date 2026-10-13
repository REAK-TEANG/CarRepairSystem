<?php
// api/routes/auth.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/rateLimit.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $segments[1] ?? '';
$secret = function_exists('getJwtSecret') ? getJwtSecret() : (getenv('JWT_SECRET') ?: 'carrepair_super_secret_jwt_key_2026_x89!@#%^&_workshop_pro');

$DEFAULT_ROLE_ACCOUNTS = [
    'admin' => ['username' => 'admin', 'name' => 'Jane Doe', 'email' => 'admin@carrepair.com', 'roleName' => 'Admin', 'roleId' => 1, 'roleTitle' => 'System Administrator'],
    'manager' => ['username' => 'manager', 'name' => 'Marcus Vance', 'email' => 'manager@workshop.com', 'roleName' => 'Manager', 'roleId' => 2, 'roleTitle' => 'Workshop Manager'],
    'service_advisor' => ['username' => 'advisor', 'name' => 'Sarah Jenkins', 'email' => 'advisor@workshop.com', 'roleName' => 'Service Advisor', 'roleId' => 3, 'roleTitle' => 'Service Advisor'],
    'mechanic' => ['username' => 'mechanic', 'name' => 'Mike Johnson', 'email' => 'mike@workshop.com', 'roleName' => 'Mechanic', 'roleId' => 4, 'roleTitle' => 'Master Technician'],
    'cashier' => ['username' => 'cashier', 'name' => 'Emily Watson', 'email' => 'cashier@workshop.com', 'roleName' => 'Cashier', 'roleId' => 5, 'roleTitle' => 'Chief Cashier'],
    'storekeeper' => ['username' => 'storekeeper', 'name' => 'David Miller', 'email' => 'store@workshop.com', 'roleName' => 'Storekeeper', 'roleId' => 6, 'roleTitle' => 'Inventory Storekeeper'],
];

if ($method === 'POST' && $path === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
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
    if (RateLimiter::isRateLimited($cleanUsername, 5, 15)) {
        http_response_code(429);
        echo json_encode([
            'error' => 'Too Many Requests',
            'message' => 'Too many failed login attempts. Please wait 15 minutes before trying again.'
        ]);
        exit;
    }
    
    $user = get(
        "SELECT u.*, r.name as role_name 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE LOWER(u.username) = ? OR LOWER(u.email) = ?",
        [$cleanUsername, $cleanUsername]
    );

    if (!$user) {
        RateLimiter::recordFailure($cleanUsername);
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        exit;
    }

    if (isset($user['is_active']) && $user['is_active'] === false) {
        http_response_code(403);
        echo json_encode(['error' => 'Account is deactivated. Please contact an administrator.']);
        exit;
    }

    $isPasswordValid = false;
    if (!empty($user['password_hash'])) {
        if ($user['password_hash'] === $password) { // Handle old plain-text migration if any
            $isPasswordValid = true;
            $newHash = password_hash($password, PASSWORD_BCRYPT);
            run('UPDATE users SET password_hash = ? WHERE id = ?', [$newHash, $user['id']]);
        } else {
            $isPasswordValid = password_verify($password, $user['password_hash']);
        }
    }

    if (!$isPasswordValid) {
        RateLimiter::recordFailure($cleanUsername);
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
            'avatar' => $user['avatar_url'] ?: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        ]
    ]);
    exit;

} else if ($method === 'POST' && $path === 'quick-login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $role = $input['role'] ?? 'admin';
    $cleanRole = strtolower(preg_replace('/\s+/', '_', $role));
    $roleDef = $DEFAULT_ROLE_ACCOUNTS[$cleanRole] ?? $DEFAULT_ROLE_ACCOUNTS['admin'];

    $user = get(
        "SELECT u.*, r.name as role_name 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE LOWER(u.username) = ? OR u.role_id = ?
         ORDER BY u.id ASC LIMIT 1",
        [$roleDef['username'], $roleDef['roleId']]
    );

    if (!$user) {
        $defaultHash = password_hash('password123', PASSWORD_BCRYPT);
        run(
            "INSERT INTO users (username, email, password_hash, full_name, role_id)
             VALUES (?, ?, ?, ?, ?)",
            [$roleDef['username'], $roleDef['email'], $defaultHash, $roleDef['name'], $roleDef['roleId']]
        );
        $user = get("SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.username = ?", [$roleDef['username']]);
    }

    $roleName = $user['role_name'] ?: $roleDef['roleName'];
    $normalizedRole = strtolower(preg_replace('/\s+/', '_', $roleName));
    $roleTitle = $roleName ?: $roleDef['roleTitle'];

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
            'avatar' => $user['avatar_url'] ?: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        ]
    ]);
    exit;

} else if ($method === 'GET' && $path === 'me') {
    $authPayload = authenticate();
    
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
            'avatar' => $user['avatar_url'] ?: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            'lastLogin' => $user['last_login'],
        ]
    ]);
    exit;

} else if ($method === 'POST' && ($path === 'change-password' || $path === 'change_password')) {
    $authPayload = authenticate();
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $current = $input['currentPassword'] ?? '';
    $new = $input['newPassword'] ?? '';

    if (!$current || !$new) {
        http_response_code(400);
        echo json_encode(['error' => 'Current password and new password are required']);
        exit;
    }

    $user = get('SELECT id, password_hash FROM users WHERE id = ?', [$authPayload['id']]);
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    $valid = password_verify($current, $user['password_hash']) || ($user['password_hash'] === $current);
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
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
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
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $ident = strtolower(trim($input['emailOrUsername'] ?? $input['email'] ?? ''));
    $code = trim($input['resetCode'] ?? '');
    $newPass = $input['newPassword'] ?? '';

    if (!$ident || !$code || !$newPass) {
        http_response_code(400);
        echo json_encode(['error' => 'Email/username, reset code, and new password are required']);
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
