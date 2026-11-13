#!/usr/bin/env bash
# Verifies the database's public Data API (Supabase PostgREST) exposes nothing.
# Usage: SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=<anon key> scripts/rls_check.sh
# The anon key is a public client key (Project Settings -> API); it is read from the environment
# so it never lands in shell history. Sends only GET requests. Exits non-zero if any table leaks rows.
URL="${SUPABASE_URL:?set SUPABASE_URL}"; KEY="${SUPABASE_ANON_KEY:?set SUPABASE_ANON_KEY}"; URL="${URL%/}"
fail=0
for t in users user_sessions settings token_blacklist audit_logs login_attempts customers vehicles invoices repair_orders employees; do
  body=$(curl -s -m 30 -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -w '\n%{http_code}' "$URL/rest/v1/$t?select=*&limit=1")
  code="${body##*$'\n'}"; json="${body%$'\n'*}"
  if [ "$code" = "200" ] && [ "$json" != "[]" ]; then echo "FAIL  $t is readable with the anon key (HTTP 200, returned rows)"; fail=1
  else echo "PASS  $t not readable (HTTP $code)"; fi
done
echo; [ $fail = 0 ] && echo "NOTHING EXPOSED" || echo "DATA IS EXPOSED - apply api/schema/003_lock_down_public_api.sql"; exit $fail
