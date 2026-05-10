#!/bin/bash
# scripts/start_backend.sh — Compilação e inicialização segura do backend Go

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$DIR")"

# Verificações
if ! command -v go &>/dev/null; then
    echo "ERRO: 'go' não está instalado."
    exit 1
fi

echo "[$(date '+%H:%M:%S')] Iniciando Backend..."
cd "$PROJECT_ROOT/backend" || exit 1

# Garante dependências
go mod tidy 2>/dev/null

# Libera a porta forçadamente
fuser -k 8080/tcp 2>/dev/null || true
sleep 0.5

# Compila o binário
echo "[$(date '+%H:%M:%S')] Compilando backend_app..."
if ! go build -o backend_app main.go; then
    echo "ERRO: Falha na compilação do backend."
    exit 1
fi

# Garante diretório de logs
mkdir -p "$PROJECT_ROOT/logs"

# Inicia o servidor
./backend_app > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!

echo $BACKEND_PID > "$PROJECT_ROOT/.backend_pid"

# Health check com retry (até 8 segundos)
echo "[$(date '+%H:%M:%S')] Aguardando backend responder..."
for i in $(seq 1 8); do
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 "http://localhost:8080/api/stats" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then
        echo "[$(date '+%H:%M:%S')] Backend respondendo HTTP 200 ✓ (PID $BACKEND_PID)"
        exit 0
    fi
    sleep 1
done

echo "[$(date '+%H:%M:%S')] Backend iniciado (PID $BACKEND_PID) mas sem resposta HTTP ainda."
echo "  Verifique logs: tail -f $PROJECT_ROOT/logs/backend.log"
