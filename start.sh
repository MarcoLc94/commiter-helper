#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Carga nvm para tener acceso a node y pnpm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

echo "Iniciando Commiter..."

# Levanta PostgreSQL en Docker
echo "Iniciando base de datos..."
if docker inspect commiter-postgres > /dev/null 2>&1; then
  docker start commiter-postgres > /dev/null 2>&1 || true
else
  docker run -d \
    --name commiter-postgres \
    -e POSTGRES_DB=commiter \
    -e POSTGRES_USER=commiter \
    -e POSTGRES_PASSWORD=commiter123 \
    -p 5432:5432 \
    -v commiter_pgdata:/var/lib/postgresql/data \
    postgres:16-alpine
fi

echo "Esperando a PostgreSQL..."
until docker exec commiter-postgres pg_isready -U commiter > /dev/null 2>&1; do
  sleep 1
done
echo "Base de datos lista."

fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true

(cd "$ROOT/backend" && ./start.sh) &
BACKEND_PID=$!

(cd "$ROOT/frontend" && pnpm dev) &
FRONTEND_PID=$!

sleep 3 && xdg-open http://localhost:5173 &

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait $BACKEND_PID $FRONTEND_PID
