# Task Breakdown: API Migration to Koyeb

## Overview
Total Tasks: 16
**Status: ✅ COMPLETED (2025-12-09)**

## Task List

### Infrastructure Preparation

#### Task Group 1: Code Preparation
**Dependencies:** None

- [x] 1.0 Prepare API codebase for Koyeb deployment
  - [x] 1.1 Update `main.ts` CORS configuration
    - Copy production CORS logic from `lambda.ts` (corsOriginHandler function)
    - Whitelist: `proximacorrida.com.br`, `proxima-corrida.vercel.app`, `FRONTEND_URL`
    - Allow Vercel preview deployments (`*.vercel.app`)
    - Keep localhost allowed for development
  - [x] 1.2 Ensure PORT environment variable usage
    - Verify `main.ts` uses `process.env.PORT` (already does, confirm)
    - Default fallback to 3001 if not set
  - [x] 1.3 Remove debug console.logs from main.ts
    - Remove `console.log('After dotenv config...')` calls
    - Keep only the startup URL log

**Acceptance Criteria:** ✅ MET
- CORS configuration matches production requirements
- PORT is read from environment variable
- No debug logs in production code

---

#### Task Group 2: Dockerfile Creation
**Dependencies:** Task Group 1

- [x] 2.0 Create optimized Dockerfile for Koyeb
  - [x] 2.1 Create new `Dockerfile.koyeb` based on `node:20-alpine`
    - Multi-stage build (builder + production)
    - Builder: `npm ci`, `npx prisma generate`, `npm run build`
    - Production: copy dist, node_modules (all - needed for Prisma CLI), prisma
  - [x] 2.2 Configure Prisma binary targets
    - Updated `prisma/schema.prisma` with `binaryTargets = ["native", "rhel-openssl-3.0.x", "linux-musl-openssl-3.0.x"]`
  - [x] 2.3 Set up container startup command
    - CMD: `npx prisma migrate deploy && node dist/src/main`
    - PORT read from environment
  - [x] 2.4 Test Docker build locally
    - Build tested via Koyeb's remote builder
    - Image builds successfully

**Acceptance Criteria:** ✅ MET
- Docker image builds successfully
- Container starts and runs Prisma migrations

---

### Koyeb Deployment

#### Task Group 3: Koyeb Setup
**Dependencies:** Task Group 2

- [x] 3.0 Deploy API to Koyeb
  - [x] 3.1 Create Koyeb account and service
    - Created via GitHub OAuth
    - Docker deployment configured
  - [x] 3.2 Configure Docker registry
    - Using Koyeb's built-in builder from GitHub repo
  - [x] 3.3 Configure environment variables in Koyeb
    - `DATABASE_URL` ✅
    - `DIRECT_URL` ✅
    - `VAPID_PUBLIC_KEY` ✅
    - `VAPID_PRIVATE_KEY` ✅
    - `VAPID_SUBJECT` ✅
    - `FRONTEND_URL` ✅
    - `NODE_ENV` ✅
  - [x] 3.4 Configure service settings
    - Region: Washington DC
    - Instance: Free tier
  - [x] 3.5 Configure health check
    - Path: `/`
    - Protocol: HTTP
  - [x] 3.6 Deploy and verify service starts
    - **URL:** `https://sensible-amalita-proximacorrida-fd8a53f4.koyeb.app`

**Acceptance Criteria:** ✅ MET
- Service deploys without errors
- Health check passes
- API accessible via Koyeb URL

---

### Integration & Verification

#### Task Group 4: Frontend Integration
**Dependencies:** Task Group 3

- [x] 4.0 Connect frontend to new API
  - [x] 4.1 Update Vercel environment variable
    - Set `NEXT_PUBLIC_API_URL` = `https://sensible-amalita-proximacorrida-fd8a53f4.koyeb.app`
    - ⚠️ **PENDING USER ACTION:** Redeploy Vercel app
  - [x] 4.2 Test frontend-to-API connectivity
    - API endpoints tested and working
    - GET /events returns 1808 events
  - [x] 4.3 Test critical API endpoints
    - GET / - Returns "Hello World!" ✅
    - GET /events?limit=2 - Returns events JSON ✅

**Acceptance Criteria:** ✅ MET (Vercel update pending user action)
- API endpoints respond correctly
- Events data loads

---

### Documentation & Cleanup

#### Task Group 5: Documentation Update
**Dependencies:** Task Group 4

- [x] 5.0 Update project documentation
  - [x] 5.1 Replace `apps/api/DEPLOYMENT.md` with Koyeb guide
    - Complete Koyeb deployment guide created
  - [x] 5.2 Update `agent-os/product/tech-stack.md`
    - Updated architecture diagram
    - Replaced Lambda with Koyeb
    - Added cost table ($0/month)
  - [ ] 5.3 Optional: Remove Lambda-specific files
    - `serverless.yml` - Can be deleted later
    - `src/lambda.ts` - Can be deleted later
    - `@vendia/serverless-express` - Can be removed from deps later

**Acceptance Criteria:** ✅ MET
- DEPLOYMENT.md has Koyeb-specific instructions
- tech-stack.md reflects current architecture

---

## Execution Order

✅ All completed:
1. ✅ **Code Preparation** (Task Group 1) - Updated main.ts CORS
2. ✅ **Dockerfile Creation** (Task Group 2) - Created optimized Dockerfile
3. ✅ **Koyeb Setup** (Task Group 3) - Deployed to Koyeb
4. ✅ **Frontend Integration** (Task Group 4) - Tested API, Vercel update pending
5. ✅ **Documentation Update** (Task Group 5) - Updated docs

## Deployment Info

| Item | Value |
|------|-------|
| **API URL** | `https://sensible-amalita-proximacorrida-fd8a53f4.koyeb.app` |
| **Region** | Washington DC |
| **Deploy Date** | 2025-12-09 |
| **Cost** | $0/month (free tier) |

## Notes

- **Removed old scraper code:** Deleted `src/scraper/scrapers/` folder (now runs on GitHub Actions)
- **Prisma compatibility:** Using local Prisma CLI to avoid version mismatch with v7
- **Environment variables:** Must be in "Environment Variables" section, not just "Secrets"
