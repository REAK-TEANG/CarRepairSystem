<?php
// api/utils/clientIp.php

/**
 * The client's IP address, taking only headers a trusted proxy controls.
 *
 * TRUSTED_PROXY environment variable:
 *   cloudflare (default)  Use CF-Connecting-IP when present. Cloudflare sets it itself and
 *                         rejects requests in which the client supplies it (this is how the
 *                         Render deployment is reached).
 *   <number>              That many trusted proxies sit in front of the app and each appends
 *                         to X-Forwarded-For: take that entry counted from the right.
 *   none                  Not behind a proxy: use the TCP peer address only.
 *
 * The leftmost X-Forwarded-For entry is never used: the client writes it, so trusting it lets
 * anyone pick their own "IP" and sidestep rate limits. If the app is ever hosted somewhere
 * other than behind Cloudflare, set TRUSTED_PROXY to "none" or to the real hop count.
 */
function clientIp(): string
{
    $remote = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $mode = strtolower(trim((string) (getenv('TRUSTED_PROXY') ?: 'cloudflare')));

    if ($mode === 'cloudflare') {
        $ip = trim((string) ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? ''));
        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : $remote;
    }

    if (ctype_digit($mode) && (int) $mode > 0) {
        $chain = array_map('trim', explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')));
        $ip = $chain[count($chain) - (int) $mode] ?? '';
        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : $remote;
    }

    return $remote;
}
