#!/usr/bin/env bash
set -e

VENV=".venv"

if [ ! -d "$VENV" ]; then
  echo "Creando entorno virtual..."
  python3 -m venv "$VENV"
  echo "Instalando dependencias..."
  "$VENV/bin/pip" install -r requirements.txt
fi

echo "Iniciando backend en http://localhost:8000"
"$VENV/bin/uvicorn" main:app --reload --port 8000
