# Spec Requirements: Security & Integrity Foundation

## Initial Description
Implement global exception filters to prevent error leakage, set up rate limiting, and secure internal routes to guarantee system stability.

## Requirements Discussion

### First Round Questions

**Q1:** Global Exception Filters (NestJS): Implement global filter to capture exceptions and prevent stack trace leakage?
**Answer:** Yes.
- Create a Global Exception Filter in `apps/api`.
- Capture unhandled errors.
- Log errors (console for now).
- Return safe JSON: `{ "status": 500, "message": "Internal Server Error" }`.
- Never return stack traces to the client.
- Validation errors (class-validator/Zod) should return 400 with friendly messages.
- Goal: Protect internal data and backend structure.

**Q2:** Rate Limiting (@nestjs/throttler): Specific limits?
**Answer:** Start with a simple and safe limit:
- **100 requests / minute per IP**.
- Implementation: `ThrottlerModule.forRoot({ ttl: 60, limit: 100 })`.
- Sufficient for MVP.

**Q3:** Secure Internal Routes: Use simple API Key for internal routes?
**Answer:** Yes.
- Internal routes include: manual scraper trigger, future admin tasks (cache rebuild, sync, manual notifications).
- Implementation: Simple **API Key Guard**.
- Key stored in `.env`: `INTERNAL_API_KEY`.
- Header: `x-api-key`.
- No complex auth (RBAC, OAuth) for now.

**Q4:** Frontend Error Boundary (Next.js): Implement global Error Boundary?
**Answer:** Yes.
- Implement `error.tsx` in App Router.
- Show friendly UI ("Something went wrong", "Try reloading").
- Prevent white screen crashes.
- Log errors to console.
- Goal: Never show ugly errors to the user.

### Existing Code to Reference

**Similar Features Identified:**
- No specific existing security features identified by user, but standard NestJS/Next.js patterns apply.

### Follow-up Questions
None needed. Requirements are clear.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No visual assets provided.

## Requirements Summary

### Functional Requirements
**Backend (`apps/api`):**
1.  **Global Exception Filter:**
    - Catch all exceptions.
    - Mask internal server errors (500) with generic message.
    - Pass through Validation errors (400) and HTTP Exceptions (e.g., 404) with appropriate messages.
    - Log full error details server-side.
2.  **Rate Limiting:**
    - Global limit: 100 requests per minute per IP.
    - Use `@nestjs/throttler`.
3.  **Internal Route Security:**
    - Create `ApiKeyGuard`.
    - Protect specific routes (e.g., scraper triggers) with this guard.
    - Validate against `INTERNAL_API_KEY` env var.
    - Require `x-api-key` header.

**Frontend (`apps/web`):**
1.  **Global Error Boundary:**
    - Create `app/error.tsx`.
    - Display user-friendly error message and "Try Again" button.
    - Ensure layout remains intact (Navbar/Footer visible if possible).

### Reusability Opportunities
- **NestJS:** Use standard `ExceptionFilter`, `ThrottlerGuard`, `CanActivate` interfaces.
- **Next.js:** Use standard `error.tsx` file convention.

### Scope Boundaries
**In Scope:**
- Global Exception Filter (API).
- Rate Limiting (API).
- API Key Guard (API).
- Global Error Page (Web).

**Out of Scope:**
- Advanced logging integration (Sentry, Logtail) - use console for now.
- Complex Auth (OAuth, RBAC).
- Admin Dashboard UI.
- Per-route custom rate limits (stick to global for now).

### Technical Considerations
- **Env Vars:** Need to add `INTERNAL_API_KEY` to `.env`.
- **Dependencies:** Install `@nestjs/throttler` in `apps/api`.
- **Testing:**
    - Test that 500 errors don't leak stack traces.
    - Test that rate limit blocks requests > 100/min.
    - Test that internal routes reject requests without valid API Key.
