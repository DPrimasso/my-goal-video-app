#!/usr/bin/env bash
# Avvia server.js su una porta dedicata, genera final_result_test.png in root repo, poi termina.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${FINAL_RESULT_TEST_PORT:-4077}"
OUT="${FINAL_RESULT_TEST_OUT:-$ROOT/final_result_test.png}"

cd "$ROOT/client"
export BASE_URL="http://127.0.0.1:${PORT}"
export PORT_SERVER="${PORT}"

node server.js &
PID=$!
cleanup() {
  kill "$PID" 2>/dev/null || true
  wait "$PID" 2>/dev/null || true
}
trap cleanup EXIT

sleep 4

curl -sS -X POST "http://127.0.0.1:${PORT}/api/final-result-generate" \
  -H "Content-Type: application/json" \
  -d "{\"homeTeam\":\"CASALPOGLIO\",\"awayTeam\":\"AMATORI\",\"homeScore\":3,\"awayScore\":1,\"scorerLines\":[\"A 12'\",\"B 23'\",\"C 34'\",\"D 45'\"],\"scorersUnder\":\"home\"}" \
  -o "$OUT" \
  -w "\nHTTP %{http_code}  ->  %{size_download} bytes\n"

file "$OUT"
