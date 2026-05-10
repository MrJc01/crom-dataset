# CROM Dataset (OpenData Hub)

Uma plataforma descentralizada e open-source para hospedagem e indexação de arquivos, datasets, vídeos, imagens e códigos. Feita para agilizar o fluxo de desenvolvedores, designers e editores.

## Arquitetura

O CROM Dataset utiliza uma arquitetura **Desacoplada**:
- **Backend (Go + SQLite)**: Uma API rápida, construída apenas com a Standard Library do Go, otimizada para buscar dados na memória. Implementa restrições de permissão por `X-API-Key` para administradores.
- **Frontend (React + Vite + TailwindCSS)**: Uma SPA moderna e otimizada (OpenData Hub Interface), estruturada com filtragens baseadas em Persona e categorização profunda via Metadados, permitindo uma navegação Premium e focada no tipo de profissional.

## Funcionalidades Chave

- **Filtro por Personas**: Diferencia o conteúdo entre _Editor de Vídeo_, _Programador/Data_ e _Designer_.
- **Gerenciamento de Licenças**: O sistema suporta múltiplas tags de licenciamento (`CC0-1.0`, `CC-BY-NC`, `SUNO-NON-COMMERCIAL`) para proteção do usuário em projetos open-source e modelos de Distillation AI.
- **Orquestração Automática**: Inclui o `monitor.sh`, um utilitário CLI interativo para iniciar/parar/reiniciar os serviços em rede local de forma invisível.

## Como Executar

### Pré-requisitos
- **Go** 1.22+
- **Node.js** 20+

### Instalação e Uso Rápido
1. Clone o repositório.
2. Na raiz do projeto, dê permissão ao monitor:
   ```bash
   chmod +x monitor.sh scripts/*.sh
   ```
3. Inicie o sistema interativo:
   ```bash
   ./monitor.sh
   ```
4. Selecione a opção **1) Iniciar Todos os Serviços**.
5. Acesse a aplicação na URL fornecida (ex: `http://192.168.x.x:5173`).

---
_Alicerçado na filosofia Crom de Soberania Digital._
