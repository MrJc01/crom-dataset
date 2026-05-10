#!/bin/bash
# scripts/backup.sh — Backup seguro do SQLite com rotação

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR" || exit 1

BACKUP_DIR="$DIR/backups"
DB_PATH="$DIR/backend/dataset.db"
MAX_BACKUPS=5

# Verificações
if [ ! -f "$DB_PATH" ]; then
    echo "ERRO: Banco de dados não encontrado em $DB_PATH"
    exit 1
fi

if ! command -v sqlite3 &>/dev/null; then
    echo "ERRO: 'sqlite3' não está instalado. Fazendo cópia simples..."
    mkdir -p "$BACKUP_DIR"
    cp "$DB_PATH" "$BACKUP_DIR/dataset_backup_$(date +%Y-%m-%d_%H-%M-%S).db"
    echo "Cópia realizada (sem verificação de integridade)."
    exit 0
fi

# Cria pasta de backups
mkdir -p "$BACKUP_DIR"

# Backup seguro via sqlite3
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/dataset_backup_$TIMESTAMP.db"

echo "[$(date '+%H:%M:%S')] Realizando backup..."
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

if [ $? -eq 0 ]; then
    # Verificar integridade
    INTEGRITY=$(sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" 2>/dev/null)
    if [ "$INTEGRITY" = "ok" ]; then
        SIZE=$(du -sh "$BACKUP_FILE" | awk '{print $1}')
        echo "[$(date '+%H:%M:%S')] ✓ Backup íntegro: $BACKUP_FILE ($SIZE)"
    else
        echo "[$(date '+%H:%M:%S')] ⚠ Backup criado mas com problemas de integridade!"
    fi
    
    # Rotação: manter apenas os últimos N backups
    BACKUP_COUNT=$(ls -1t "$BACKUP_DIR"/dataset_backup_*.db 2>/dev/null | wc -l)
    if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
        ls -1t "$BACKUP_DIR"/dataset_backup_*.db | tail -n +$((MAX_BACKUPS + 1)) | while read old; do
            rm -f "$old"
            echo "  Rotação: removido $(basename $old)"
        done
    fi
else
    echo "ERRO: Falha ao realizar o backup."
    exit 1
fi
