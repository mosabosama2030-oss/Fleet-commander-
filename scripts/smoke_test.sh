#!/usr/bin/env bash
# Fleet Commander operational smoke test.
# Usage: BASE_URL=https://staging.example ./scripts/smoke_test.sh
set -euo pipefail

: "${BASE_URL:?BASE_URL is required, e.g. https://staging.example}"
HEALTH_PATH="${HEALTH_PATH:-/health}"
READINESS_PATH="${READINESS_PATH:-}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-10}"

case "$BASE_URL" in
  http://*|https://*) ;;
  *) echo "ERROR: BASE_URL must start with http:// or https://" >&2; exit 2 ;;
esac

join_url() {
  local base="$1" path="$2"
  printf '%s/%s\n' "${base%/}" "${path#/}"
}

check_endpoint() {
  local label="$1" path="$2" url status
  url="$(join_url "$BASE_URL" "$path")"
  if ! status="$(curl --silent --show-error --fail-with-body \
      --output /tmp/fleet-commander-smoke-body.$$ \
      --write-out '%{http_code}' \
      --max-time "$TIMEOUT_SECONDS" \
      --proto '=https,http' \
      "$url")"; then
    rm -f "/tmp/fleet-commander-smoke-body.$$"
    echo "FAIL: $label endpoint unavailable: $url" >&2
    return 1
  fi
  rm -f "/tmp/fleet-commander-smoke-body.$$"
  case "$status" in
    2??) echo "PASS: $label $url ($status)" ;;
    *) echo "FAIL: $label $url returned HTTP $status" >&2; return 1 ;;
  esac
}

check_endpoint "health" "$HEALTH_PATH"
if [[ -n "$READINESS_PATH" ]]; then
  check_endpoint "readiness" "$READINESS_PATH"
fi

echo "SMOKE TEST PASSED: endpoints responded with successful HTTP status codes."
