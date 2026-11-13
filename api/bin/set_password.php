<?php
// Break-glass password reset. Usage: NEW_PASSWORD='...' php api/bin/set_password.php <username>
// The password comes from the environment (not argv) so it never appears in process listings.
// entrypoint.sh runs this once at startup when ADMIN_RESET_USERNAME and ADMIN_RESET_PASSWORD are set.

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/sanitizer.php';

$username = strtolower(trim($argv[1] ?? ''));
$password = getenv('NEW_PASSWORD') ?: '';

if ($username === '' || $password === '') {
    fwrite(STDERR, "usage: NEW_PASSWORD='...' php set_password.php <username>\n");
    exit(2);
}

$check = Sanitizer::validatePassword($password);
if (!$check['valid']) {
    fwrite(STDERR, 'password rejected: ' . $check['error'] . "\n");
    exit(2);
}

try {
    $result = run(
        'UPDATE users SET password_hash = ?, is_active = TRUE WHERE LOWER(username) = ?',
        [password_hash($password, PASSWORD_BCRYPT), $username]
    );
    if ($result['rowCount'] < 1) {
        fwrite(STDERR, "no user named '$username'\n");
        exit(1);
    }
    echo "password updated for '$username'\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'failed: ' . $e->getMessage() . "\n");
    exit(1);
}
