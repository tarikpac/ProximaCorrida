# Task Breakdown: Security & Integrity Foundation

## Overview
Total Tasks: 4

## Task List

### Backend Security (NestJS)

#### Task Group 1: API Security Foundation
**Dependencies:** None

- [x] 1.0 Implement API Security Features
  - [x] 1.1 Write 2-8 focused tests for Security Features
    - Test that `GlobalExceptionFilter` catches generic errors and returns 500 without stack trace
    - Test that `GlobalExceptionFilter` passes through HTTP exceptions (e.g., 400, 404) correctly
    - Test that `ApiKeyGuard` blocks requests without header
    - Test that `ApiKeyGuard` allows requests with valid header
    - Test that Rate Limiting blocks requests exceeding the limit (mocking time/counter if needed)
  - [x] 1.2 Implement Global Exception Filter
    - Create `apps/api/src/common/filters/http-exception.filter.ts` (or similar)
    - Implement logic to catch all exceptions
    - Log stack trace to console
    - Return safe JSON response
    - Register globally in `main.ts`
  - [x] 1.3 Implement Rate Limiting
    - Install `@nestjs/throttler`
    - Configure `ThrottlerModule` in `app.module.ts` (Limit: 100, TTL: 60s)
    - Ensure headers are sent
  - [x] 1.4 Implement API Key Guard
    - Create `apps/api/src/common/guards/api-key.guard.ts`
    - Implement `CanActivate` to check `x-api-key` header against `INTERNAL_API_KEY` env var
    - Apply to a test route or existing internal route (e.g., Scraper) to verify
  - [x] 1.5 Ensure API Security tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify exception masking, rate limiting, and auth guard work as expected

**Acceptance Criteria:**
- 500 errors do not leak stack traces
- 400/404 errors are passed through correctly
- Requests > 100/min are blocked (429)
- Internal routes require valid API Key

### Frontend Components

#### Task Group 2: Frontend Error Handling
**Dependencies:** None (Parallelizable)

- [x] 2.0 Implement Frontend Error Boundary
  - [x] 2.1 Write 2-8 focused tests for Error Boundary
    - Test that the Error component renders when an error occurs (can use a test route that throws)
    - Test that the "Try Again" button is present
    - Test that the error message is user-friendly
  - [x] 2.2 Create Global Error Page
    - Create `apps/web/app/error.tsx`
    - Implement UI with "Algo deu errado" message
    - Add "Tentar novamente" button (calls `reset()`)
    - Style using Zinc-950 background, White text, Lime-400 button (consistent with design system)
    - Ensure Navbar/Footer are visible (if layout allows) or provide a way back home
  - [x] 2.3 Ensure Frontend tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify error UI renders correctly

**Acceptance Criteria:**
- App does not crash to white screen on render error
- User sees friendly error message and can retry

### Testing

#### Task Group 3: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-2

- [x] 3.0 Review existing tests and fill critical gaps only
  - [x] 3.1 Review tests from Task Groups 1-2
    - Review the tests written in 1.1 (Backend Security)
    - Review the tests written in 2.1 (Frontend Error)
  - [x] 3.2 Analyze test coverage gaps for THIS feature only
    - Focus on integration: Does the frontend handle the API's 500 error gracefully? (Though `error.tsx` handles render errors, API errors usually go to `global-error.tsx` or are handled by QueryClient, but ensuring no crash is key)
  - [x] 3.3 Write up to 10 additional strategic tests maximum
    - Add integration test: Trigger an API 500 and verify frontend doesn't crash (if applicable/testable via E2E)
    - Add test for Rate Limit headers presence
  - [x] 3.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature
    - Verify critical security and stability workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass
- Security features are verified
- Error handling is verified

## Execution Order

Recommended implementation sequence:
1. API Security Foundation (Task Group 1)
2. Frontend Error Handling (Task Group 2)
3. Test Review & Gap Analysis (Task Group 3)
