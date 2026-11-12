#!/usr/bin/env bash
# Latency check. Usage: scripts/perf_check.sh <api-base-url> [frontend-url]
# Prints time-to-first-byte for unauthenticated requests and compares against targets.
B="${1:?usage: perf_check.sh <api-base-url> [frontend-url]}"; B="${B%/}"; F="${2:-}"
fail=0
avg() { local sum=0 n=5; for i in $(seq $n); do t=$(curl -s -o /dev/null -m 90 -w '%{time_starttransfer}' "$@"); sum=$(echo "$sum $t" | awk '{print $1+$2}'); done; echo "$sum $n" | awk '{printf "%.2f", $1/$2}'; }
chk() { # name avg target
  if awk "BEGIN{exit !($2 <= $3)}"; then echo "PASS  $1: ${2}s (target <= ${3}s)"; else echo "FAIL  $1: ${2}s (target <= ${3}s)"; fail=1; fi; }
curl -s -o /dev/null -m 90 $B/health   # warm up (absorbs a cold start)
chk "/health (no DB)"            "$(avg $B/health)"    0.4
chk "/customers no token (401)"  "$(avg $B/customers)" 0.4
[ -n "$F" ] && chk "frontend index" "$(avg $F/)" 0.5
echo; [ $fail = 0 ] && echo "ALL PERF CHECKS PASSED" || echo "SOME PERF CHECKS FAILED"; exit $fail
