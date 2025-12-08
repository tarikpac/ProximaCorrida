# Spec Requirements: Multi-Provider Scraper Architecture

## Initial Description

Refactor scraper to fetch events directly from providers (TicketSports, Zenite, Doity, Sympla, Ticket Agora, MinhaInscrição, etc.) instead of aggregators like corridasemaratonas.com.br. Implement modular per-platform scrapers, automatic event discovery by region/state, and multi-source data consolidation.

## Requirements Discussion

### First Round Questions

**Q1:** Assumindo que os provedores prioritários seriam: TicketSports, Zenite, Doity, Sympla, Ticket Agora e MinhaInscrição. Existem outros provedores específicos, ou devemos priorizar uma lista menor para o MVP?

**Answer:** Concordo com o foco inicial em: TicketSports (Ticket Agora é a mesma coisa do TicketSports), Minhas Inscrições, Doity, Sympla, Zenite. Manter a lista enxuta no MVP e adicionar Corre Paraíba/Race83 apenas se forem fáceis (regionais), mas não antes de estabilizar os grandes.

---

**Q2:** Para a descoberta automática de eventos, abordagem com API pública (se disponível) vs Scraping de listagem. Investigar APIs públicas primeiro ou assumir Playwright scraping?

**Answer:** Investigar APIs públicas primeiro (se houver endpoints JSON/filtro), mas assumir que o plano base é scraping (Playwright) de listagens. Não bloquear a implementação esperando API; se achar API limpa, ótimo, senão vá de scraping.

---

**Q3:** Quanto à deduplicação cross-provider: usar matching por título + data + cidade ou lógica mais sofisticada (fuzzy matching)?

**Answer:** Começar com match por título + data + cidade (normalizados). Incluir estado e normalizar acentos. Se houver divergências, podemos adicionar fuzzy matching depois. Não complicar no MVP.

---

**Q4:** Campos a extrair além do core (título, data, cidade, estado, distâncias, regUrl, imageUrl, priceText/priceMin)?

**Answer:** Manter core: título, data, cidade/estado, distâncias, regUrl, imageUrl, priceText/priceMin. Adicionar organizador se for fácil. Descrição longa e modalidades específicas podem ficar para fase 2.

---

**Q5:** Arquitetura modular com interface base ProviderScraper, implementações por provedor e orchestrator?

**Answer:** Sim: interface base ProviderScraper, implementações por provedor e um orchestrator que chama todos. Padronizar retorno no StandardizedEvent. Boa prática: permitir filtro por UF na orquestração para não rodar o país inteiro sempre.

---

**Q6:** Manter o scraper de corridasemaratonas.com.br como fallback, remover após migração, ou descontinuar imediatamente?

**Answer:** Manter como fallback/validação durante a transição; não remover já. Quando os provedores diretos estiverem estáveis, podemos descontinuar.

---

**Q7:** Algo que NÃO devemos incluir no escopo?

**Answer:** Não incluir provedores internacionais, nem integrações de pagamento. Focar só em coleta/listagem. Não mexer em frontend além de consumir os dados existentes.

---

### Existing Code to Reference

**Similar Features Identified:**

- **Scraper Atual:** `apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts` — estrutura, extração de imagem/preço
- **Scraper Standalone (GH Actions):** `scripts/scraper/src/scraper.ts` — versão atual standalone
- **Utilitários de Preço:** `apps/api/src/scraper/utils/price-extraction.utils.ts` e `scripts/scraper/src/utils/price-extraction.ts`
- **Utilitários de Imagem:** `apps/api/src/scraper/utils/image-extraction.utils.ts` e `scripts/scraper/src/utils/image-extraction.ts`
- **Interfaces:** `apps/api/src/scraper/interfaces/standardized-event.interface.ts` e `scripts/scraper/src/interfaces/`
- **Upsert/Normalização:** `apps/api/src/events/events.service.ts` — métodos `upsertFromStandardized`, `checkEventsFreshness`, normalização de distâncias
- **Database Module Standalone:** `scripts/scraper/src/db.ts` — lógica de upsert para GitHub Actions

### Follow-up Questions

Nenhuma pergunta de follow-up necessária. Respostas completas e claras.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements

**Provedores MVP (5 provedores):**
1. TicketSports (inclui Ticket Agora)
2. Minhas Inscrições
3. Doity
4. Sympla
5. Zenite

**Provedores Futuros (pós-MVP):**
- Corre Paraíba / Race83 (regionais, apenas se fáceis)

**Core Features:**
- Scraper modular por provedor com interface base `ProviderScraper`
- Orchestrator para chamar todos os scrapers
- Filtro por UF na orquestração (não rodar país inteiro sempre)
- Retorno padronizado via `StandardizedEvent`
- Investigar APIs públicas primeiro, fallback para Playwright scraping
- Manter scraper corridasemaratonas.com.br como validação durante transição

**Campos a Extrair:**
- Core: título, data, cidade, estado, distâncias, regUrl, imageUrl, priceText, priceMin
- Opcional (se fácil): organizador
- Fase 2: descrição longa, modalidades específicas

**Deduplicação Cross-Provider:**
- Match por: título + data + cidade + estado (normalizados)
- Normalizar acentos
- Fuzzy matching: apenas se necessário depois

### Reusability Opportunities

| Componente | Caminho | Uso |
|------------|---------|-----|
| Scraper base | `scripts/scraper/src/scraper.ts` | Estrutura e padrões |
| Price extraction | `scripts/scraper/src/utils/price-extraction.ts` | Reutilizar diretamente |
| Image extraction | `scripts/scraper/src/utils/image-extraction.ts` | Reutilizar diretamente |
| Interfaces | `scripts/scraper/src/interfaces/` | Estender StandardizedEvent |
| Database/Upsert | `scripts/scraper/src/db.ts` | Reutilizar lógica |
| Freshness check | `scripts/scraper/src/db.ts` | Reutilizar lógica |

### Scope Boundaries

**In Scope:**
- Criar scrapers para 5 provedores (TicketSports, Minhas Inscrições, Doity, Sympla, Zenite)
- Interface base `ProviderScraper` e implementações
- Orchestrator com filtro por UF
- Deduplicação básica (título + data + cidade + estado)
- Integração com GitHub Actions existente
- Manter scraper corridasemaratonas.com.br como fallback

**Out of Scope:**
- Provedores internacionais
- Integrações de pagamento
- Mudanças no frontend (além de consumir dados existentes)
- Fuzzy matching avançado (fase posterior)
- Descrição longa e modalidades específicas (fase 2)
- Provedores regionais (Corre Paraíba/Race83) — apenas pós-MVP

### Technical Considerations

- **Runtime:** Node.js 20, TypeScript
- **Scraping Engine:** Playwright (headless Chromium)
- **Execution:** GitHub Actions cron (como scraper atual)
- **Database:** Supabase PostgreSQL via Prisma
- **Pattern:** Modular scrapers com interface comum
- **API First:** Investigar APIs públicas antes de scraping
- **Fallback:** Manter corridasemaratonas.com.br durante transição
- **UF Filter:** Permitir scraping parcial por estado
