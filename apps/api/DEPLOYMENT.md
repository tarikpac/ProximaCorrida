# Koyeb Deployment Guide

## 📋 Overview

This guide covers deploying the ProximaCorrida API to Koyeb.

**Production URL:** `https://sensible-amalita-proximacorrida-fd8a53f4.koyeb.app`

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐
│  Vercel         │────▶│  Koyeb           │
│  Frontend       │     │  (NestJS API)    │
│  Next.js        │     │  Always-on       │
└─────────────────┘     └──────┬───────────┘
                               │
                        ┌──────▼───────┐    ┌──────────────────┐
                        │  Supabase    │    │  GitHub Actions  │
                        │  PostgreSQL  │◀───│  Scraper Cron    │
                        └──────────────┘    └──────────────────┘
```

---

## 🔐 Environment Variables

Configure these in Koyeb Dashboard → Service → Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase pooled connection (port 6543) | `postgresql://...@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase direct connection (port 5432) | `postgresql://...@aws-1-sa-east-1.pooler.supabase.com:5432/postgres` |
| `VAPID_PUBLIC_KEY` | Push notification public key | `BM...` |
| `VAPID_PRIVATE_KEY` | Push notification private key | `...` |
| `VAPID_SUBJECT` | VAPID subject | `mailto:contato@proximacorrida.com.br` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://proxima-corrida.vercel.app` |
| `NODE_ENV` | Environment | `production` |

**Note:** `PORT` is automatically set by Koyeb.

---

## 🚀 Deployment

### Automatic (Git Push)

The service is configured to auto-deploy on push to `main` branch.

### Manual Redeploy

1. Go to Koyeb Dashboard
2. Select the service
3. Click **Redeploy**

---

## 📁 Dockerfile

The API uses `apps/api/Dockerfile.koyeb`:

- **Base image:** `node:20-alpine` (lightweight)
- **Multi-stage build:** Builder + Production
- **Prisma migrations:** Run on container startup
- **No Playwright:** Scraper runs on GitHub Actions

---

## ✅ Verify Deployment

```bash
# Test root endpoint
curl https://sensible-amalita-proximacorrida-fd8a53f4.koyeb.app/
# Expected: "Hello World!"

# Test events endpoint
curl "https://sensible-amalita-proximacorrida-fd8a53f4.koyeb.app/events?limit=2"
# Expected: JSON with events data
```

---

## 📊 View Logs

1. Go to Koyeb Dashboard
2. Select the service
3. Click **Logs** tab

---

## 🔧 Troubleshooting

### Error: Environment variable not found

Make sure environment variables are set in **Environment Variables** section (not just Secrets).
If using Secrets, reference them with interpolation: `{{ secret.SECRET_NAME }}`

### Error: Prisma migration failed

Check that `DATABASE_URL` and `DIRECT_URL` are correctly set.
The `DIRECT_URL` (port 5432) is required for migrations.

### CORS Error on Frontend

Check that `FRONTEND_URL` is set to `https://proxima-corrida.vercel.app`

---

## 📈 Performance Notes

- **No cold starts:** Always-on instance (unlike serverless)
- **Region:** Washington DC (closest to Supabase)
- **Free tier:** Adequate for current traffic

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `apps/api/Dockerfile.koyeb` | Docker configuration for Koyeb |
| `apps/api/src/main.ts` | Application entry point |
| `prisma/schema.prisma` | Database schema |
| `DEPLOYMENT.md` | This file |

---

## 🔄 Previous Deployment (Deprecated)

The API was previously deployed to AWS Lambda + API Gateway.
This was deprecated due to unexpected costs.

Lambda-specific files (can be deleted):
- `serverless.yml`
- `src/lambda.ts`
