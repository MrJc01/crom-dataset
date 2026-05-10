#!/bin/bash
# scripts/start_frontend.sh — Inicialização segura do frontend Vite

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$DIR")"

# Verificações
if ! command -v node &>/dev/null; then
    echo "ERRO: 'node' não está instalado."
    exit 1
fi
if ! command -v npm &>/dev/null; then
    echo "ERRO: 'npm' não está instalado."
    exit 1
fi

echo "[$(date '+%H:%M:%S')] Iniciando Frontend..."
cd "$PROJECT_ROOT/frontend" || exit 1

# Garante que os pacotes estão instalados
if [ ! -d "node_modules" ]; then
    echo "[$(date '+%H:%M:%S')] Instalando dependências npm..."
    npm install --silent
fi

# Garante diretório de logs
mkdir -p "$PROJECT_ROOT/logs"

# Inicia o servidor
npm run dev -- --host > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

echo $FRONTEND_PID > "$PROJECT_ROOT/.frontend_pid"
echo "[$(date '+%H:%M:%S')] Frontend iniciado com PID $FRONTEND_PID"
echo "  Logs: tail -f $PROJECT_ROOT/logs/frontend.log"
