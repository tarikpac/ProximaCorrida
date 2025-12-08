# Specification: API Migration to AWS Lambda + API Gateway

## Goal

Migrate the NestJS API from Docker/Render hosting to AWS Lambda + API Gateway for serverless, scale-to-zero, pay-per-use architecture, adapting the application for serverless execution while maintaining all existing functionality.

## User Stories

- As a system operator, I want the API to scale to zero when idle so that we only pay for actual usage
- As a developer, I want a simple deployment process so that I can deploy updates with a single command

## Specific Requirements

**Create Lambda Handler Entry Point**
- Create `apps/api/src/lambda.ts` as the serverless entry point
- Use `@vendia/serverless-express` to wrap the NestJS application
- Export a named `handler` function for Lambda invocation
- Bootstrap NestJS app without calling `app.listen()` (Lambda manages HTTP)
- Apply same global pipes (ValidationPipe) and filters (GlobalExceptionFilter) as `main.ts`
- Configure CORS for Vercel frontend origin and API Gateway

**Serverless Framework Configuration**
- Create `apps/api/serverless.yml` for infrastructure definition
- Configure Lambda function with Node 20 runtime
- Set up API Gateway HTTP API (not REST API) for all routes
- Configure memory (start with 512MB) and timeout (30s default)
- Define environment variables via SSM Parameter Store references
- Set region to match Supabase (`sa-east-1`)

**Disable/Remove Continuous Server Dependencies**
- Remove BullMQ queue initialization or make it conditional (skip if no REDIS_URL)
- Remove `ScheduleModule.forRoot()` or make it no-op in Lambda context
- Ensure Prisma connects on-demand without migration on startup
- Remove `npx prisma migrate deploy` from Lambda execution path (run separately)

**Configure AWS SSM Parameters**
- Define parameters in SSM Parameter Store (Standard tier, no cost)
- Required secrets: `DATABASE_URL`, `DIRECT_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Set `NODE_ENV=production` as environment variable
- Do NOT include `REDIS_URL` unless queue functionality is preserved

**Adjust CORS Configuration**
- Update CORS to allow Vercel production URL (instead of `origin: '*'`)
- Ensure preflight OPTIONS requests are handled by API Gateway
- Maintain existing CORS methods: `GET,HEAD,PUT,PATCH,POST,DELETE`

**Update Build Configuration**
- Add npm script for Lambda build: `build:lambda`
- Configure `nest-cli.json` or separate tsconfig for Lambda output
- Ensure Prisma client is generated during build
- Create deployment artifact (zip) with dependencies

**Document Deployment Process**
- Create `apps/api/DEPLOYMENT.md` with step-by-step instructions
- Include SSM parameter creation commands
- Document `sls deploy` command and expected output
- Include rollback procedure and troubleshooting tips

## Visual Design

N/A — Infrastructure migration, no UI components.

## Existing Code to Leverage

**`apps/api/src/main.ts` (Bootstrap Pattern)**
- Current bootstrap function shows NestJS app creation pattern
- Reuse ValidationPipe and GlobalExceptionFilter configuration
- CORS configuration structure can be adapted for Lambda
- Port listening logic will be replaced by Lambda handler export

**`apps/api/src/app.module.ts` (Module Structure)**
- Current BullMQ configuration needs conditional loading
- ConfigModule pattern is compatible with Lambda environment
- ThrottlerModule and guards work unchanged in Lambda
- Module imports order should be preserved

**`apps/api/src/prisma/prisma.service.ts` (Database Connection)**
- PrismaService uses ConfigService for DATABASE_URL — no changes needed
- `onModuleInit()` connects on first use — Lambda-compatible
- Remove debug console.log statements for production

**`apps/api/Dockerfile` (Build Reference)**
- Shows build steps: `npm ci`, `prisma generate`, `npm run build`
- Same steps apply for Lambda packaging
- Playwright/Chromium NOT needed in Lambda (scraper runs on GH Actions)

**`apps/api/src/notifications/notifications.service.ts` (VAPID Configuration)**
- VAPID key loading pattern via ConfigService
- Handle missing keys gracefully (warning, not error)
- This service works unchanged in Lambda context

## Out of Scope

- Custom domain configuration for API Gateway (use default URL)
- CI/CD pipeline automation (manual deploy via `sls deploy` initially)
- Advanced monitoring/alerting (use CloudWatch basic logs)
- Provisioned concurrency (cold starts acceptable for current volume)
- Redis/BullMQ queue functionality in Lambda (notifications should be inline or via separate endpoint)
- Playwright/Chromium in Lambda (scraper runs on GitHub Actions)
- Database migrations in Lambda startup (run separately before deploy)
- Automatic SSL certificate management (API Gateway handles this)
- Multi-environment setup (single production environment initially)
- Load testing or performance optimization
