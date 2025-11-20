# ProximaCorrida - Raw Idea & Progress Log

## 1. O que é o Projeto?
**ProximaCorrida** é uma plataforma *mobile-first* desenvolvida para agregar e facilitar a busca por corridas de rua no Brasil. O foco inicial é o estado da Paraíba (PB), com planos de expansão nacional.

O problema que resolvemos: As informações sobre corridas estão espalhadas em diversos sites de organizadores, ticketerias e portais de notícias. O Proxima Corrida centraliza isso através de um *scraper* automatizado, oferecendo uma interface limpa, rápida e responsiva para o corredor encontrar seu próximo desafio.

## 2. Stack Tecnológica

O projeto utiliza uma arquitetura Monorepo moderna:

### Backend (`apps/api`)
- **Framework:** NestJS 11
- **Linguagem:** TypeScript
- **Database:** PostgreSQL (hospedado no Supabase)
- **ORM:** Prisma
- **Scraping:** Playwright (Headless Browser)
- **Filas/Jobs:** BullMQ (preparado para processamento em background)

### Frontend (`apps/web`)
- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** TailwindCSS v4 + Lucide React (ícones)
- **Gerenciamento de Estado/Data:** TanStack Query (React Query)
- **Testes E2E:** Playwright

### Infraestrutura
- **Containerização:** Docker & Docker Compose
- **Gerenciador de Pacotes:** npm

## 3. Progresso Atual (Status Report)

### ✅ O que já foi feito (Implementado)

#### Backend & Dados
- **Modelagem de Dados:** Tabela `Event` criada no Prisma com campos para título, data, cidade, distâncias, organizador, imagem, preço e links.
- **Scraper Funcional:**
  - O `ScraperService` acessa `corridasemaratonas.com.br/corridas-na-paraiba/`.
  - Extrai lista básica (título, data, cidade, distâncias).
  - Navega para páginas de detalhes para buscar links de inscrição (Zenite, TicketSports, Doity).
  - **Extração Avançada:** Tenta visitar a página de inscrição final para capturar a imagem de capa (OG Image ou banners) e o preço (via Regex heurístico).
  - **Upsert Logic:** Evita duplicatas usando a `sourceUrl` como chave única.
- **API REST:** Endpoints para listar e criar eventos.

#### Frontend
- **Home Page:** Listagem de eventos com `EventList` e `EventCard`.
- **Página de Detalhes:** Rota dinâmica `/events/[id]` implementada.
- **UI Components:** Cards de eventos responsivos, Header, e estrutura de layout básica.
- **Responsividade:** Trabalho recente focado em garantir que o botão de "Inscreva-se" seja fixo (sticky) em dispositivos móveis e que o layout se adapte bem entre mobile e desktop.

### 🚧 O que falta / Em Andamento
- **Refinamento do Scraper:** A extração de preços é baseada em Regex no corpo do texto, o que pode ser frágil.
- **Expansão Geográfica:** O scraper está *hardcoded* para a Paraíba. Precisa ser parametrizável para outros estados.
- **Filtros e Busca:** O frontend exibe tudo; faltam filtros por data, cidade ou distância.
- **Automação:** Configurar o scraper para rodar periodicamente (cron job) de forma robusta.
- **Tratamento de Erros:** Melhorar a resiliência caso o layout dos sites fonte mude.

## 4. Estrutura de Pastas Importantes

- `apps/api/src/scraper/scraper.service.ts`: O "cérebro" da coleta de dados.
- `apps/api/prisma/schema.prisma`: A definição do banco de dados.
- `apps/web/app/page.tsx`: A página inicial.
- `apps/web/components/EventCard.tsx`: O componente visual principal do evento.
