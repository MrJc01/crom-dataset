#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# monitor.sh — CROM Dataset Orchestrator v2.0
# Dashboard de controle para serviços Backend (Go) e Frontend (Vite)
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

VERSION="2.0.0"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR" || exit 1

# ── Cores ──
G='\033[0;32m'    # Green
R='\033[0;31m'    # Red
Y='\033[1;33m'    # Yellow
C='\033[0;36m'    # Cyan
B='\033[1;34m'    # Blue
M='\033[0;35m'    # Magenta
W='\033[1;37m'    # White Bold
D='\033[0;90m'    # Dim
N='\033[0m'       # Reset

# ── Configurações ──
BACKEND_PORT=8080
LOG_MAX_SIZE=$((10 * 1024 * 1024)) # 10MB
MAX_BACKUPS=5

# ── Funções Utilitárias ──
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log_info()  { echo -e "${D}[$(timestamp)]${N} ${G}✓${N} $1"; }
log_warn()  { echo -e "${D}[$(timestamp)]${N} ${Y}⚠${N} $1"; }
log_error() { echo -e "${D}[$(timestamp)]${N} ${R}✗${N} $1"; }

# ── Verificação de Pré-requisitos ──
check_prerequisites() {
    local missing=0
    echo -e "\n${C}Verificando pré-requisitos...${N}"
    
    for cmd in go node npm curl sqlite3 ss; do
        if command -v "$cmd" &>/dev/null; then
            echo -e "  ${G}✓${N} $cmd $(command -v $cmd)"
        else
            echo -e "  ${R}✗${N} $cmd ${R}NÃO ENCONTRADO${N}"
            missing=1
        fi
    done
    
    if [ $missing -eq 1 ]; then
        log_error "Instale as dependências faltantes antes de continuar."
        echo -e "\n${Y}Pressione Enter para continuar mesmo assim...${N}"
        read
    else
        log_info "Todos os pré-requisitos OK"
    fi
}

# ── Validação do .env ──
validate_env() {
    local env_file="$DIR/backend/.env"
    if [ ! -f "$env_file" ]; then
        log_error "Arquivo backend/.env não encontrado!"
        echo -e "  ${Y}Copie o .env.example: cp backend/.env.example backend/.env${N}"
        return 1
    fi
    
    local valid=0
    for key in PORT ADMIN_API_KEY; do
        val=$(grep -E "^${key}=" "$env_file" 2>/dev/null | cut -d '=' -f2)
        if [ -z "$val" ]; then
            log_error "Variável $key não definida em .env"
            valid=1
        fi
    done
    
    # Alerta se usando chave padrão
    admin_key=$(grep -E '^ADMIN_API_KEY=' "$env_file" | cut -d '=' -f2)
    if [ "$admin_key" = "super_secret_admin_key_123" ] || [ "$admin_key" = "troque-por-uma-chave-secreta-forte" ]; then
        log_warn "ADMIN_API_KEY está com valor padrão! Troque por uma chave forte."
    fi
    
    return $valid
}

# ── Obter IP Local ──
get_local_ip() {
    hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1"
}

# ── Health Check HTTP ──
health_check() {
    local url=$1
    local timeout=${2:-3}
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$timeout" "$url" 2>/dev/null || echo "000")
    echo "$code"
}

# ── Verificar PID Válido ──
is_pid_alive() {
    local pid=$1
    local name=$2
    if [ -z "$pid" ]; then return 1; fi
    if ! ps -p "$pid" &>/dev/null; then return 1; fi
    # Verifica se o processo é realmente o esperado
    local cmdline
    cmdline=$(ps -p "$pid" -o comm= 2>/dev/null || echo "")
    if echo "$cmdline" | grep -qi "$name" 2>/dev/null; then return 0; fi
    return 0 # Fallback: PID existe
}

# ── Rotação de Logs ──
rotate_logs() {
    mkdir -p "$DIR/logs"
    for logfile in "$DIR/logs/backend.log" "$DIR/logs/frontend.log"; do
        if [ -f "$logfile" ]; then
            local size
            size=$(stat --printf="%s" "$logfile" 2>/dev/null || echo "0")
            if [ "$size" -gt "$LOG_MAX_SIZE" ]; then
                mv "$logfile" "${logfile}.$(date +%Y%m%d_%H%M%S).old"
                touch "$logfile"
                log_info "Log rotacionado: $(basename $logfile)"
            fi
        fi
    done
}

# ── Status dos Serviços ──
check_status() {
    local LOCAL_IP
    LOCAL_IP=$(get_local_ip)
    
    echo -e "${C}┌──────────────────────────────────────────────────────────────────┐${N}"
    echo -e "${C}│${N}                    ${W}STATUS DOS SERVIÇOS${N}                          ${C}│${N}"
    echo -e "${C}├──────────────────────────────────────────────────────────────────┤${N}"
    
    # BACKEND
    local b_status="" b_health="" b_pid_display=""
    if [ -f .backend_pid ]; then
        local BPID
        BPID=$(cat .backend_pid 2>/dev/null)
        if is_pid_alive "$BPID" "backend"; then
            b_pid_display="PID: $BPID"
            local http_code
            http_code=$(health_check "http://localhost:$BACKEND_PORT/api/stats")
            if [ "$http_code" = "200" ]; then
                b_status="${G}● ONLINE${N}"
                b_health="${G}HTTP $http_code${N}"
            else
                b_status="${Y}● DEGRADADO${N}"
                b_health="${Y}HTTP $http_code${N}"
            fi
        else
            b_pid_display=""
            b_status="${R}● MORTO${N}"
            b_health="${R}PID $BPID inexistente${N}"
            rm -f .backend_pid
        fi
    else
        b_status="${D}○ PARADO${N}"
        b_health="${D}—${N}"
        b_pid_display=""
    fi
    printf "${C}│${N} %-12s %b  │  %-20s │  %b\n" "Backend:" "$b_status" "$b_pid_display" "$b_health"
    [ -n "$b_pid_display" ] && echo -e "${C}│${N}              ${D}http://${LOCAL_IP}:${BACKEND_PORT}${N}"
    
    # FRONTEND
    local f_status="" f_health="" f_pid_display=""
    if [ -f .frontend_pid ]; then
        local FPID
        FPID=$(cat .frontend_pid 2>/dev/null)
        if is_pid_alive "$FPID" "node"; then
            f_pid_display="PID: $FPID"
            local fport
            fport=$(ss -lnpt 2>/dev/null | grep "$FPID" | awk '{print $4}' | awk -F':' '{print $NF}' | head -n 1)
            [ -z "$fport" ] && fport="5173"
            local f_http
            f_http=$(health_check "http://localhost:$fport")
            if [ "$f_http" = "200" ]; then
                f_status="${G}● ONLINE${N}"
                f_health="${G}HTTP $f_http${N}"
            else
                f_status="${Y}● INICIANDO${N}"
                f_health="${Y}HTTP $f_http${N}"
            fi
            echo -e "${C}│${N}"
            printf "${C}│${N} %-12s %b  │  %-20s │  %b\n" "Frontend:" "$f_status" "$f_pid_display" "$f_health"
            echo -e "${C}│${N}              ${D}http://${LOCAL_IP}:${fport}${N}"
        else
            echo -e "${C}│${N}"
            echo -e "${C}│${N} Frontend:   ${R}● MORTO${N}   │  PID $FPID inexistente"
            rm -f .frontend_pid
        fi
    else
        echo -e "${C}│${N}"
        echo -e "${C}│${N} Frontend:   ${D}○ PARADO${N}"
    fi
    
    echo -e "${C}└──────────────────────────────────────────────────────────────────┘${N}"
}

# ── Iniciar Serviços ──
start_services() {
    echo ""
    log_info "Iniciando serviços..."
    
    # Validar .env
    if ! validate_env; then
        log_error "Corrija o .env antes de iniciar."
        echo -e "${Y}Pressione Enter...${N}"; read
        return
    fi
    
    # Rotação de logs
    rotate_logs
    mkdir -p "$DIR/logs"
    
    # Backend
    if [ -f .backend_pid ] && is_pid_alive "$(cat .backend_pid)" "backend"; then
        log_warn "Backend já está rodando (PID $(cat .backend_pid))"
    else
        log_info "Compilando e iniciando Backend..."
        bash scripts/start_backend.sh
        
        # Health check pós-start (esperar até 10s)
        local retries=10
        while [ $retries -gt 0 ]; do
            local code
            code=$(health_check "http://localhost:$BACKEND_PORT/api/stats" 1)
            if [ "$code" = "200" ]; then
                log_info "Backend respondendo HTTP 200 ✓"
                break
            fi
            retries=$((retries - 1))
            sleep 1
        done
        if [ $retries -eq 0 ]; then
            log_warn "Backend iniciou mas não respondeu ao health check"
        fi
    fi
    
    # Frontend
    if [ -f .frontend_pid ] && is_pid_alive "$(cat .frontend_pid)" "node"; then
        log_warn "Frontend já está rodando (PID $(cat .frontend_pid))"
    else
        log_info "Iniciando Frontend..."
        bash scripts/start_frontend.sh
        sleep 2
        log_info "Frontend iniciado"
    fi
    
    echo ""
    echo -e "${G}Pressione Enter para voltar ao menu...${N}"; read
}

# ── Parar Serviços ──
stop_services() {
    echo ""
    log_info "Parando serviços..."
    
    if [ -f .backend_pid ]; then
        local BPID
        BPID=$(cat .backend_pid)
        kill "$BPID" 2>/dev/null && log_info "Backend (PID $BPID) encerrado" || log_warn "Backend PID $BPID já estava parado"
        rm -f .backend_pid
    fi

    if [ -f .frontend_pid ]; then
        local FPID
        FPID=$(cat .frontend_pid)
        kill "$FPID" 2>/dev/null && log_info "Frontend (PID $FPID) encerrado" || log_warn "Frontend PID $FPID já estava parado"
        rm -f .frontend_pid
    fi
    
    # Cleanup de processos órfãos (apenas do nosso projeto)
    pkill -f "$DIR/backend/backend_app" 2>/dev/null || true
    
    # Liberar porta do backend
    fuser -k "$BACKEND_PORT/tcp" 2>/dev/null || true
    
    log_info "Todos os serviços parados."
    sleep 1
}

# ── Visualizar Logs ──
view_logs() {
    echo -e "\n${C}═══ LOGS EM TEMPO REAL ═══${N}"
    echo "1) Backend"
    echo "2) Frontend"
    echo "3) Ambos"
    echo "0) Voltar"
    echo -n "Escolha: "
    read log_choice
    case $log_choice in
        1) [ -f logs/backend.log ] && tail -f logs/backend.log || log_error "Log não encontrado" ;;
        2) [ -f logs/frontend.log ] && tail -f logs/frontend.log || log_error "Log não encontrado" ;;
        3) tail -f logs/backend.log logs/frontend.log 2>/dev/null || log_error "Logs não encontrados" ;;
        *) return ;;
    esac
}

# ── Gestão de Dados (API) ──
manage_api() {
    ADMIN_API_KEY=$(grep -E '^ADMIN_API_KEY=' backend/.env 2>/dev/null | cut -d '=' -f2)
    if [ -z "$ADMIN_API_KEY" ]; then
        log_error "ADMIN_API_KEY não encontrada em backend/.env"
        sleep 2; return
    fi

    while true; do
        clear
        echo -e "${M}═══════════════════════════════════════════════════════${N}"
        echo -e "              ${M}GESTÃO DE DADOS (API)${N}"
        echo -e "${M}═══════════════════════════════════════════════════════${N}"
        echo ""
        echo "  1) Gerar Novo Token (Admin)"
        echo "  2) Inserir Dataset Mock (HuggingFace)"
        echo "  3) Inserir Dataset Mock (Suno Audio)"
        echo "  4) Listar Licenças"
        echo "  5) Ver Estatísticas"
        echo "  6) Backup do Banco"
        echo "  0) Voltar"
        echo ""
        echo -n "  Escolha: "
        read api_choice
        case $api_choice in
            1)
                echo -n "E-mail: "; read email
                echo -n "Role (read/write): "; read role
                echo -n "Limite Mensal: "; read limit
                echo -e "\n${G}Resposta:${N}"
                curl -s -X POST http://localhost:$BACKEND_PORT/api/admin/tokens \
                    -H "Content-Type: application/json" \
                    -H "X-API-Key: $ADMIN_API_KEY" \
                    -d "{\"email\":\"$email\",\"role\":\"$role\",\"monthly_limit\":$limit}" | python3 -m json.tool 2>/dev/null || echo "Falha"
                echo -e "\n${Y}Guarde o token gerado!${N}"
                echo -e "${G}Enter para continuar...${N}"; read
                ;;
            2)
                echo -n "Token de Escrita: "; read wtoken
                curl -s -X POST http://localhost:$BACKEND_PORT/api/items \
                    -H "Content-Type: application/json" -H "X-API-Key: $wtoken" \
                    -d '{"title":"Texturas 4K Realistas","description":"Imagens PBR scanneadas gratuitas de texturas para motores 3D","category":"Imagens","license_id":1,"provider":"HuggingFace","provider_metadata":{"repo_id":"crom-data/texturas-4k","profile":"design"}}' | python3 -m json.tool 2>/dev/null || echo "Falha"
                echo -e "\n${G}Enter...${N}"; read
                ;;
            3)
                echo -n "Token de Escrita: "; read wtoken
                curl -s -X POST http://localhost:$BACKEND_PORT/api/items \
                    -H "Content-Type: application/json" -H "X-API-Key: $wtoken" \
                    -d '{"title":"Efeitos Sonoros Sci-Fi","description":"Audios espaciais e tiros de plasma gerados por IA","category":"Audio","license_id":4,"provider":"Suno","provider_metadata":{"url":"https://suno.com/song/...","profile":"audio"}}' | python3 -m json.tool 2>/dev/null || echo "Falha"
                echo -e "\n${G}Enter...${N}"; read
                ;;
            4)
                echo -e "\n${G}Licenças:${N}"
                curl -s http://localhost:$BACKEND_PORT/api/licenses -H "X-API-Key: default-read-token" | python3 -m json.tool 2>/dev/null || echo "Falha"
                echo -e "\n${G}Enter...${N}"; read
                ;;
            5)
                echo -e "\n${G}Estatísticas:${N}"
                curl -s http://localhost:$BACKEND_PORT/api/stats | python3 -m json.tool 2>/dev/null || echo "Falha"
                echo -e "\n${G}Enter...${N}"; read
                ;;
            6)
                log_info "Iniciando Backup..."
                bash scripts/backup.sh
                echo -e "\n${G}Enter...${N}"; read
                ;;
            0) return ;;
            *) log_error "Opção inválida"; sleep 1 ;;
        esac
    done
}

# ── Diagnóstico ──
diagnostics() {
    clear
    echo -e "${B}═══════════════════════════════════════════════════════${N}"
    echo -e "              ${B}DIAGNÓSTICO DO SISTEMA${N}"
    echo -e "${B}═══════════════════════════════════════════════════════${N}"
    echo ""
    
    # Uso de disco
    echo -e "${W}Uso de Disco do Projeto:${N}"
    du -sh "$DIR" 2>/dev/null | awk '{print "  Total: " $1}'
    du -sh "$DIR/backend/dataset.db" 2>/dev/null | awk '{print "  Banco: " $1}'
    du -sh "$DIR/logs/" 2>/dev/null | awk '{print "  Logs:  " $1}'
    du -sh "$DIR/frontend/node_modules/" 2>/dev/null | awk '{print "  node_modules: " $1}'
    echo ""
    
    # Contagem de registros
    echo -e "${W}Registros no Banco:${N}"
    if [ -f "$DIR/backend/dataset.db" ] && command -v sqlite3 &>/dev/null; then
        local items tokens
        items=$(sqlite3 "$DIR/backend/dataset.db" "SELECT COUNT(*) FROM items;" 2>/dev/null || echo "?")
        tokens=$(sqlite3 "$DIR/backend/dataset.db" "SELECT COUNT(*) FROM tokens;" 2>/dev/null || echo "?")
        echo "  Items:   $items"
        echo "  Tokens:  $tokens"
    else
        echo "  ${Y}sqlite3 não disponível ou banco não encontrado${N}"
    fi
    echo ""
    
    # Portas em uso
    echo -e "${W}Portas do Projeto:${N}"
    ss -lnpt 2>/dev/null | grep -E ":(${BACKEND_PORT}|5173)" | while read line; do
        echo "  $line"
    done
    echo ""
    
    # Teste de API
    echo -e "${W}Teste de Conectividade:${N}"
    local api_code
    api_code=$(health_check "http://localhost:$BACKEND_PORT/api/stats")
    if [ "$api_code" = "200" ]; then
        echo -e "  API Stats: ${G}HTTP $api_code ✓${N}"
    else
        echo -e "  API Stats: ${R}HTTP $api_code ✗${N}"
    fi
    
    echo ""
    echo -e "${G}Pressione Enter para voltar...${N}"; read
}

# ── Trap para Limpeza ──
cleanup() {
    echo ""
    log_info "Monitor encerrado."
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── Verificação Inicial ──
check_prerequisites

# ── Menu Principal ──
while true; do
    clear
    echo -e "${C}╔══════════════════════════════════════════════════════════════════╗${N}"
    echo -e "${C}║${N}                                                                ${C}║${N}"
    echo -e "${C}║${N}     ${W}██████╗██████╗  ██████╗ ███╗   ███╗${N}                        ${C}║${N}"
    echo -e "${C}║${N}     ${W}██╔════╝██╔══██╗██╔═══██╗████╗ ████║${N}                        ${C}║${N}"
    echo -e "${C}║${N}     ${W}██║     ██████╔╝██║   ██║██╔████╔██║${N}                        ${C}║${N}"
    echo -e "${C}║${N}     ${W}██║     ██╔══██╗██║   ██║██║╚██╔╝██║${N}                        ${C}║${N}"
    echo -e "${C}║${N}     ${W}╚██████╗██║  ██║╚██████╔╝██║ ╚═╝ ██║${N}                        ${C}║${N}"
    echo -e "${C}║${N}     ${W} ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝${N}                        ${C}║${N}"
    echo -e "${C}║${N}                                                                ${C}║${N}"
    echo -e "${C}║${N}     ${D}Dataset Monitor v${VERSION}${N}                                      ${C}║${N}"
    echo -e "${C}╚══════════════════════════════════════════════════════════════════╝${N}"
    echo ""
    
    check_status
    
    echo ""
    echo -e "  ${G}1)${N} Iniciar Serviços"
    echo -e "  ${Y}2)${N} Parar Serviços"
    echo -e "  ${C}3)${N} Reiniciar Tudo"
    echo -e "  ${B}4)${N} Ver Logs"
    echo -e "  ${M}5)${N} Gestão de Dados (API)"
    echo -e "  ${W}6)${N} Diagnóstico"
    echo -e "  ${D}0)${N} Sair"
    echo ""
    echo -n "  Escolha: "
    read choice
    
    case $choice in
        1) start_services ;;
        2) stop_services ;;
        3) stop_services; start_services ;;
        4) view_logs ;;
        5) manage_api ;;
        6) diagnostics ;;
        0) cleanup ;;
        *) log_error "Opção inválida"; sleep 1 ;;
    esac
done
