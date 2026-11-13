#!/usr/bin/env bash
# Non-destructive security smoke test. Usage: scripts/security_check.sh https://your-api.example.com/api
# Exits non-zero if any check fails. Sends only harmless requests (no real logins, no brute force).
B="${1:?usage: security_check.sh <api-base-url>}"; B="${B%/}"
fail=0
check() { if [ "$2" = "1" ]; then echo "PASS  $1"; else echo "FAIL  $1"; fail=1; fi; }
code() { curl -s -m 60 -o /dev/null -w '%{http_code}' "$@"; }

check "health responds 200" "$([ "$(code $B/health)" = 200 ] && echo 1)"
check "no wildcard CORS for unknown origin" "$(curl -s -m 60 -i -H 'Origin: https://evil.example' $B/health | grep -qi 'access-control-allow-origin' && echo 0 || echo 1)"
check "no CORS for random *.vercel.app origin" "$(curl -s -m 60 -i -H 'Origin: https://attacker.vercel.app' $B/health | grep -qi 'access-control-allow-origin' && echo 0 || echo 1)"
hdr=$(curl -s -m 60 -i $B/health)
check "API CSP is default-src 'none'" "$(echo "$hdr" | grep -qi "content-security-policy: default-src 'none'" && echo 1)"
check "HSTS header present" "$(echo "$hdr" | grep -qi 'strict-transport-security' && echo 1)"
check "X-Frame-Options DENY" "$(echo "$hdr" | grep -qi 'x-frame-options: DENY' && echo 1)"
for p in customers vehicles invoices settings reports employees repair-jobs appointments inventory audit-logs; do
  check "GET /$p requires auth (401)" "$([ "$(code $B/$p)" = 401 ] && echo 1)"
done
check "/auth/accounts is not public"   "$([ "$(code $B/auth/accounts)" != 200 ] && echo 1)"
check "/auth/roles-accounts is not public" "$([ "$(code $B/auth/roles-accounts)" != 200 ] && echo 1)"
qc=$(curl -s -m 60 -X POST -H 'Content-Type: application/json' -d '{"username":"zz_probe_nonexistent"}' $B/auth/quick-login)
check "passwordless /auth/quick-login removed" "$(echo "$qc" | grep -q 'No active database account' && echo 0 || echo 1)"
check "/health/db does not leak connection details" "$(curl -s -m 60 $B/health/db | grep -qiE 'supabase|pooler|postgres|password|host' && echo 0 || echo 1)"
check "forged alg=none token rejected" "$([ "$(code -H 'Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYWRtaW4ifQ.' $B/customers)" = 401 ] && echo 1)"
check "token signed with old public secret rejected" "$(node -e "
const c=require('crypto');const b=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const h=b({typ:'JWT',alg:'HS256'}),p=b({id:1,role:'admin',exp:Math.floor(Date.now()/1e3)+600});
console.log(h+'.'+p+'.'+c.createHmac('sha256','carrepair_super_secret_jwt_key_2026_x89!@#%^&_workshop_pro').update(h+'.'+p).digest('base64url'))" | { read t; [ "$(code -H "Authorization: Bearer $t" $B/customers)" = 401 ] && echo 1; })"
check "debug key does not unlock details" "$(curl -s -m 60 -H 'X-Debug-Key: carrepair_system_debug_2026' $B/nonexistent | grep -q '"file"' && echo 0 || echo 1)"
for f in .env ../.env ../.git/config vendor/composer/installed.json; do
  check "$f not exposed" "$([ "$(code $B/$f)" != 200 ] && echo 1)"
done
echo; [ $fail = 0 ] && echo "ALL CHECKS PASSED" || echo "SOME CHECKS FAILED"; exit $fail
