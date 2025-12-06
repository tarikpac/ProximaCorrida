# Refatoração da Arquitetura do Scraper: Micro-Batching por Estado

**Data:** 06/12/2025
**Contexto:** O scraper processava todos os estados do Brasil sequencialmente em um único Job. Devido às limitações de memória do Render (Free Tier), o processo frequentemente sofria "Out Of Memory" (OOM) no meio da execução (ex: na Bahia). Ao reiniciar, o processo recomeçava do zero (Acre), criando um loop onde os estados finais nunca eram alcançados.

## Mudanças Realizadas

### 1. Arquitetura de "Micro-Jobs"
Em vez de um único job gigante `scrape-platform` que leva minutos/horas, o sistema agora quebra o trabalho em dezenas de jobs menores, um para cada estado.

**Antes:**
- Job: `scrape-platform` { platform: 'corridasemaratonas' }
- Execução: Loop for AC, AL, AP, AM, BA... SP.

**Depois:**
- Job 1: `scrape-platform` { platform: 'corridasemaratonas', state: 'AC' }
- Job 2: `scrape-platform` { platform: 'corridasemaratonas', state: 'AL' }
- ...
- Job 27: `scrape-platform` { platform: 'corridasemaratonas', state: 'TO' }

### 2. Benefícios
- **Resiliência:** Se o job da BA falhar por memória, apenas ele falha. O BullMQ pode tentar novamente (retry) apenas aquele estado, ou simplesmente registrar o erro, enquanto o job de SP continua inalterado em outro processo.
- **Gerenciamento de Memória:** O navegador abre, processa um estado e fecha. O Garbage Collection tem oportunidade de limpar tudo entre os jobs.
- **Escalabilidade:** No futuro, com múltiplos workers, esses jobs podem rodar em paralelo.

### 3. Alterações Técnicas

#### `BaseScraper` e Interfaces
- Adicionado método opcional `getSplits()`: Retorna sub-alvos (ex: siglas dos estados) para dividir o trabalho.
- Atualizado método `scrape()`: Aceita argumento opcional `filter` (string) para processar apenas um sub-alvo específico.

#### `CorridasEMaratonasScraper`
- Expõe a lista de estados via `getSplits()`.
- No método `scrape`, verifica se um `stateFilter` foi passado. Se sim, filtra a lista `STATE_URLS` para processar apenas aquele estado.

#### `ScraperService`
- **`enqueueAllPlatforms`**: Agora verifica se o scraper possui `getSplits()`.
  - Se sim, cria um job para cada item retornado.
  - Se não, cria um único job genérico (comportamento legado).
- **`runPlatform`**: Aceita parâmetro opcional `jobData` (contendo o estado) e repassa para o método `scrape`.

#### `ScraperProcessor`
- Atualizado para ler a propriedade `state` do payload do job e passar para o `ScraperService`.

---

**Nota:** A lógica de Upsert em Tempo Real (callback) foi mantida e funciona perfeitamente com essa nova arquitetura. Cada micro-job vai salvar seus eventos assim que encontrá-los.
