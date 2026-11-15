<?php
// Run: php api/tests/client_ip_test.php
require_once __DIR__ . '/../utils/clientIp.php';

$failures = 0;
function check(string $name, bool $ok): void {
    global $failures;
    echo ($ok ? 'PASS' : 'FAIL') . "  $name\n";
    if (!$ok) $failures++;
}
function request(array $server, ?string $mode): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'] as $k) unset($_SERVER[$k]);
    foreach ($server as $k => $v) $_SERVER[$k] = $v;
    $mode === null ? putenv('TRUSTED_PROXY') : putenv("TRUSTED_PROXY=$mode");
    return clientIp();
}

// Default (cloudflare)
check('default: CF-Connecting-IP is used', request(['HTTP_CF_CONNECTING_IP' => '203.0.113.9', 'REMOTE_ADDR' => '10.0.0.5'], null) === '203.0.113.9');
check('default: forged X-Forwarded-For is ignored', request(['HTTP_X_FORWARDED_FOR' => '1.2.3.4', 'REMOTE_ADDR' => '10.0.0.5'], null) === '10.0.0.5');
check('default: X-Forwarded-For cannot override CF-Connecting-IP', request(['HTTP_X_FORWARDED_FOR' => '1.2.3.4', 'HTTP_CF_CONNECTING_IP' => '203.0.113.9', 'REMOTE_ADDR' => '10.0.0.5'], null) === '203.0.113.9');
check('default: Client-IP header is ignored', request(['HTTP_CLIENT_IP' => '1.2.3.4', 'REMOTE_ADDR' => '10.0.0.5'], null) === '10.0.0.5');
check('default: garbage CF-Connecting-IP falls back to the peer', request(['HTTP_CF_CONNECTING_IP' => "x' OR 1=1", 'REMOTE_ADDR' => '10.0.0.5'], null) === '10.0.0.5');
check('default: IPv6 CF-Connecting-IP is accepted', request(['HTTP_CF_CONNECTING_IP' => '2001:db8::1', 'REMOTE_ADDR' => '10.0.0.5'], null) === '2001:db8::1');

// none
check('none: every header is ignored', request(['HTTP_CF_CONNECTING_IP' => '203.0.113.9', 'HTTP_X_FORWARDED_FOR' => '1.2.3.4', 'REMOTE_ADDR' => '198.51.100.7'], 'none') === '198.51.100.7');

// hop counts
$xff = '1.2.3.4, 203.0.113.9, 172.16.0.1'; // forged, real client, first proxy
check('1 hop: rightmost entry', request(['HTTP_X_FORWARDED_FOR' => $xff, 'REMOTE_ADDR' => '10.0.0.5'], '1') === '172.16.0.1');
check('2 hops: second from the right (the real client), not the forged leftmost', request(['HTTP_X_FORWARDED_FOR' => $xff, 'REMOTE_ADDR' => '10.0.0.5'], '2') === '203.0.113.9');
check('hops: too few entries falls back to the peer', request(['HTTP_X_FORWARDED_FOR' => '1.2.3.4', 'REMOTE_ADDR' => '10.0.0.5'], '3') === '10.0.0.5');
check('hops: CF-Connecting-IP is ignored in hop mode', request(['HTTP_CF_CONNECTING_IP' => '9.9.9.9', 'HTTP_X_FORWARDED_FOR' => $xff, 'REMOTE_ADDR' => '10.0.0.5'], '2') === '203.0.113.9');

// misc
check('unknown mode behaves like none', request(['HTTP_CF_CONNECTING_IP' => '203.0.113.9', 'REMOTE_ADDR' => '198.51.100.7'], 'banana') === '198.51.100.7');
check('no REMOTE_ADDR at all yields loopback', request([], 'none') === '127.0.0.1');

exit($failures ? 1 : 0);
