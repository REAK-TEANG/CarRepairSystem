<?php
// Needs a reachable database (api/.env or DB_* env). Run: php api/tests/integration_test.php
// A stand-in for APCu is defined so the cache tier is exercised even without the extension.
$GLOBALS['__apcu']=[]; 
function apcu_enabled(){return true;} function apcu_fetch($k,&$ok=null){$ok=array_key_exists($k,$GLOBALS['__apcu']);return $ok?$GLOBALS['__apcu'][$k]:false;}
function apcu_store($k,$v,$t=0){$GLOBALS['__apcu'][$k]=$v;return true;} function apcu_add($k,$v,$t=0){if(array_key_exists($k,$GLOBALS['__apcu']))return false;$GLOBALS['__apcu'][$k]=$v;return true;}
function apcu_inc($k){return ++$GLOBALS['__apcu'][$k];} function apcu_delete($k){unset($GLOBALS['__apcu'][$k]);return true;}
$_SERVER['APP_ENV']='development';
chdir(__DIR__ . '/..');
foreach(['config/db','utils/headers','utils/jwt','utils/cache','utils/sanitizer','utils/rateLimit','utils/eventBus','middleware/AuthMiddleware'] as $f) require_once "$f.php";
$f=0; function ok($n,$c){global $f;echo ($c?'PASS':'FAIL')."  $n\n"; if(!$c)$f++;}
$tok='integration.test.token.'.uniqid();
ok('unknown token is not revoked (DB checked, answer cached)', AuthMiddleware::isTokenBlacklisted($tok)===false);
AuthMiddleware::blacklistToken($tok, 120);
ok('revocation is seen immediately despite cached "not revoked"', AuthMiddleware::isTokenBlacklisted($tok)===true);
$GLOBALS['__apcu']=[]; // simulate a restart / another worker: only DB remains
ok('revocation survives cache loss (read back from DB)', AuthMiddleware::isTokenBlacklisted($tok)===true);
run("DELETE FROM token_blacklist WHERE token_hash = ?", [hash('sha256',$tok)]);

// global throttle via cache counter: 3rd request over a limit of 2 is blocked, no DB rows written
$before=(int)get("SELECT COUNT(*) c FROM global_api_requests")['c'];
$_SERVER['REMOTE_ADDR']='203.0.113.9';
$r=[RateLimiter::isGlobalThrottled(2,1),RateLimiter::isGlobalThrottled(2,1),RateLimiter::isGlobalThrottled(2,1)];
ok('throttle allows 2 then blocks the 3rd', $r===[false,false,true]);
ok('throttle used the cache, wrote no DB rows', (int)get("SELECT COUNT(*) c FROM global_api_requests")['c']===$before);

// permissions matrix cache + invalidation
$GLOBALS['__apcu']=[];
$m1=Cache::remember('roles_permissions_matrix',60,fn()=>'sentinel');
ok('matrix served from cache after first load', Cache::fetch('roles_permissions_matrix',$h)==='sentinel' && $h);
AuthMiddleware::forgetPermissionsMatrix();
Cache::fetch('roles_permissions_matrix',$h);
ok('forgetPermissionsMatrix invalidates the cache', $h===false);

// RLS context in one round trip
setDatabaseUserContext('admin', 7);
$row=get("SELECT current_setting('app.current_user_role') r, current_setting('app.current_user_id') i");
ok('setDatabaseUserContext sets both values', $row['r']==='admin' && $row['i']==='7');

// event bus single-statement publish
$id=EventBus::publish('integration','test',['x'=>1]);
ok('EventBus::publish returns an id', is_int($id) && $id>0);
ok('EventBus event is readable back', count(array_filter(EventBus::getEventsSince($id-1,5), fn($e)=>(int)$e['id']===$id))===1);
run("DELETE FROM system_events WHERE topic='integration'");
exit($f?1:0);
