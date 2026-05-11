# ══════════════════════════════════════════════════════════════
# CROM Dataset — Dockerfile Multi-Stage
# Imagem final: ~30MB (Alpine + Go binary + React dist)
# Arquitetura Casca: Zero Storage Local
# ══════════════════════════════════════════════════════════════

# ── Stage 1: Build Frontend ────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build Backend ─────────────────────────────────
FROM golang:1.22-alpine AS backend-builder
# CGO necessário para go-sqlite3
RUN apk add --no-cache gcc musl-dev
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
# Build estático para Alpine
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o /crom-dataset .

# ── Stage 3: Runtime ───────────────────────────────────────
FROM alpine:3.20 AS runtime
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app

# Binário do backend
COPY --from=backend-builder /crom-dataset .
# Frontend estático
COPY --from=frontend-builder /app/frontend/dist ./static/

# Porta padrão
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/stats || exit 1

# [CASCA] Sem volumes de uploads — tudo vai para provedores externos.
# Único volume necessário: banco SQLite (metadados).
VOLUME ["/app/data"]

ENV PORT=8080

ENTRYPOINT ["./crom-dataset"]
