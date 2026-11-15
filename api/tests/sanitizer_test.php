<?php
// Run: php api/tests/sanitizer_test.php
require_once __DIR__ . '/../utils/sanitizer.php';
require_once __DIR__ . '/../utils/password.php';

$failures = 0;
function check(string $name, bool $ok): void {
    global $failures;
    echo ($ok ? 'PASS' : 'FAIL') . "  $name\n";
    if (!$ok) $failures++;
}

// Values are kept intact
foreach ([
    'Tyres 15"<16" fit',
    'a < b and c > d',
    "O'Brien & Sons <Auto>",
    '<img src=x onerror=alert(1)>',
    'Pass<word123',
    'ខ្មែរ ភាសា — Khmer text',
    "line one\nline two\ttabbed",
] as $value) {
    check('kept as sent: ' . json_encode($value, JSON_UNESCAPED_UNICODE), Sanitizer::clean($value) === $value);
}

check('surrounding whitespace is trimmed', Sanitizer::clean("  hi  ") === 'hi');
check('NUL bytes are removed', Sanitizer::clean("ab\0cd") === 'abcd');
check('other control characters are removed', Sanitizer::clean("a\x01b\x1Bc\x7Fd") === 'abcd');
check('invalid UTF-8 is not blanked', Sanitizer::clean("caf\xE9") === "caf\xE9");
check('nested arrays and keys are cleaned', Sanitizer::clean([" k\0ey " => ['x' => " v\x01 "]]) === ['key' => ['x' => 'v']]);
check('non-strings are untouched', Sanitizer::clean(['n' => 5, 'b' => true, 'z' => null]) === ['n' => 5, 'b' => true, 'z' => null]);

// Legacy passwords that were stored after strip_tags()
$legacyStored = password_hash(strip_tags('LongPassword1<x'), PASSWORD_BCRYPT); // what the old code saved
check('legacy user signs in with the password they actually type, and it gets re-saved', checkLoginPassword($legacyStored, 'LongPassword1<x') === [true, true]);
check('legacy form is not "anything after <": wrong prefix fails', checkLoginPassword($legacyStored, 'LongPassword2<x') === [false, false]);
$resaved = password_hash('LongPassword1<x', PASSWORD_BCRYPT);
check('after re-save the real password works without re-saving again', checkLoginPassword($resaved, 'LongPassword1<x') === [true, false]);
check('after re-save, other suffixes no longer work', checkLoginPassword($resaved, 'LongPassword1<zzz') === [false, false]);
check('normal password unaffected', checkLoginPassword(password_hash('Normal123x', PASSWORD_BCRYPT), 'Normal123x') === [true, false]);
check('plaintext legacy value still upgrades', checkLoginPassword('hunter22', 'hunter22') === [true, true]);

// CSV formula injection
foreach (['=HYPERLINK("x")', '+1', '-2', '@SUM(A1)', "\tx", "\rx"] as $v) {
    check('CSV cell neutralised: ' . json_encode($v), Sanitizer::csvCell($v) === "'" . $v);
}
foreach (['42', '2026-11-15 10:00', 'normal text', 'a=b', ''] as $v) {
    check('CSV cell unchanged: ' . json_encode($v), Sanitizer::csvCell($v) === $v);
}
check('CSV cell handles null', Sanitizer::csvCell(null) === '');

exit($failures ? 1 : 0);
