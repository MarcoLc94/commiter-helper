#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Carga nvm para tener acceso a node y pnpm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

echo "Iniciando Commiter..."

fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true

(cd "$ROOT/backend" && ./start.sh) &
BACKEND_PID=$!

(cd "$ROOT/frontend" && pnpm dev) &
FRONTEND_PID=$!

sleep 3 && xdg-open http://localhost:5173 &

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait $BACKEND_PID $FRONTEND_PID
