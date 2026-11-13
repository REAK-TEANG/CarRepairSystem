<?php
// Run: php api/tests/password_test.php
require_once __DIR__ . '/../utils/password.php';

$failures = 0;
function check(string $name, bool $ok): void {
    global $failures;
    echo ($ok ? 'PASS' : 'FAIL') . "  $name\n";
    if (!$ok) $failures++;
}

$real = password_hash('S3cret-pass', PASSWORD_BCRYPT);
check('correct password verifies against bcrypt', verifyLoginPassword($real, 'S3cret-pass'));
check('wrong password is rejected', !verifyLoginPassword($real, 'nope'));

foreach (['password123', 'admin123', '123456', 'admin', 'password'] as $trivial) {
    check("universal password '$trivial' is NOT accepted", !verifyLoginPassword($real, $trivial));
}

check('stored hash cannot be used as the password (pass-the-hash)', !verifyLoginPassword($real, $real));
$node = '$2b$10$' . substr($real, 7); // Node-style $2b$ prefix of the same hash
check('$2b$ hashes are treated as hashes', isPasswordHash($node));
check('$2b$ hash cannot be used as the password', !verifyLoginPassword($node, $node));
check('$2y$ hash is recognised', isPasswordHash($real));
check('argon2id hash is recognised', isPasswordHash('$argon2id$v=19$m=65536,t=4,p=1$abc$def'));
check('plain text is not a hash', !isPasswordHash('hunter2'));

check('legacy plaintext matches exactly', verifyLoginPassword('hunter2', 'hunter2'));
check('legacy plaintext rejects a different value', !verifyLoginPassword('hunter2', 'hunter3'));
check('empty stored value never matches', !verifyLoginPassword('', ''));
check('empty supplied value never matches', !verifyLoginPassword($real, ''));

exit($failures ? 1 : 0);
