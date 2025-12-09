# Specification: API Migration to Koyeb

## Goal

Migrate the NestJS API from AWS Lambda to Koyeb's free tier, using Docker deployment, to eliminate hosting costs while maintaining always-on instances without cold starts.

## User Stories

- As a developer, I want the API deployed on Koyeb so that I have zero hosting costs with no cold starts.
- As a user, I want the API to respond quickly so that the app feels responsive.

## Specific Requirements

**Dockerfile Optimization**
- Create new lightweight Dockerfile based on `node:20-alpine` (not Playwright image)
- Use multi-stage build: builder stage for compilation, production stage for runtime
- Copy only production dependencies and compiled `dist/` folder
- Run `npx prisma generate` in builder stage
- Run `npx prisma migrate deploy` on container startup (CMD)
- Entry point: `node dist/src/main.js`
- Expose port from `$PORT` environment variable (Koyeb sets this dynamically)

**CORS Configuration Update**
- Update `main.ts` to use production-ready CORS from `lambda.ts`
- Whitelist: `proximacorrida.com.br`, `proxima-corrida.vercel.app`, `FRONTEND_URL` env var
- Allow Vercel preview deployments (`*.vercel.app`)
- Keep permissive for localhost in development

**Environment Variables Setup**
- `DATABASE_URL` - Supabase pooled connection (port 6543, pgbouncer=true)
- `DIRECT_URL` - Supabase direct connection (port 5432)
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` - For push notifications
- `VAPID_SUBJECT` - mailto:contato@proximacorrida.com.br
- `FRONTEND_URL` - https://proxima-corrida.vercel.app
- `NODE_ENV` - production
- `PORT` - Koyeb provides this automatically

**Koyeb Service Configuration**
- Region: Washington DC (closest to Supabase sa-east-1)
- Deploy method: Docker (from registry or build)
- Instance type: Free tier (nano)
- Health check: GET / or GET /health
- Auto-deploy: Optional (can configure later for CI/CD)

**Frontend Update**
- Update `NEXT_PUBLIC_API_URL` in Vercel to new Koyeb URL
- No other frontend changes required

**Documentation Update**
- Replace `apps/api/DEPLOYMENT.md` with Koyeb-specific guide
- Update `agent-os/product/tech-stack.md` with new architecture diagram
- Remove references to Lambda/serverless in tech stack

**Cleanup Optional Files**
- `serverless.yml` - Lambda-specific, can be deleted
- `lambda.ts` - Lambda-specific entry point (keep CORS logic, apply to main.ts)
- `@vendia/serverless-express` - Remove from dependencies

## Visual Design

No visual assets required - infrastructure task.

## Existing Code to Leverage

**`apps/api/src/main.ts`**
- Current entry point, use as base
- Needs CORS update from lambda.ts
- Already uses `process.env.PORT` with fallback
- Already has GlobalExceptionFilter and ValidationPipe

**`apps/api/src/lambda.ts` (CORS logic only)**
- Production-ready CORS configuration with whitelist
- Copy corsOriginHandler function to main.ts
- Then delete lambda.ts file

**`apps/api/Dockerfile` (structure only)**
- Multi-stage build pattern is correct
- Replace base images (remove Playwright)
- Keep prisma generate and migrate commands

**`apps/api/package.json`**
- `start:prod` script already configured: `node dist/src/main`
- Dependencies list for production build

## Out of Scope

- New features or API endpoints
- Code refactoring beyond CORS update
- Redis/BullMQ reintroduction
- Scraper modifications (runs on GitHub Actions)
- CI/CD pipeline automation (manual deploy first)
- Custom domain setup (use Koyeb default URL initially)
- Monitoring/alerting setup
- Performance optimizations beyond basic config
- Database migrations or schema changes
- Frontend code changes (only Vercel env var)
