# Specification: Security & Integrity Foundation

## Goal
Implement a robust security foundation for the API and Frontend to prevent error leakage, protect against abuse via rate limiting, and secure internal administrative routes, ensuring system stability and data protection.

## User Stories
- As a **Developer**, I want **unhandled exceptions to be caught globally** so that sensitive stack traces are never leaked to the client.
- As a **System Administrator**, I want **rate limiting enforced** so that the API is protected from abuse and denial-of-service attempts.
- As a **System Administrator**, I want **internal routes secured with an API Key** so that unauthorized users cannot trigger sensitive operations like scraping.
- As a **User**, I want to **see a friendly error page** instead of a crash if the application encounters a rendering error.

## Specific Requirements

**Global Exception Filter (NestJS)**
- Create a `GlobalExceptionFilter` implementing `ExceptionFilter`.
- **Catch:** All exceptions (`@Catch()`).
- **Logic:**
    - If `HttpException`: Return status and message from the exception (e.g., 404, 400).
    - If `InternalServerError` (or unknown): Return 500 and generic message "Internal Server Error".
    - **Log:** Log the full error stack trace to the console (server-side only).
    - **Response:** Ensure JSON format `{ statusCode, message, timestamp, path }`.

**Rate Limiting (NestJS)**
- Install and configure `@nestjs/throttler`.
- **Global Limit:** 100 requests per minute (TTL: 60s, Limit: 100).
- **Storage:** In-memory storage is sufficient for MVP.
- **Headers:** Ensure standard rate limit headers are sent (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).

**Internal Route Security (NestJS)**
- Create an `ApiKeyGuard` implementing `CanActivate`.
- **Validation:** Check for `x-api-key` header matching `INTERNAL_API_KEY` from environment variables.
- **Rejection:** Return 401 Unauthorized if key is missing or invalid.
- **Application:** Apply this guard to sensitive controllers/routes (e.g., ScraperController if exposed via HTTP).

**Frontend Error Boundary (Next.js)**
- Create `apps/web/app/error.tsx` (Global Error UI).
- **UI:** Display a user-friendly message "Algo deu errado" and a "Tentar novamente" button.
- **Functionality:** Log the error to console.
- **Layout:** Maintain the root layout (Navbar/Footer) if possible so the user isn't stranded.

## Visual Design
No visual assets provided.
- **Error Page:** Simple, clean design using existing UI components (Zinc-950 background, White text, Lime-400 button).

## Existing Code to Leverage
No specific existing security code found. Standard NestJS/Next.js patterns will be used.

**`apps/api/src/main.ts`**
- Will need to register the Global Exception Filter here.

**`apps/api/src/app.module.ts`**
- Will need to import `ThrottlerModule` here.

## Out of Scope
- **Advanced Logging:** Integration with external services (Sentry, Datadog) is out of scope.
- **Complex Auth:** OAuth, JWT, or RBAC are out of scope for internal routes.
- **Per-Route Rate Limits:** Custom limits for specific routes are out of scope for this MVP.
- **Admin Dashboard:** No UI for admin tasks; API-only access via Postman/Curl.
