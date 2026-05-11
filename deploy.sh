#!/bin/bash
# ══════════════════════════════════════════════════════════════
# deploy.sh — CROM Dataset Deploy Script
# Uso: ./deploy.sh
# Na VPS: git pull && ./deploy.sh
# ══════════════════════════════════════════════════════════════

set -euo pipefail

G='\033[0;32m'
Y='\033[1;33m'
R='\033[0;31m'
N='\033[0m'

echo -e "${G}══════════════════════════════════════════${N}"
echo -e "${G}   CROM Dataset — Deploy${N}"
echo -e "${G}══════════════════════════════════════════${N}"
echo ""

# Verifica dependências
if ! command -v docker &>/dev/null; then
    echo -e "${R}Erro: Docker não instalado.${N}"
    echo "Instale: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Verifica .env
if [ ! -f "backend/.env" ]; then
    echo -e "${Y}⚠ backend/.env não encontrado. Criando a partir do exemplo...${N}"
    cp backend/.env.example backend/.env
    echo -e "${Y}→ Edite backend/.env com seus tokens antes de continuar.${N}"
    echo -e "${Y}→ Execute: nano backend/.env${N}"
    exit 1
fi

# Build e deploy
echo -e "${G}[1/3]${N} Construindo imagem Docker..."
docker compose build --no-cache

echo -e "${G}[2/3]${N} Reiniciando serviço..."
docker compose down 2>/dev/null || true
docker compose up -d

echo -e "${G}[3/3]${N} Verificando saúde..."
sleep 3

if curl -s http://localhost:8080/api/stats > /dev/null 2>&1; then
    STATS=$(curl -s http://localhost:8080/api/stats)
    echo ""
    echo -e "${G}✅ CROM Dataset online!${N}"
    echo -e "   Estatísticas: $STATS"
    echo -e "   Acesse: ${G}http://$(hostname -I | awk '{print $1}'):8080${N}"
    echo ""
    echo -e "   Provedores: $(curl -s http://localhost:8080/api/providers | python3 -c 'import sys,json; print(", ".join(json.load(sys.stdin)["file_upload_providers"]))' 2>/dev/null || echo 'verificar manualmente')"
else
    echo -e "${R}⚠ Servidor pode estar iniciando. Verifique com:${N}"
    echo "   docker compose logs -f"
fi

echo ""
echo -e "${Y}Comandos úteis:${N}"
echo "  docker compose logs -f          # Ver logs"
echo "  docker compose restart           # Reiniciar"
echo "  docker compose down              # Parar"
echo "  docker compose exec crom-dataset sh  # Shell no container"
