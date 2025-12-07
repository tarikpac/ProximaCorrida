# ProximaCorrida Standalone Scraper

Standalone Playwright scraper that runs via GitHub Actions cron job.

## Overview

This scraper extracts running events from `corridasemaratonas.com.br` for all 27 Brazilian states and writes them directly to Supabase/PostgreSQL via Prisma Client.

## Features

- **Standalone**: No NestJS, no Redis, no BullMQ dependencies
- **Zero Cost**: Runs on GitHub Actions free tier
- **Pre-fetch Filter**: Skips recently updated events to save time
- **Graceful Error Handling**: Individual event/state failures don't crash the job
- **Push Notifications**: Triggers API endpoint for new events

## Directory Structure

```
scripts/scraper/
├── src/
│   ├── main.ts           # Entry point
│   ├── config.ts         # Environment configuration
│   ├── db.ts             # Prisma Client operations
│   ├── scraper.ts        # Core scraping logic
│   ├── notifications.ts  # Push notification triggers
│   ├── interfaces/       # TypeScript interfaces
│   └── utils/            # Price & image extraction
├── prisma/
│   └── schema.prisma     # Database schema
├── package.json
├── tsconfig.json
└── .env.example
```

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

### Run All States

```bash
npm start
```

### Run Single State (for testing)

```bash
npx ts-node src/main.ts --state=PB
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
4. Optionally specify a single state (e.g., `PB`)

### Required Secrets

Add these secrets in GitHub repository settings:

- `DATABASE_URL` - Supabase connection string
- `DIRECT_URL` - Direct Postgres connection
- `API_BASE_URL` - API base URL for notifications

## Fallback Option: Cloud Run

If GitHub Actions limits become a problem:

1. Build Docker image from `scripts/scraper/`
2. Deploy as Cloud Run Job
3. Configure Cloud Scheduler for daily execution
4. Use Secret Manager for credentials

(Not implemented yet - document only)

## Notes

- The scraper processes 27 states sequentially
- Total execution time: ~30-60 minutes depending on events
- Job timeout: 2 hours
- Events are deduplicated by `sourceUrl`
- Pre-fetch filter skips events updated within 7 days
