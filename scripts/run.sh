#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f .env.safety ] || [ ! -x .venv/bin/python ]; then
  printf 'Run bash scripts/setup.sh first.\n' >&2
  exit 1
fi
set -a
source .env.safety
set +a
.venv/bin/python -m uvicorn backend.app:app --host "${TOURIST_BIND:-127.0.0.1}" --port 8000 &
backend_pid=$!
frontend_pid=""
cleanup() {
  kill "$backend_pid" 2>/dev/null || true
  if [ -n "$frontend_pid" ]; then kill "$frontend_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then break; fi
  if ! kill -0 "$backend_pid" 2>/dev/null; then exit 1; fi
  sleep 1
done
curl -fsS http://127.0.0.1:8000/health >/dev/null
node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 &
frontend_pid=$!
wait "$frontend_pid"
