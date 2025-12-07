# Spec Requirements: Scraper Enhancement - Photos & Prices

## Initial Description
**Scraper Enhancement: Photos & Prices** — Improve scraper to reliably capture event images and pricing information. Refine selectors and logic to handle various site structures. `S`

## Requirements Discussion

### First Round Questions

**Q1:** Percebi que o scraper atual (`CorridasEMaratonasScraper`) já possui métodos `extractImage` e `extractPrice`. Estou assumindo que o problema é que **esses métodos não estão funcionando confiavelmente** (retornando `null` com frequência). Isso está correto, ou há outro problema específico?

**Answer:** Sim — a suposição está correta. Mesmo já existindo métodos como `extractImage` e `extractPrice`, o problema é que eles não são confiáveis o suficiente, especialmente porque:
- Diferentes plataformas usam HTML completamente inconsistente
- Muitas imagens não estão em `<img>`, mas sim em `background-image`
- Meta tags são mal configuradas por alguns organizadores
- Preços aparecem em múltiplas categorias (PCD, kids, meia etc.) e o scraper pega o menor preço errado

Ou seja: o scraper atual funciona, mas precisa de **heurísticas mais inteligentes e fallback chains mais robustos**.

---

**Q2:** Quanto às **imagens**, estou assumindo que devemos priorizar capturar a imagem principal/destaque do evento (banner/poster) e opcionalmente acessar a página de inscrição para buscar imagens melhores. Isso está correto? Devemos armazenar múltiplas imagens ou apenas a principal?

**Answer:** Sim, a priorização deve ser esta:

**Ordem de captura da imagem (fallback chain):**
1. Meta tags (`og:image`, `twitter:image`) — geralmente mais confiáveis
2. Imagem principal (banner/poster) na página do evento
3. Página de inscrição (regLink) — quase sempre tem imagem melhor
4. Fallback: maior `<img>` da página
5. Fallback: `background-image` CSS (quando aplicável)

**Quantidade de imagens:** Para o MVP → armazenar **UMA imagem principal**. Isso reduz payload do banco, reprocessamento, e custo de scraping. Um futuro upgrade pode permitir múltiplas imagens (carrossel), mas não agora.

---

**Q3:** Quanto aos **preços**, vejo que o modelo já tem `priceText` (texto original) e `priceMin` (valor numérico mínimo). Estou assumindo que devemos extrair o preço mais baixo disponível e normalizar o valor para comparação. Existem casos especiais a considerar?

**Answer:** Sim, devemos extrair:
- `priceText` → texto amigável
- `priceMin` → valor numérico (para ordenação e filtros futuros)

**MAS** não devemos simplesmente pegar o menor preço encontrado, porque isso quase sempre leva aos preços de: PCD, idoso, meia, infantil/kids, promoções específicas, combos irrelevantes.

### Heurística Completa de Preço

**A) Para cada ocorrência de "R$ xx,xx" no texto:**

Leia o contexto (linha ou bloco de DOM onde ele aparece) e classifique como:

→ **Categoria "discounted" (desconto)** - Se o texto ao redor contiver:
- `pcd`, `p.c.d`, `portador de deficiência`
- `idoso`, `melhor idade`
- `estudante`, `meia`
- `kids`, `infantil`, `mirim`
- `promoção`, `promo`, `cupom`

**Esses preços NÃO devem representar o preço do evento no card.**

→ **Categoria "general" (público padrão)** - Se o texto contiver:
- `lote 1`, `1º lote`, `primeiro lote`
- `lote promocional` (sem indicar categoria especial)
- `kit básico`, `kit standard`, `kit corredor`
- `corrida 5km`, `10km`, `21km`, `geral`

E não tiver palavras de desconto. **Esses preços são os corretos para o card.**

**B) Seleção final:**
- ✔️ Se existir preços da categoria `general`: `priceMin` = menor preço general, `priceText` = "A partir de R$ xx,xx"
- ✔️ Se só existirem preços "discounted": `priceMin` = null, `priceText` = "Ver valores na página de inscrição"
- ✔️ Se houver ambiguidade: ignorar esse preço OU pegar o segundo menor preço se o menor for PCD/kids

**C) HTML sem estrutura (texto solto):**
- Janela de contexto: 30–40 caracteres antes e depois de cada "R$"
- Aplicar a mesma lógica de classificação acima
- Filtrar preços por categoria

**D) Casos especiais:**
- Evento gratuito → `priceMin = 0`, `priceText = "Gratuito"`
- Preços escondidos / em breve → `priceMin = null`, `priceText = "Sob consulta"`
- Vários lotes → procurar sempre o menor `general`
- Sites que carregam preço via JS → Playwright deve aguardar seletor específico

---

**Q4:** O scraper acessa a página de inscrição (regLink) para buscar mais dados. Estou assumindo que isso deve continuar. Correto?

**Answer:** Sim. Isso deve continuar e é importante. Motivos:
- Maior qualidade de imagens
- Preços mais confiáveis
- Mais informações sobre lotes e kits
- Fallback quando o corridasemaratonas lista pouco conteúdo

---

**Q5:** Há sites/fontes específicos além do CorridasEMaratonas.com.br onde a extração de fotos/preços está falhando mais? Devemos focar em algum em particular?

**Answer:** Comportamento típico das plataformas problemáticas:

| Plataforma | Problema Principal |
|------------|-------------------|
| **CorridasEmMaratonas** | Falha principalmente na imagem (quase nunca tem banner); às vezes não tem preço nenhum |
| **TicketSports** | Preço carregado por JS → requer seletor específico + espera; imagens às vezes pequenas ou ausentes |
| **Doity** | Imagem nem sempre é banner; meta tags inconsistentes |
| **Zenite** | Lista muitos lotes → precisa da heurística de categorias |

Devemos focar em melhorar heurística de imagem + preços, especialmente nessas plataformas.

---

**Q6:** Existe algo que NÃO devemos incluir neste escopo?

**Answer:** Fora do escopo (não implementar agora):
- Baixar imagem para storage próprio (usar apenas URL)
- Gerar thumbnails / compressão
- Cache local dos valores
- Múltiplas imagens por evento
- CDN ou otimização complexa
- Clusterização de preços por IA

Essas são fases futuras.

### Existing Code to Reference

**Similar Features Identified:**

| Feature | Path | Descrição |
|---------|------|-----------|
| `extractPrice` | `apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts` | Método atual de extração de preço - deve ser reescrito com nova heurística |
| `extractImage` | `apps/api/src/scraper/scrapers/corridas-emaratonas.scraper.ts` | Método atual de extração de imagem - deve ser reescrito com fallback chain |
| `EventsService.upsertBySourceUrl` | `apps/api/src/events/events.service.ts` | Já aceita `price` e `imageUrl` → basta alimentar corretamente |
| `normalizeDistance` | Scraper | Continua igual, não precisa alteração |
| `EventCard.tsx` | `apps/web/` | Já espera `priceText` ou `priceMin` → basta retornar isso do backend |
| Playwright config | Scraper | Mantém tudo, apenas adiciona waits seletivos para plataformas JS-heavy |

### Follow-up Questions

Não foram necessárias perguntas de follow-up. As respostas foram completas e detalhadas.

## Visual Assets

### Files Provided:
Nenhum arquivo visual foi adicionado à pasta `planning/visuals/`.

### Visual Insights:
N/A - Nenhum visual fornecido.

## Requirements Summary

### Functional Requirements

**Extração de Imagens:**
- Implementar fallback chain robusto (meta tags → banner → regLink → maior img → background-image)
- Armazenar apenas UMA imagem principal por evento (MVP)
- Aguardar seletores específicos para plataformas JS-heavy

**Extração de Preços:**
- Implementar heurística de classificação de preços (`general` vs `discounted`)
- Filtrar preços de categorias especiais (PCD, idoso, meia, kids, promo)
- Extrair `priceMin` (numérico) e `priceText` (exibição)
- Usar janela de contexto (30-40 chars) para classificar preços em texto solto
- Tratar casos especiais: gratuito, sob consulta, múltiplos lotes

**Plataformas Alvo:**
- CorridasEmMaratonas (principal)
- TicketSports (JS-heavy, precisa de waits)
- Doity (meta tags inconsistentes)
- Zenite (muitos lotes)

### Reusability Opportunities

- Métodos `extractPrice` e `extractImage` existentes → reescrever com nova lógica
- `EventsService.upsertBySourceUrl` → já preparado para receber os dados
- `EventCard.tsx` → já preparado para exibir `priceText` e `priceMin`
- Arquitetura Playwright existente → apenas adicionar waits seletivos

### Scope Boundaries

**In Scope:**
- Reescrever `extractImage` com fallback chain robusto
- Reescrever `extractPrice` com heurística de classificação
- Adicionar listas de keywords para categorias `general` e `discounted`
- Implementar janela de contexto para parsing de texto
- Adicionar waits para plataformas JS-heavy (TicketSports, etc.)
- Tratar casos especiais (gratuito, sob consulta)
- Retornar dados corretos para `priceMin`, `priceText`, `imageUrl`

**Out of Scope:**
- Download de imagens para storage próprio
- Geração de thumbnails/compressão
- Cache local de valores
- Múltiplas imagens por evento
- CDN ou otimização de assets
- IA/ML para classificação de preços
- Novos scrapers para outras plataformas

### Technical Considerations

- **Playwright:** Deve aguardar seletores específicos para plataformas que carregam conteúdo via JS
- **Regex:** Necessário para capturar `R$ xx,xx` e janela de contexto
- **Fallback Chain:** Implementar de forma clara e testável
- **Manutenibilidade:** As listas de keywords devem ser fáceis de atualizar
- **Performance:** Não impactar significativamente o tempo de scraping
- **Testes:** Garantir cobertura para cada cenário da heurística
