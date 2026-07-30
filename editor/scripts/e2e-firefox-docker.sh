#!/usr/bin/env bash
# Run image-attach Playwright tests in Firefox inside the official Playwright
# image. Useful when the host macOS sandbox cannot launch Firefox headless.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3100}"
PASSWORD="${EDITOR_PASSWORD:-playwright-editor-password-for-local-e2e}"
SECRET="${EDITOR_SESSION_SECRET:-playwright-session-secret-32chars-min!!}"
IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.62.1-noble}"

if ! curl -sf "http://127.0.0.1:${PORT}/" >/dev/null; then
  echo "Starting editor on 0.0.0.0:${PORT} with e2e credentials…"
  EDITOR_PASSWORD="$PASSWORD" \
  EDITOR_SESSION_SECRET="$SECRET" \
  COOKIE_SECURE=false \
    bun run dev --host 0.0.0.0 --port "$PORT" &
  SERVER_PID=$!
  trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
  for _ in $(seq 1 60); do
    curl -sf "http://127.0.0.1:${PORT}/" >/dev/null && break
    sleep 0.5
  done
fi

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$ROOT":/work \
  -w /work \
  -e CI=1 \
  -e PLAYWRIGHT_BASE_URL="http://host.docker.internal:${PORT}" \
  "$IMAGE" \
  bash -lc 'npx playwright test --project=firefox --reporter=list'
