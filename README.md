# CROM Dataset (OpenData Hub)

Uma plataforma descentralizada e open-source para indexação de arquivos, datasets, vídeos, imagens e códigos. O CROM Dataset é uma **casca** — não armazena binários localmente. Todos os dados vivem em provedores externos gratuitos.

🌐 **Produção:** [dados.crom.run](https://dados.crom.run) | [dataset.crom.run](https://dataset.crom.run)

## Arquitetura Casca (Zero Storage Local)

O CROM Dataset atua como um **indexador de metadados**:
- **O que armazenamos**: Título, descrição, categoria, licença, URL do provedor → tudo no SQLite
- **O que NÃO armazenamos**: Nenhum arquivo binário. Zero uploads locais.
- **Quem armazena**: Os provedores externos cuidam do storage real

```
Usuário → [Upload] → Backend (RAM) → Provedor Externo → URL salva no SQLite
                      ↑ nunca toca em disco
```

### Provedores de Storage Suportados (Gratuitos)

| Provedor | Custo | Limite | Auth |
|----------|-------|--------|------|
| **HuggingFace** | Grátis | Ilimitado | `HF_TOKEN` |
| **Internet Archive** | Grátis | Ilimitado | `IA_ACCESS_KEY` + `IA_SECRET_KEY` |
| **Catbox.moe** | Grátis | 200MB/arquivo | Nenhuma (anônimo) |
| **Link Externo** | — | — | — (URL direta) |

### Download Proxy

Downloads passam pela API do CROM (`/api/download/{id}`) — a URL real do provedor nunca é exposta no frontend. O backend faz proxy com `Content-Disposition: attachment`.

## Stack Técnica

- **Backend**: Go 1.22 + SQLite (Standard Library, zero framework)
- **Frontend**: React 19 + Vite 8 + TailwindCSS 3
- **Deploy**: Docker multi-stage (~30MB) + Nginx reverse proxy

## Deploy na VPS (Docker)

```bash
# 1. Configurar
cp backend/.env.example backend/.env
nano backend/.env

# 2. Deploy
docker compose up -d --build

# 3. Atualizar depois
./update.sh
```

### Variáveis de Ambiente

```env
PORT=8090
ADMIN_API_KEY=chave-secreta-forte
HF_TOKEN=hf_...
HF_DEFAULT_REPO=usuario/repo
IA_ACCESS_KEY=...
IA_SECRET_KEY=...
IA_ITEM_ID=crom-dataset-uploads
```

## Desenvolvimento Local

```bash
# Backend
cd backend && go run .

# Frontend (outra aba)
cd frontend && npm install && npm run dev

# Ou use o monitor interativo
chmod +x monitor.sh && ./monitor.sh
```

## API Endpoints

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/api/stats` | GET | — | Estatísticas públicas |
| `/api/providers` | GET | — | Provedores de upload |
| `/api/download/{id}` | GET | — | Download proxy (público) |
| `/api/items` | GET | Token | Listar datasets |
| `/api/items` | POST | Token | Criar dataset / upload |
| `/api/items/{id}` | GET | Token | Detalhe do dataset |
| `/api/licenses` | GET | Token | Listar licenças |
| `/api/admin/tokens` | POST | Admin | Criar token de acesso |

## Funcionalidades

- **Multi-Provider Upload**: Usuário escolhe HuggingFace, Internet Archive ou Catbox no momento do upload
- **Download Proxy**: URL do provedor nunca exposta — tudo passa por `/api/download/{id}`
- **Filtro por Personas**: Dev, Vídeo, Design, Áudio
- **Gerenciamento de Licenças**: CC0, CC-BY, CC-BY-NC, Suno, Proprietária
- **Docker One-Shot**: `docker compose up -d --build` e pronto

---
_Alicerçado na filosofia Crom de Soberania Digital._
