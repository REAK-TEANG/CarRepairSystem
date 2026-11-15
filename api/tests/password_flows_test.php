<?php
// Run: php api/tests/password_flows_test.php [api-base-url]   (default http://127.0.0.1:8098)
// End-to-end over HTTP against a running API + database. Creates a temporary user and removes it.
// The API should run with APP_ENV=production so the real rate limits apply.

$_SERVER['APP_ENV'] = $_SERVER['APP_ENV'] ?? 'development';
require_once __DIR__ . '/../config/db.php';

$base = rtrim($argv[1] ?? 'http://127.0.0.1:8098', '/');
$failures = 0;
function check(string $name, bool $ok, string $extra = ''): void {
    global $failures;
    echo ($ok ? 'PASS' : 'FAIL') . "  $name" . ($extra !== '' ? "  ($extra)" : '') . "\n";
    if (!$ok) $failures++;
}
function api(string $method, string $path, array $body = [], ?string $token = null): array {
    global $base;
    $headers = "Content-Type: application/json\r\n" . ($token ? "Authorization: Bearer $token\r\n" : '');
    $ctx = stream_context_create(['http' => ['method' => $method, 'header' => $headers, 'content' => $body ? json_encode($body) : '', 'ignore_errors' => true, 'timeout' => 20]]);
    $raw = @file_get_contents($base . $path, false, $ctx);
    $status = isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m) ? (int) $m[1] : 0;
    return [$status, json_decode((string) $raw, true) ?? []];
}
// Tokens carry a 1-second expiry timestamp: two logins in the same second get the same token.
function login(string $user, string $pass): ?string {
    usleep(1100000);
    [$s, $b] = api('POST', '/auth/login', ['username' => $user, 'password' => $pass]);
    return $s === 200 ? ($b['token'] ?? null) : null;
}
function setCode(int $id, string $code): void {
    run("UPDATE users SET reset_token = ?, reset_expires_at = NOW() + INTERVAL '1 hour', reset_attempts = 0 WHERE id = ?", [hash('sha256', $code), $id]);
}

$username = 'qa_pw_' . bin2hex(random_bytes(3));
$pass1 = 'FirstPass123x';
$roleId = (int) get("SELECT id FROM roles ORDER BY id LIMIT 1")['id'];
run(
    "INSERT INTO users (username, email, password_hash, full_name, role_id, is_active) VALUES (?, ?, ?, ?, ?, TRUE)",
    [$username, "$username@example.invalid", password_hash($pass1, PASSWORD_BCRYPT), 'QA Password Test', $roleId]
);
$uid = (int) get("SELECT id FROM users WHERE username = ?", [$username])['id'];

try {
    // ---------------- forgot-password
    [$s1, $b1] = api('POST', '/auth/forgot-password', ['emailOrUsername' => $username]);
    [$s2, $b2] = api('POST', '/auth/forgot-password', ['emailOrUsername' => 'no_such_user_' . $username]);
    check('forgot-password answers the same for existing and unknown accounts', $s1 === 200 && $s2 === 200 && $b1 === $b2);
    $row = get("SELECT reset_token, reset_attempts FROM users WHERE id = ?", [$uid]);
    check('reset code is stored hashed, not in plain text', (bool) preg_match('/^[0-9a-f]{64}$/', (string) $row['reset_token']));

    api('POST', '/auth/forgot-password', ['emailOrUsername' => $username]);
    api('POST', '/auth/forgot-password', ['emailOrUsername' => $username]);
    $before = get("SELECT reset_token FROM users WHERE id = ?", [$uid])['reset_token'];
    [$s4] = api('POST', '/auth/forgot-password', ['emailOrUsername' => $username]);
    $after = get("SELECT reset_token FROM users WHERE id = ?", [$uid])['reset_token'];
    check('4th code request in an hour is silently ignored (same reply, no new code)', $s4 === 200 && $before === $after);

    // ---------------- reset-password: guess limit
    setCode($uid, '424242');
    $codes = [];
    for ($i = 0; $i < 5; $i++) {
        [$s] = api('POST', '/auth/reset-password', ['emailOrUsername' => $username, 'resetCode' => (string) (100000 + $i), 'newPassword' => 'NewPass456y']);
        $codes[] = $s;
    }
    check('wrong codes are rejected', $codes === [400, 400, 400, 400, 400]);
    [$sRight] = api('POST', '/auth/reset-password', ['emailOrUsername' => $username, 'resetCode' => '424242', 'newPassword' => 'NewPass456y']);
    check('after 5 wrong guesses even the right code no longer works', $sRight === 400);
    check('the code was destroyed', get("SELECT reset_token FROM users WHERE id = ?", [$uid])['reset_token'] === null);
    check('password is unchanged after the failed attempts', login($username, $pass1) !== null);

    // ---------------- reset-password: success revokes every session
    $t1 = login($username, $pass1);
    $t2 = login($username, $pass1);
    check('two sessions are signed in before the reset', $t1 && $t2 && $t1 !== $t2 && api('GET', '/auth/me', [], $t1)[0] === 200 && api('GET', '/auth/me', [], $t2)[0] === 200);
    setCode($uid, '515151');
    [$sOk] = api('POST', '/auth/reset-password', ['emailOrUsername' => $username, 'resetCode' => '515151', 'newPassword' => 'NewPass456y']);
    check('correct code resets the password', $sOk === 200);
    check('every existing session is signed out after a reset', api('GET', '/auth/me', [], $t1)[0] === 401 && api('GET', '/auth/me', [], $t2)[0] === 401);
    check('old password no longer works', login($username, $pass1) === null);
    check('new password works', login($username, 'NewPass456y') !== null);
    [$sReuse] = api('POST', '/auth/reset-password', ['emailOrUsername' => $username, 'resetCode' => '515151', 'newPassword' => 'Another789z']);
    check('a used code cannot be used again', $sReuse === 400);

    // ---------------- change-password
    $a = login($username, 'NewPass456y');
    $b = login($username, 'NewPass456y');
    check('two distinct sessions before the change', $a && $b && $a !== $b);
    [$sc] = api('POST', '/auth/change-password', ['currentPassword' => 'NewPass456y', 'newPassword' => 'Changed789z'], $a);
    check('change-password succeeds', $sc === 200);
    check('the session that changed it stays signed in', api('GET', '/auth/me', [], $a)[0] === 200);
    check('other sessions are signed out', api('GET', '/auth/me', [], $b)[0] === 401);
    $wrong = [];
    for ($i = 0; $i < 6; $i++) {
        $wrong[] = api('POST', '/auth/change-password', ['currentPassword' => 'nope' . $i, 'newPassword' => 'Whatever123a'], $a)[0];
    }
    check('wrong current password is rate limited after 5 tries', array_slice($wrong, 0, 5) === [400, 400, 400, 400, 400] && $wrong[5] === 429, implode(',', $wrong));

    $events = array_column(all("SELECT action FROM audit_logs WHERE entity_id = ? AND module = 'auth'", [(string) $uid]), 'action');
    check('reset and change are in the audit log', in_array('PASSWORD_RESET', $events, true) && in_array('PASSWORD_CHANGE', $events, true) && in_array('PASSWORD_RESET_REQUEST', $events, true));
} finally {
    run("DELETE FROM login_attempts WHERE identifier IN (?, ?, ?)", [$username, "reset-request:$username", "pwchange:$uid"]);
    run("DELETE FROM audit_logs WHERE user_id = ? OR entity_id = ?", [$uid, (string) $uid]);
    run("DELETE FROM token_blacklist WHERE token_hash IN (SELECT session_token_hash FROM user_sessions WHERE user_id = ?)", [$uid]);
    run("DELETE FROM users WHERE id = ?", [$uid]);
    echo "cleaned up test user\n";
}
exit($failures ? 1 : 0);
