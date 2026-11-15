#!/usr/bin/env bash
# API unit tests (no database needed). Used by `npm run test:api` and CI.
# Database-backed tests: `npm run test:db`.
set -euo pipefail
cd "$(dirname "$0")/../api/tests"

tests=(
  jwt_test.php
  client_ip_test.php
  rate_limit_test.php
  db_error_test.php
  db_globals_test.php
  password_test.php
  sanitizer_test.php
  cache_test.php
)

failed=0
for t in "${tests[@]}"; do
  if php -d apc.enable_cli=1 "$t" > /tmp/api_test_out.txt 2>&1; then
    echo "ok    $t ($(grep -c '^PASS' /tmp/api_test_out.txt) checks)"
  else
    echo "FAIL  $t"; grep -v '^PASS' /tmp/api_test_out.txt | sed 's/^/        /'
    failed=1
  fi
done
exit $failed
