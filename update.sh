#!/bin/bash
# ══════════════════════════════════════════════════════════════
# update.sh — CROM Dataset: Atualizar na VPS
# Uso: ./update.sh
# ══════════════════════════════════════════════════════════════

set -euo pipefail

G='\033[0;32m'
Y='\033[1;33m'
R='\033[0;31m'
N='\033[0m'
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo -e "${G}══════════════════════════════════════${N}"
echo -e "${G}   CROM Dataset — Atualização VPS${N}"
echo -e "${G}══════════════════════════════════════${N}"
echo ""

# 1. Pull do repositório
echo -e "${G}[1/4]${N} Puxando código..."
git pull --ff-only || { echo -e "${Y}⚠ Merge necessário. Resolva manualmente.${N}"; exit 1; }
echo ""

# 2. Verifica .env
if [ ! -f "backend/.env" ]; then
    echo -e "${R}✗ backend/.env não encontrado!${N}"
    echo "  Execute: cp backend/.env.example backend/.env && nano backend/.env"
    exit 1
fi
echo -e "${G}[2/4]${N} .env OK"

# 3. Rebuild e redeploy
echo -e "${G}[3/4]${N} Rebuild e redeploy..."
docker compose up -d --build --force-recreate

# 4. Health check
echo -e "${G}[4/4]${N} Verificando..."
sleep 3

PORT=$(grep '^PORT=' backend/.env | cut -d'=' -f2 || echo "8090")
for i in 1 2 3 4 5; do
    if curl -sf "http://localhost:${PORT}/api/stats" > /dev/null 2>&1; then
        STATS=$(curl -s "http://localhost:${PORT}/api/stats")
        echo ""
        echo -e "${G}✅ CROM Dataset atualizado e online!${N}"
        echo -e "   Stats: $STATS"
        echo -e "   URL:   ${G}https://dados.crom.run${N}"
        exit 0
    fi
    echo "   Aguardando... ($i/5)"
    sleep 2
done

echo -e "${R}⚠ Servidor não respondeu. Verifique: docker compose logs -f${N}"
exit 1
