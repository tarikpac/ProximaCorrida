# Raw Idea: API Migration to Koyeb

## Original Description (from Roadmap)

**API Migration to Koyeb** — Migrate NestJS API from local/Render to Koyeb (free tier with generous limits). Deploy via Git integration or Docker. Configure environment variables (DATABASE_URL, DIRECT_URL, REDIS_URL, VAPID keys). Update Vercel frontend to point to new Koyeb URL. Koyeb provides always-on instances (no cold starts) with automatic HTTPS and global edge network.

## Context

- **Previous Attempt**: AWS Lambda + API Gateway was attempted but aborted due to unexpected costs.
- **New Target**: Koyeb - a platform with a generous free tier suitable for the current project scale.

## Key Motivations

1. **Zero cost** - Free tier adequate for current traffic
2. **No cold starts** - Always-on instances (unlike serverless)
3. **Simple deployment** - Git push or Docker-based
4. **Automatic HTTPS** - No certificate management needed
5. **Global edge network** - Low latency for users

## Date

Created: 2025-12-09
