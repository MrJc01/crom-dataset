# CROM Dataset (OpenData Hub)

Uma plataforma descentralizada e open-source para indexação de arquivos, datasets, vídeos, imagens e códigos. O CROM Dataset é uma **casca** — não armazena binários localmente. Todos os dados vivem em provedores externos gratuitos.

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

## Stack Técnica

- **Backend (Go + SQLite)**: API rápida com Standard Library, autenticação por `X-API-Key`, e camada de storage plugável via interface `StorageProvider`.
- **Frontend (React + Vite + TailwindCSS)**: SPA moderna com filtragem por Personas e categorização por metadados.

## Funcionalidades Chave

- **Filtro por Personas**: Diferencia conteúdo entre _Editor de Vídeo_, _Programador/Data_ e _Designer_.
- **Multi-Provider Upload**: Usuário escolhe o destino (HuggingFace, Internet Archive, Catbox.moe) no momento do upload.
- **Gerenciamento de Licenças**: Suporta múltiplas tags de licenciamento (`CC0-1.0`, `CC-BY-NC`, `SUNO-NON-COMMERCIAL`).
- **Orquestração Automática**: `monitor.sh` para iniciar/parar/reiniciar os serviços em rede local.

## Como Executar

### Pré-requisitos
- **Go** 1.22+
- **Node.js** 20+

### Instalação e Uso Rápido
1. Clone o repositório.
2. Configure os provedores:
   ```bash
   cp backend/.env.example backend/.env
   # Edite backend/.env com seus tokens
   ```
3. Na raiz do projeto, dê permissão ao monitor:
   ```bash
   chmod +x monitor.sh scripts/*.sh
   ```
4. Inicie o sistema interativo:
   ```bash
   ./monitor.sh
   ```
5. Selecione a opção **1) Iniciar Todos os Serviços**.
6. Acesse a aplicação na URL fornecida (ex: `http://192.168.x.x:5173`).

---
_Alicerçado na filosofia Crom de Soberania Digital._
