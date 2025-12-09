# Task Breakdown: API Migration to Koyeb

## Overview
Total Tasks: 16

## Task List

### Infrastructure Preparation

#### Task Group 1: Code Preparation
**Dependencies:** None

- [ ] 1.0 Prepare API codebase for Koyeb deployment
  - [ ] 1.1 Update `main.ts` CORS configuration
    - Copy production CORS logic from `lambda.ts` (corsOriginHandler function)
    - Whitelist: `proximacorrida.com.br`, `proxima-corrida.vercel.app`, `FRONTEND_URL`
    - Allow Vercel preview deployments (`*.vercel.app`)
    - Keep localhost allowed for development
  - [ ] 1.2 Ensure PORT environment variable usage
    - Verify `main.ts` uses `process.env.PORT` (already does, confirm)
    - Default fallback to 3001 if not set
  - [ ] 1.3 Remove debug console.logs from main.ts
    - Remove `console.log('After dotenv config...')` calls
    - Keep only the startup URL log

**Acceptance Criteria:**
- CORS configuration matches production requirements
- PORT is read from environment variable
- No debug logs in production code

---

#### Task Group 2: Dockerfile Creation
**Dependencies:** Task Group 1

- [ ] 2.0 Create optimized Dockerfile for Koyeb
  - [ ] 2.1 Create new `Dockerfile.koyeb` based on `node:20-alpine`
    - Multi-stage build (builder + production)
    - Builder: `npm ci`, `npx prisma generate`, `npm run build`
    - Production: copy dist, node_modules (production only), prisma
  - [ ] 2.2 Configure Prisma binary targets
    - Ensure `prisma/schema.prisma` has `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` for Alpine
  - [ ] 2.3 Set up container startup command
    - CMD: `npx prisma migrate deploy && node dist/src/main`
    - Expose PORT (use $PORT from Koyeb)
  - [ ] 2.4 Test Docker build locally
    - Run `docker build -f Dockerfile.koyeb -t proximacorrida-api .`
    - Verify image size is under 200MB (vs ~1.5GB with Playwright)

**Acceptance Criteria:**
- Docker image builds successfully
- Image size significantly smaller than current Playwright-based image
- Container starts and runs Prisma migrations

---

### Koyeb Deployment

#### Task Group 3: Koyeb Setup
**Dependencies:** Task Group 2

- [ ] 3.0 Deploy API to Koyeb
  - [ ] 3.1 Create Koyeb account and service
    - Sign up at koyeb.com (GitHub login)
    - Create new App → choose Docker deployment
  - [ ] 3.2 Configure Docker registry (if using pre-built image)
    - Option A: Push image to Docker Hub or GitHub Container Registry
    - Option B: Let Koyeb build from Dockerfile in repo
  - [ ] 3.3 Configure environment variables in Koyeb
    - `DATABASE_URL` = postgresql://...6543/postgres?pgbouncer=true
    - `DIRECT_URL` = postgresql://...5432/postgres
    - `VAPID_PUBLIC_KEY` = (from existing config)
    - `VAPID_PRIVATE_KEY` = (from existing config)
    - `VAPID_SUBJECT` = mailto:contato@proximacorrida.com.br
    - `FRONTEND_URL` = https://proxima-corrida.vercel.app
    - `NODE_ENV` = production
  - [ ] 3.4 Configure service settings
    - Region: Washington DC (was)
    - Instance: Free tier (nano)
    - Port: 3001 (or as detected from PORT)
  - [ ] 3.5 Configure health check
    - Path: `/` or `/health`
    - Protocol: HTTP
    - Interval: 60s
  - [ ] 3.6 Deploy and verify service starts
    - Check Koyeb logs for successful startup
    - Note the generated URL (e.g., `proximacorrida-api-xxx.koyeb.app`)

**Acceptance Criteria:**
- Service deploys without errors
- Health check passes
- API accessible via Koyeb URL

---

### Integration & Verification

#### Task Group 4: Frontend Integration
**Dependencies:** Task Group 3

- [ ] 4.0 Connect frontend to new API
  - [ ] 4.1 Update Vercel environment variable
    - Set `NEXT_PUBLIC_API_URL` = (Koyeb URL from step 3.6)
    - Redeploy Vercel app (or trigger rebuild)
  - [ ] 4.2 Test frontend-to-API connectivity
    - Open https://proxima-corrida.vercel.app
    - Verify events load on homepage
    - Check browser console for CORS errors
  - [ ] 4.3 Test critical API endpoints
    - GET /events - Should return events list
    - GET /events/:id - Should return event details
    - POST /subscriptions - Test push notification subscription
    - POST /organizer/submit - Test organizer form

**Acceptance Criteria:**
- Frontend loads events from new API
- No CORS errors in browser console
- All critical endpoints respond correctly

---

### Documentation & Cleanup

#### Task Group 5: Documentation Update
**Dependencies:** Task Group 4

- [ ] 5.0 Update project documentation
  - [ ] 5.1 Replace `apps/api/DEPLOYMENT.md` with Koyeb guide
    - Remove AWS Lambda/SSM instructions
    - Add Koyeb deployment steps
    - Document environment variables
    - Add troubleshooting section
  - [ ] 5.2 Update `agent-os/product/tech-stack.md`
    - Replace Lambda references with Koyeb
    - Update architecture diagram
    - Update URL to Koyeb
  - [ ] 5.3 Optional: Remove Lambda-specific files
    - Delete `serverless.yml` (or move to archive)
    - Delete `src/lambda.ts` (after confirming CORS is in main.ts)
    - Remove `@vendia/serverless-express` from dependencies
    - Remove `@types/aws-lambda` from devDependencies

**Acceptance Criteria:**
- DEPLOYMENT.md has Koyeb-specific instructions
- tech-stack.md reflects current architecture
- Lambda files cleaned up (optional)

---

## Execution Order

Recommended implementation sequence:
1. **Code Preparation** (Task Group 1) - Update main.ts CORS
2. **Dockerfile Creation** (Task Group 2) - Create optimized Dockerfile
3. **Koyeb Setup** (Task Group 3) - Deploy to Koyeb
4. **Frontend Integration** (Task Group 4) - Connect Vercel to new API
5. **Documentation Update** (Task Group 5) - Update docs and cleanup

## Notes

- **No tests required**: This is an infrastructure migration, not a feature implementation
- **Rollback plan**: Keep Lambda deployment available until Koyeb is verified stable
- **DNS**: Custom domain setup is out of scope (use Koyeb default URL initially)
