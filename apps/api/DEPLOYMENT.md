# AWS Lambda Deployment Guide

## 📋 Overview

This guide covers deploying the ProximaCorrida API to AWS Lambda + API Gateway.

**Production URL:** `https://7smmzptkgk.execute-api.sa-east-1.amazonaws.com/`

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Vercel         │────▶│  API Gateway     │────▶│  Lambda      │
│  Frontend       │     │  (HTTP API)      │     │  (NestJS)    │
└─────────────────┘     └──────────────────┘     └──────┬───────┘
                                                        │
                        ┌──────────────────┐           │
                        │  Supabase        │◀──────────┘
                        │  (PostgreSQL)    │
                        └──────────────────┘
```

---

## 📝 Prerequisites

1. **AWS CLI** configured with credentials
   ```powershell
   aws configure
   ```

2. **Node.js 20+** installed

3. **SSM Parameters** created (see below)

---

## 🔐 SSM Parameters Setup

Create these parameters in AWS Systems Manager Parameter Store:

```powershell
# Database URL (SecureString)
aws ssm put-parameter `
  --name "/proximacorrida/prod/DATABASE_URL" `
  --type "SecureString" `
  --value "postgresql://user:pass@host:5432/db?pgbouncer=true" `
  --region sa-east-1

# Direct Database URL (SecureString)
aws ssm put-parameter `
  --name "/proximacorrida/prod/DIRECT_URL" `
  --type "SecureString" `
  --value "postgresql://user:pass@host:5432/db" `
  --region sa-east-1

# VAPID Keys (SecureString)
aws ssm put-parameter `
  --name "/proximacorrida/prod/VAPID_PUBLIC_KEY" `
  --type "SecureString" `
  --value "YOUR_VAPID_PUBLIC_KEY" `
  --region sa-east-1

aws ssm put-parameter `
  --name "/proximacorrida/prod/VAPID_PRIVATE_KEY" `
  --type "SecureString" `
  --value "YOUR_VAPID_PRIVATE_KEY" `
  --region sa-east-1

# Optional: VAPID Subject
aws ssm put-parameter `
  --name "/proximacorrida/prod/VAPID_SUBJECT" `
  --type "String" `
  --value "mailto:contato@proximacorrida.com.br" `
  --region sa-east-1

# Optional: Frontend URL
aws ssm put-parameter `
  --name "/proximacorrida/prod/FRONTEND_URL" `
  --type "String" `
  --value "https://proxima-corrida.vercel.app" `
  --region sa-east-1
```

---

## 🚀 Deployment

### Quick Deploy

```powershell
cd apps/api

# Clean install (production only)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install --omit=dev --legacy-peer-deps

# Generate Prisma Client
npx prisma generate

# Remove Windows binary (only need Linux)
Remove-Item "node_modules/.prisma/client/query_engine-windows.dll.node" -Force -ErrorAction SilentlyContinue

# Install dev deps for build
npm install --save-dev @types/express @types/aws-lambda typescript @nestjs/cli serverless@3 --legacy-peer-deps

# Build and Deploy
npx nest build
npx serverless deploy --stage prod
```

### Check Deployment Status

```powershell
npx serverless info --stage prod
```

---

## ✅ Verify Deployment

```powershell
# Test root endpoint
Invoke-RestMethod -Uri "https://7smmzptkgk.execute-api.sa-east-1.amazonaws.com/"
# Expected: "Hello World!"

# Test events endpoint
Invoke-RestMethod -Uri "https://7smmzptkgk.execute-api.sa-east-1.amazonaws.com/events?limit=2"
# Expected: JSON with events data
```

---

## 📊 View Logs

```powershell
# Real-time logs
npx serverless logs -f api --stage prod --tail

# Last 5 minutes
npx serverless logs -f api --stage prod --startTime 5m
```

---

## ↩️ Rollback

```powershell
# List deployments
npx serverless deploy list --stage prod

# Rollback to previous version
npx serverless rollback --timestamp <timestamp> --stage prod
```

---

## 🗑️ Remove Stack

```powershell
npx serverless remove --stage prod
```

---

## 🔧 Troubleshooting

### Error: "Unzipped size must be smaller than 262144000 bytes"

Package too large. Solutions:
1. Install only production deps: `npm install --omit=dev`
2. Remove Windows Prisma binary: `Remove-Item "node_modules/.prisma/client/query_engine-windows.dll.node"`
3. Target package size: < 200MB

### Error: "Cannot find module 'bullmq'"

BullMQ was removed. Make sure code doesn't import it.

### Error: "Prisma Client could not locate the Query Engine"

Add Linux target in `prisma/schema.prisma`:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

Then run `npx prisma generate`.

### CORS Error on Frontend

Check that frontend URL is in the allowed origins in `lambda.ts` or set via `FRONTEND_URL` SSM parameter.

---

## 📈 Performance Notes

- **Cold Start:** ~1.2s (first request after idle)
- **Warm Requests:** < 100ms
- **Memory:** 512MB configured
- **Timeout:** 30s

For high-traffic scenarios, consider:
- Provisioned Concurrency
- Increasing memory (also increases CPU)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/lambda.ts` | Lambda handler entry point |
| `serverless.yml` | Infrastructure as Code |
| `prisma/schema.prisma` | Database schema + binary targets |
| `DEPLOYMENT.md` | This file |

---

## 🔄 CI/CD (Future)

For automated deployments, create `.github/workflows/deploy-api.yml`:

```yaml
name: Deploy API to Lambda

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install Dependencies
        run: |
          cd apps/api
          npm install --omit=dev --legacy-peer-deps
          npx prisma generate
      - name: Deploy
        run: |
          cd apps/api
          npm install --save-dev serverless@3
          npx sls deploy --stage prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```
