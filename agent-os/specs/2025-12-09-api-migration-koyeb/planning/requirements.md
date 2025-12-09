# Spec Requirements: API Migration to Koyeb

## Initial Description

**API Migration to Koyeb** — Migrate NestJS API from local/Render to Koyeb (free tier with generous limits). Deploy via Git integration or Docker. Configure environment variables (DATABASE_URL, DIRECT_URL, REDIS_URL, VAPID keys). Update Vercel frontend to point to new Koyeb URL. Koyeb provides always-on instances (no cold starts) with automatic HTTPS and global edge network.

**Context:**
- **Previous Attempt**: AWS Lambda + API Gateway was attempted but aborted due to unexpected costs.
- **New Target**: Koyeb - a platform with a generous free tier suitable for the current project scale.

## Requirements Discussion

### First Round Questions

**Q1:** Vejo que o tech-stack atual menciona AWS Lambda com `@vendia/serverless-express`. Assumo que vamos reverter para uma API NestJS padrão (sem adaptador serverless), mantendo o entry point `main.ts` original. Isso está correto, ou prefere manter o adaptador serverless por algum motivo?
**Answer:** Sim, voltar para NestJS padrão com main.ts (sem @vendia/serverless-express). O adaptador serverless só fazia sentido no Lambda.

**Q2:** O Koyeb suporta deploy via Git integration (push-to-deploy) ou via Docker image. Eu estou inclinado a usar Docker, pois já existe Dockerfile no projeto e dá mais controle sobre o build. Você concorda, ou prefere Git integration (mais simples, sem Dockerfile)?
**Answer:** Prefiro Docker (mais controle de build e deps). Git integration só se quisermos simplicidade absoluta sem tocar Dockerfile.

**Q3:** A tech-stack menciona que o Redis foi removido para otimizar o Lambda. Assumo que a migração para Koyeb não requer Redis (push notifications continuam inline/sync). Correto?
**Answer:** Correto: não precisamos Redis; push continua inline/síncrono.

**Q4:** A região ideal para o Koyeb seria São Paulo (sa-east-1) ou o mais próximo disponível, para minimizar latência com o Supabase. Koyeb tem opções em Washington DC, Frankfurt, e Singapore. Você tem preferência de região?
**Answer:** Koyeb não tem sa-east; escolha a mais próxima do Supabase. Se o Supabase está em us-east, pegue Washington DC. (Se estivesse em sa-east, usaria a mais próxima disponível; hoje Washington tende a ser melhor que Frankfurt/SG.)

**Q5:** Preciso das seguintes variáveis de ambiente no Koyeb. Há alguma outra variável que a API precisa que não está listada?
**Answer:** Variáveis necessárias:
- DATABASE_URL : "postgresql://postgres.acylcvqgvqyrdrpmpeqk:Panasonic20%40@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
- DIRECT_URL : "postgresql://postgres.acylcvqgvqyrdrpmpeqk:Panasonic20%40@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
- VAPID_PUBLIC_KEY : 
- VAPID_PRIVATE_KEY : 
- NODE_ENV=production
- FRONTEND_URL (para CORS) : https://proxima-corrida.vercel.app/
- VAPID_SUBJECT (se existir no código, defaults já estão no DEPLOYMENT.md)

**Q6:** Após o deploy, precisarei atualizar o frontend Vercel para apontar para a nova URL do Koyeb. Assumo que a variável NEXT_PUBLIC_API_URL no Vercel precisa ser atualizada. Há mais alguma configuração no frontend que precisa mudar?
**Answer:** Atualizar NEXT_PUBLIC_API_URL no Vercel para a URL do Koyeb. Não há outras configs no front além disso.

**Q7:** Há algo que não deve ser incluído nesta migração? Por exemplo: features novas, refatorações, ou integrações que devem ficar para depois?
**Answer:** Sem novas features/refactors; apenas migração. Não mexer em notificações (já inline) nem reintroduzir Redis/BullMQ.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Dockerfile existente - Path: `apps/api/Dockerfile`
  - **Nota:** Precisa adaptar para remover Playwright (imagem pesada desnecessária)
- Feature: DEPLOYMENT.md (Lambda guide) - Path: `apps/api/DEPLOYMENT.md`
  - **Nota:** Referência para variáveis de ambiente necessárias
- Feature: package.json - Path: `apps/api/package.json`
  - **Nota:** Scripts `start:prod` usa `node dist/src/main` (entry point correto)
- Entry point: `apps/api/src/main.ts` (usar este, NÃO lambda.ts)

**Arquivos a IGNORAR (específicos do Lambda):**
- `apps/api/serverless.yml`
- `apps/api/src/lambda.ts`

### Follow-up Questions

Nenhuma pergunta de follow-up necessária - respostas foram claras e completas.

## Visual Assets

### Files Provided:
No visual assets provided (infraestrutura - não requer mockups).

### Visual Insights:
N/A - tarefa de infraestrutura.

## Requirements Summary

### Functional Requirements
- Migrar API NestJS de Lambda para Koyeb
- Deploy via Docker (imagem customizada)
- Usar entry point padrão `main.ts` (remover adaptador serverless)
- Configurar variáveis de ambiente no Koyeb
- Atualizar frontend Vercel para apontar para nova URL
- Manter push notifications inline/síncronas (sem Redis)

### Reusability Opportunities
- **Dockerfile existente:** Adaptar removendo Playwright (não necessário na API após scraper mover para GH Actions)
- **DEPLOYMENT.md:** Listar variáveis de ambiente necessárias
- **package.json:** Script `start:prod` já configurado

### Scope Boundaries

**In Scope:**
- Criar novo Dockerfile enxuto (sem Playwright)
- Deploy da API no Koyeb (Docker)
- Configurar variáveis de ambiente no painel Koyeb
- Atualizar `NEXT_PUBLIC_API_URL` no Vercel
- Atualizar `tech-stack.md` com nova arquitetura
- Criar novo `DEPLOYMENT.md` para Koyeb (ou substituir o existente)
- Testar endpoints após deploy

**Out of Scope:**
- Novas features
- Refatorações de código
- Reintrodução de Redis/BullMQ
- Modificações no scraper (já usa GitHub Actions)
- CI/CD automático (pode ser feito depois)

### Technical Considerations
- **Dockerfile atual usa Playwright:** Precisa criar versão enxuta baseada em `node:20-alpine`
- **Região Koyeb:** Washington DC (mais próxima do Supabase)
- **Variáveis de ambiente:**
  - `DATABASE_URL` - Supabase connection pooling
  - `DIRECT_URL` - Supabase direct connection
  - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
  - `NODE_ENV=production`
  - `FRONTEND_URL` - Para CORS (https://proxima-corrida.vercel.app)
  - `VAPID_SUBJECT` - mailto:contato@proximacorrida.com.br
- **Entry point:** `dist/src/main.js` via `npm run start:prod`
- **Porta:** 3333 (ou $PORT se Koyeb definir)
- **Prisma migrations:** Executar na inicialização do container
