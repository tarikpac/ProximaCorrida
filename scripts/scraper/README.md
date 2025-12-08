# ProximaCorrida Multi-Provider Scraper

Multi-provider Playwright scraper that runs via GitHub Actions cron job.

## Overview

This scraper extracts running events from multiple providers (ticket platforms) and writes them directly to Supabase/PostgreSQL via Prisma Client. Events are deduplicated across providers to avoid duplicates.

## Features

- **Multi-Provider**: Supports multiple event platforms (TicketSports, Sympla, Doity, etc.)
- **Provider Orchestration**: Runs providers sequentially with error isolation
- **Cross-Provider Deduplication**: Removes duplicate events across providers
- **Standalone**: No NestJS, no Redis, no BullMQ dependencies
- **Zero Cost**: Runs on GitHub Actions free tier
- **Pre-fetch Filter**: Skips recently updated events to save time
- **Graceful Error Handling**: Individual provider/event failures don't crash the job
- **Push Notifications**: Triggers API endpoint for new events

## Providers

| Provider | Priority | Coverage | Status |
|----------|----------|----------|--------|
| TicketSports | 1 | Nacional | ✅ Active |
| Minhas Inscrições | 2 | Nacional | ✅ Active |
| Doity | 3 | Nacional | ✅ Active |
| Sympla | 4 | Nacional | ✅ Active |
| Zenite | 5 | Nacional | ✅ Active |
| Corre Paraíba | 6 | Nordeste | ✅ Active |
| Race83 | 7 | Nordeste | ✅ Active |
| CorridasEMaratonas | 8 | Nacional (legacy) | ✅ Active |

## Directory Structure

```
scripts/scraper/
├── src/
│   ├── main.ts             # Entry point
│   ├── orchestrator.ts     # Multi-provider orchestrator
│   ├── config.ts           # Environment configuration
│   ├── db.ts               # Prisma Client operations
│   ├── scraper.ts          # Legacy scraping logic
│   ├── notifications.ts    # Push notification triggers
│   ├── interfaces/         # TypeScript interfaces
│   ├── providers/          # Provider implementations
│   │   ├── base.ts         # Base provider utilities
│   │   ├── corridasemaratonas.ts  # Legacy provider
│   │   └── index.ts        # Provider registry
│   └── utils/              # Price, image, normalization
├── prisma/
│   └── schema.prisma       # Database schema
├── package.json
├── jest.config.js          # Test configuration
├── tsconfig.json
└── .env.example
```

## CLI Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `--state=XX` | Filter by state(s) | `--state=PB` or `--state=PB,PE,RN` |
| `--provider=NAME` | Run only specific provider | `--provider=corridasemaratonas` |
| `--skip-legacy` | Skip corridasemaratonas provider | `--skip-legacy` |
| `--legacy-only` | Use only legacy scraper | `--legacy-only` |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | Supabase PostgreSQL connection string |
| `DIRECT_URL` | ❌ | `DATABASE_URL` | Direct connection (bypasses pooler) |
| `API_BASE_URL` | ❌ | `http://localhost:3000` | API URL for notifications |
| `DETAIL_TIMEOUT_MS` | ❌ | `15000` | Timeout for event details page |
| `REG_TIMEOUT_MS` | ❌ | `20000` | Timeout for registration page |
| `SCRAPER_EVENT_DELAY_MS` | ❌ | `500` | Delay between events |
| `SCRAPER_STALENESS_DAYS` | ❌ | `7` | Days before event is stale |
| `LOG_LEVEL` | ❌ | `info` | Log verbosity (debug/info/warn/error) |

## Local Development

### Setup

```bash
cd scripts/scraper
npm install
npx prisma generate
```

### Run All Providers

```bash
npm start
```

### Run Single State (for testing)

```bash
npx ts-node src/main.ts --state=PB
```

### Run Specific Provider

```bash
npx ts-node src/main.ts --provider=corridasemaratonas
```

### Run Multiple States

```bash
npx ts-node src/main.ts --state=PB,PE,RN
```

### Run Tests

```bash
npm test
```

### Environment

Create `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Edit .env with your credentials
```

## GitHub Actions

The workflow runs automatically at 06:00 UTC (03:00 BRT) daily.

### Manual Trigger

1. Go to Actions tab in GitHub
2. Select "Standalone Scraper" workflow
3. Click "Run workflow"
4. Optionally specify:
   - `state`: Single state to scrape (e.g., `PB`)
   - `provider`: Specific provider to run
   - `skip-legacy`: Skip legacy provider

### Required Secrets

Add these secrets in GitHub repository settings:

- `DATABASE_URL` - Supabase connection string
- `DIRECT_URL` - Direct Postgres connection
- `API_BASE_URL` - API base URL for notifications

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Orchestrator                       │
├─────────────────────────────────────────────────────┤
│  Provider 1  │  Provider 2  │  ...  │  Provider N   │
│  (priority)  │  (priority)  │       │  (priority)   │
└──────────────┴──────────────┴───────┴───────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Deduplication  │
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Database Upsert │
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Notifications   │
              └─────────────────┘
```

## Notes

- Providers are executed sequentially by priority order
- Lower priority number = higher precedence for deduplication
- Total execution time: ~30-60 minutes depending on providers
- Job timeout: 2 hours
- Events are deduplicated by normalized title + date + city + state
- Pre-fetch filter skips events updated within 7 days
