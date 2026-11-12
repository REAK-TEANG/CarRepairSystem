<?php
// Run: php api/tests/cache_test.php  (add -d apc.enable_cli=1 to use a real APCu extension)
// Uses the real APCu extension when present, otherwise an in-memory stand-in with the same semantics.

if (!function_exists('apcu_fetch')) {
    $GLOBALS['__apcu'] = [];
    function apcu_enabled() { return true; }
    function apcu_fetch($k, &$ok = null) { $ok = array_key_exists($k, $GLOBALS['__apcu']); return $ok ? $GLOBALS['__apcu'][$k] : false; }
    function apcu_store($k, $v, $ttl = 0) { $GLOBALS['__apcu'][$k] = $v; return true; }
    function apcu_add($k, $v, $ttl = 0) { if (array_key_exists($k, $GLOBALS['__apcu'])) return false; $GLOBALS['__apcu'][$k] = $v; return true; }
    function apcu_inc($k) { return ++$GLOBALS['__apcu'][$k]; }
    function apcu_delete($k) { unset($GLOBALS['__apcu'][$k]); return true; }
}

putenv('REDIS_HOST'); // force the APCu tier
require_once __DIR__ . '/../utils/cache.php';

$failures = 0;
function check(string $name, bool $ok): void {
    global $failures;
    echo ($ok ? 'PASS' : 'FAIL') . "  $name\n";
    if (!$ok) $failures++;
}

check('APCu tier is available', Cache::apcuAvailable());

Cache::fetch('missing', $hit);
check('miss reports hit=false', $hit === false);

Cache::store('k', ['a' => 1], 60);
check('stored array is returned', Cache::fetch('k', $hit) === ['a' => 1] && $hit === true);

Cache::store('nul', null, 60);
Cache::fetch('nul', $hit);
check('cached null is a hit, not a miss', $hit === true);

Cache::store('f', false, 60);
check('cached false is returned as a hit', Cache::fetch('f', $hit) === false && $hit === true);

Cache::delete('k');
Cache::fetch('k', $hit);
check('delete removes the key', $hit === false);

$calls = 0;
$producer = function () use (&$calls) { $calls++; return 'v'; };
Cache::remember('r', 60, $producer);
Cache::remember('r', 60, $producer);
check('remember computes once', $calls === 1);

$producerNull = function () use (&$calls) { $calls++; return null; };
$before = $calls;
Cache::remember('rn', 60, $producerNull);
Cache::remember('rn', 60, $producerNull);
check('remember caches null results too', $calls === $before + 1);

check('increment counts 1', Cache::increment('c', 60) === 1);
check('increment counts 2', Cache::increment('c', 60) === 2);
check('increment counts 3', Cache::increment('c', 60) === 3);

exit($failures ? 1 : 0);
