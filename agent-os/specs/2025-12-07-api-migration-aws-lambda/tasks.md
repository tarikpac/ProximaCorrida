# Task Breakdown: API Migration to AWS Lambda + API Gateway

## Overview
Total Tasks: 21
**Status: ✅ COMPLETED** (2025-12-08)

## Task List

### NestJS Serverless Adaptation

#### Task Group 1: Lambda Handler & Dependencies
**Dependencies:** None
**Status:** ✅ Completed

- [x] 1.0 Complete Lambda handler setup
  - [x] 1.1 Write 4 focused tests for Lambda handler
  - [x] 1.2 Install `@vendia/serverless-express` package
  - [x] 1.3 Create `apps/api/src/lambda.ts` handler file
  - [x] 1.4 Configure CORS for Lambda environment
  - [x] 1.5 Ensure Lambda handler tests pass

---

#### Task Group 2: Conditional Dependencies (BullMQ/Schedule)
**Dependencies:** Task Group 1
**Status:** ✅ Completed

- [x] 2.0 Make continuous-server dependencies conditional
  - [x] 2.1 Write 3 focused tests for conditional loading
  - [x] 2.2 Modify `app.module.ts` to conditionally load BullMQ
  - [x] 2.3 Disable ScheduleModule in Lambda context
  - [x] 2.4 Remove debug console.log from PrismaService
  - [x] 2.5 Ensure conditional loading tests pass

**NOTE:** BullMQ was completely removed (not just conditional) for package size optimization.
Push notifications are now sent inline. Scraper runs on GitHub Actions.

---

### Serverless Framework Configuration

#### Task Group 3: Infrastructure as Code
**Dependencies:** Task Group 2
**Status:** ✅ Completed

- [x] 3.0 Complete Serverless Framework setup
  - [x] 3.1 Install Serverless Framework dependencies
  - [x] 3.2 Create `apps/api/serverless.yml`
  - [x] 3.3 Configure Lambda function in serverless.yml
  - [x] 3.4 Configure environment variables from SSM
  - [x] 3.5 Verify serverless.yml syntax

---

### Build & Package

#### Task Group 4: Lambda Build Configuration
**Dependencies:** Task Group 3
**Status:** ✅ Completed

- [x] 4.0 Complete Lambda build setup
  - [x] 4.1 Add `build:lambda` npm script
  - [x] 4.2 Configure Serverless packaging
  - [x] 4.3 Test local Lambda build
  - [x] 4.4 Test Serverless package (dry run)

**Final Package Size:** ~107 MB (well under 250MB limit)

---

### AWS Configuration

#### Task Group 5: SSM Parameters & Deployment
**Dependencies:** Task Group 4
**Status:** ✅ Completed

- [x] 5.0 Complete AWS setup and deployment
  - [x] 5.1 Create SSM Parameters in AWS
  - [x] 5.2 Create `apps/api/DEPLOYMENT.md` documentation
  - [x] 5.3 Deploy to AWS
  - [x] 5.4 Verify deployment

**Deployed URL:** `https://7smmzptkgk.execute-api.sa-east-1.amazonaws.com/`

---

### Integration & Verification

#### Task Group 6: Frontend Integration & Final Testing
**Dependencies:** Task Group 5
**Status:** ✅ Completed

- [x] 6.0 Complete integration and verification
  - [x] 6.1 Update Vercel frontend environment
    - Updated `NEXT_PUBLIC_API_URL` to Lambda API Gateway URL
    - Redeployed frontend
  - [x] 6.2 End-to-end smoke tests
    - Homepage loads events from Lambda API ✅
    - Event listing with 1580+ events ✅
    - CORS working correctly ✅
  - [x] 6.3 Verify push notifications work (inline, no queue)
  - [x] 6.4 Performance check
    - Cold start: ~1.2s (excellent!)
    - Warm requests: fast
  - [x] 6.5 Final cleanup
    - BullMQ removed completely
    - Playwright/scraper removed from API (runs on GH Actions)

---

## Execution Summary

| Task Group | Status | Notes |
|------------|--------|-------|
| 1. Lambda Handler | ✅ | Using @vendia/serverless-express |
| 2. Conditional Deps | ✅ | BullMQ removed entirely |
| 3. Serverless Config | ✅ | serverless.yml with SSM |
| 4. Build Config | ✅ | 107MB package size |
| 5. AWS Deployment | ✅ | sa-east-1 region |
| 6. Integration | ✅ | Frontend connected |

## Architecture Changes Made

1. **BullMQ Removed** - Push notifications now inline (sync) instead of queued
2. **Playwright Removed** - Scraper runs on GitHub Actions standalone
3. **Prisma binaryTargets** - Added `rhel-openssl-3.0.x` for Lambda Linux
4. **CORS Dynamic** - Accepts any `*.vercel.app` origin
5. **ScheduleModule** - Disabled in Lambda mode

## Notes

- **No database migrations**: Migrations run separately via `npx prisma migrate deploy`
- **No Playwright in Lambda**: Scraper runs on GitHub Actions
- **Manual deployment**: Run `npx sls deploy --stage prod`
- **Cold starts**: ~1.2s (acceptable for current volume)
- **Future scaling**: If notifications increase, consider AWS SQS + Lambda
