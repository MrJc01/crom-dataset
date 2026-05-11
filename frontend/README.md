# CROM Dataset — Frontend

SPA moderna em React + Vite + TailwindCSS para o CROM Dataset.

## Stack

- **React 19** + **React Router 7** (SPA multi-página)
- **Vite 8** (dev server com proxy para o backend)
- **TailwindCSS 3** (design system dark-mode)
- **Phosphor Icons** (iconografia)

## Páginas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `Home` | Landing page com stats e destaques |
| `/explore` | `Explore` | Busca e filtragem de datasets |
| `/dataset/:id` | `DatasetDetail` | Detalhes + download proxy |
| `/about` | `About` | Sobre o projeto CROM |

## Desenvolvimento Local

```bash
npm install
npm run dev
```

O Vite faz proxy automático de `/api/*` para `http://localhost:8080` (backend Go).

## Produção

Em produção (Docker), o frontend é compilado para `./static/` e servido diretamente pelo backend Go — sem Nginx separado para o frontend.

```bash
npm run build   # Gera dist/
```

## Componentes Chave

- **UploadModal** — Upload com seletor de provedor (HuggingFace, Internet Archive, Catbox)
- **DatasetCard** — Card de preview com metadados
- **TokenManager** — Gerenciamento de token de API
- **Sidebar** — Filtro por personas (Dev, Vídeo, Design, Áudio)
