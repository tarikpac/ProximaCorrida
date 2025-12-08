# Spec Requirements: API Migration to AWS Lambda + API Gateway

## Initial Description

**API Migration to AWS Lambda + API Gateway** — Adapt NestJS for serverless using `@vendia/serverless-express` or similar adapter. Configure Lambda (Node 20 runtime, handler exported) and API Gateway (HTTP API) to expose routes. Secrets via SSM/Secrets Manager (DATABASE_URL, DIRECT_URL, REDIS_URL, VAPID keys). Logging via CloudWatch with short retention. Update Vercel frontend to point to new API Gateway URL. Cold starts acceptable for current volume. `M`

## Requirements Discussion

### First Round Questions

**Q1:** Eu assumo que usaremos `@vendia/serverless-express` como o adaptador para NestJS → Lambda. Isso está correto, ou você prefere outra opção?
**Answer:** Vamos de `@vendia/serverless-express` (estável, bem suportado). Outras opções só se houver restrição; não vejo necessidade.

**Q2:** Para o deploy, eu assumo que usaremos Serverless Framework (serverless.yml) para definir Lambda + API Gateway. Prefere AWS SAM, Terraform, AWS CDK, ou deploy manual via console/CLI?
**Answer:** Prefiro Serverless Framework (serverless.yml) pelo equilíbrio simplicidade/infra-as-code. SAM é OK como alternativa; CDK/Terraform aumentam esforço. Deploy manual não recomendado.

**Q3:** Eu assumo que usaremos API Gateway HTTP API (mais barato, mais rápido) ao invés de REST API. Está correto?
**Answer:** Sim, use HTTP API (mais barato e rápido) em vez de REST API.

**Q4:** Qual região AWS preferida para o deploy?
**Answer:** Ideal é co-localizar com o Supabase. Se Supabase estiver em `sa-east-1`, siga `sa-east-1`; caso contrário, escolha a mesma região do Supabase para minimizar latência/egress.

**Q5:** Para secrets, usaremos AWS SSM Parameter Store (grátis) ao invés de Secrets Manager?
**Answer:** SSM Parameter Store (Standard) é suficiente e sem custo recorrente relevante. Secrets Manager só se quisermos rotação automática (não há necessidade agora).

**Q6:** Quais secrets/variáveis de ambiente são necessários?
**Answer:** 
- `DATABASE_URL` (obrigatório)
- `DIRECT_URL` (se usar)
- `VAPID_PUBLIC_KEY` (obrigatório)
- `VAPID_PRIVATE_KEY` (obrigatório)
- `NODE_ENV=production` (obrigatório)
- `REDIS_URL`: Só se ainda formos usar fila BullMQ. Como o worker contínuo deve sair, se o endpoint de notificações depender de fila, precisamos repensar—melhor disparar inline ou remover dependência.

**Q7:** Eu assumo que a API NestJS atual não precisa de modificações significativas. Há algo específico que sabe que vai quebrar ou precisa de atenção especial?
**Answer:** 
- Criar `lambda.ts` com handler exportado via `@vendia/serverless-express`
- CORS: permitir origem do front (Vercel) e do API Gateway
- Remover/desativar startup que dependa de servidor contínuo (ex.: `prisma migrate` no boot; filas BullMQ sem worker dedicado)
- **Atenção crítica:** Qualquer dependência de REDIS/BullMQ vai falhar se não configurarmos; ideal desativar fila no Lambda ou mover notificações para execução inline.

**Q8:** Sobre cold starts: o volume atual de requisições é baixo o suficiente que cold starts de ~1-2s são aceitáveis. Confirma?
**Answer:** Sim, para nosso volume baixo, cold start de ~1–2s é aceitável. Provisioned concurrency só se o SLA exigir, pois aumenta custo.

**Q9:** Há algo que você quer explicitamente excluir deste escopo?
**Answer:** 
- **Custom domain**: deixar para depois (usar URL do API Gateway por enquanto)
- **CI/CD automatizado**: pode começar manual/SLS CLI e automatizar depois
- **Monitoramento avançado**: ficar no CloudWatch básico por ora

### Existing Code to Reference

**Similar Features Identified:**
- Não há configuração serverless pronta no repositório
- Referência atual é Docker/Render (arquivos Docker existentes)
- Variáveis já centralizadas via `.env` e `ConfigModule` do NestJS
- Seguir padrão de envs existentes para consistência

### Follow-up Questions

Nenhuma pergunta de follow-up necessária. As respostas foram completas e claras.

## Visual Assets

### Files Provided:
No visual assets provided (expected for infrastructure feature).

### Visual Insights:
N/A - Infrastructure migration does not require visual mockups.

## Requirements Summary

### Functional Requirements

**Adaptador Serverless:**
- Usar `@vendia/serverless-express` para adaptar NestJS ao Lambda
- Criar handler dedicado (`lambda.ts`) exportado como entry point

**Infraestrutura AWS:**
- AWS Lambda com Node 20 runtime
- API Gateway HTTP API (não REST API)
- Região: co-localizar com Supabase (provavelmente `sa-east-1`)
- Logging via CloudWatch (retenção curta)

**Configuração de Secrets:**
- Usar AWS SSM Parameter Store (Standard, sem custo)
- Secrets necessários: `DATABASE_URL`, `DIRECT_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NODE_ENV`
- `REDIS_URL` apenas se mantiver dependência de fila (desaconselhado)

**Deploy:**
- Serverless Framework (`serverless.yml`)
- Deploy inicial via CLI (`sls deploy`)
- Automação CI/CD pode vir depois

**Ajustes na API NestJS:**
- Criar `lambda.ts` com handler exportado
- Configurar CORS para Vercel + API Gateway
- Remover/desativar lógica de startup contínuo (`prisma migrate`, BullMQ workers)
- Desativar ou mover notificações de fila para execução inline

**Frontend:**
- Atualizar `NEXT_PUBLIC_API_URL` no Vercel para apontar para URL do API Gateway

### Reusability Opportunities

- Reutilizar padrão de configuração de variáveis de ambiente via `ConfigModule`
- Referência aos Dockerfiles existentes para entender dependências de build
- Manter estrutura de rotas e controllers NestJS inalterada

### Scope Boundaries

**In Scope:**
- Criar handler Lambda com `@vendia/serverless-express`
- Configurar `serverless.yml` com Lambda + API Gateway HTTP API
- Configurar secrets no SSM Parameter Store
- Ajustar CORS e remover dependências de servidor contínuo
- Atualizar frontend para apontar ao novo endpoint
- Documentar processo de deploy (manual via CLI)
- Logging básico via CloudWatch

**Out of Scope:**
- Custom domain (usar URL do API Gateway por enquanto)
- CI/CD automatizado (deploy manual inicialmente)
- Monitoramento avançado (apenas CloudWatch básico)
- Provisioned concurrency (cold starts aceitáveis)
- Migração de filas BullMQ (deve ser resolvido em feature separada ou inline)

### Technical Considerations

- **Cold Start:** ~1-2s aceitável para volume atual
- **BullMQ/Redis:** Dependências de fila precisam ser desativadas ou movidas para inline no contexto Lambda
- **Prisma:** Remover `prisma migrate` do startup; migrations devem rodar separadamente
- **Região AWS:** Deve coincidir com região do Supabase para minimizar latência e custo de egress
- **Memória Lambda:** Balancear custo vs cold start (começar com 512MB-1GB e ajustar)
- **Timeout:** Configurar timeout adequado (ex.: 30s para endpoints normais)
