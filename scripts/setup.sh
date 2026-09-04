#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
npm ci
node scripts/export-data.cjs
if [ ! -f .env ]; then cp .env.example .env; fi
if [ ! -f .env.safety ]; then
  .venv/bin/python -c 'import pathlib,secrets; pathlib.Path(".env.safety").write_text("TOURIST_ADMIN_TOKEN=" + secrets.token_urlsafe(32) + "\n")'
fi
if [ "${1:-}" = "--download" ]; then
  .venv/bin/python -m backend.download
fi
.venv/bin/python -m backend.synth_data
.venv/bin/python -m backend.train
printf '\nReady. Run: bash scripts/run.sh\nOperator token is stored in .env.safety (keep private).\n'
