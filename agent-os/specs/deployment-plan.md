# Deployment Strategy: Proxima Corrida (Free Tier)

This document outlines the strategy to deploy the Proxima Corrida application using exclusively free tier services.

## Architecture Overview

| Component | Technology | Hosting Service | Plan |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js (React) | **Vercel** | Hobby (Free) |
| **Backend API** | NestJS (Node.js) | **Render** | Free (Web Service) |
| **Database** | PostgreSQL | **Supabase** | Free (500MB) |
| **Queue/Cache** | Redis | **Upstash** | Free (10k req/day) |
| **Scraper** | Playwright | **GitHub Actions** | Free (2000 min/mo) |

## Environment Context

It is crucial to understand the distinction between the environments we are working with:

1.  **Local Environment (Development)**:
    *   **Where**: Your local machine (`c:\proximacorrida`).
    *   **Role**: Writing code, running unit tests (`npm run test`), debugging, and preparing features.
    *   **Action**: Changes here must be committed (`git commit`) and pushed (`git push`) to effect changes elsewhere.

2.  **GitHub (CI/CD)**:
    *   **Where**: The `ProximaCorrida` repository.
    *   **Role**:
        *   Stores the source code.
        *   **Orchestrator**: Runs **GitHub Actions** workflows (like `scraper.yml`).
        *   **Trigger**: Updates here trigger deployments to Render.

3.  **Production Environment**:
    *   **Where**: `Render` (API) and `Vercel` (Web).
    *   **Role**: The live application accessible to users (e.g., `proximacorrida.onrender.com`).
    *   **State**: This environment reflects the code currently on the `main` branch of GitHub.

**Current Workflow Status:**
We are currently editing files in **Local Development**. To apply these fixes to **Production**, we must push them to **GitHub**.

---

## Detailed Strategy

### 1. Database (Supabase)
*   **Status:** Already configured.
*   **Action:** Ensure the production database is set up in the Supabase dashboard.
*   **Connection:** Get the `DATABASE_URL` (Transaction Pooler) for the API and `DIRECT_URL` (Session Pooler) for migrations.

### 2. Frontend (Vercel)
*   **Why:** Best-in-class support for Next.js.
*   **Configuration:**
    *   Connect GitHub repository.
    *   Set Root Directory to `apps/web`.
    *   **Environment Variables:**
        *   `NEXT_PUBLIC_API_URL`: URL of the Render API (e.g., `https://proximacorrida.onrender.com`).
*   **Build Command:** `cd ../.. && npm install && npm run build` (Vercel handles monorepos well, but might need specific config).

### 3. Backend API (Render)
*   **Why:** Supports Docker containers natively, allowing us to run the NestJS app without serverless limitations (timeouts).
*   **Limitation:** Free tier spins down after 15 minutes of inactivity. First request takes ~30s to wake up.
*   **Configuration:**
    *   **Type:** Web Service.
    *   **Runtime:** Docker.
    *   **Root Directory:** `.` (Monorepo root).
    *   **Dockerfile:** Need to create a multi-stage Dockerfile in the root or `apps/api` to build the NestJS app.
    *   **Environment Variables:**
        *   `DATABASE_URL`: Supabase URL.
        *   `REDIS_URL`: Upstash URL.
        *   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`: For notifications.
*   **Health Check:** `/` endpoint.

### 4. Redis (Upstash)
*   **Why:** Serverless Redis, perfect for low-volume queues like ours.
*   **Action:** Create a database, get the `REDIS_URL`.

### 5. Scraper (GitHub Actions)
*   **Why:**
    *   Playwright + Chromium is heavy (large binary).
    *   Scraping takes time (minutes), exceeding serverless timeouts.
    *   Render Free tier has limited RAM (512MB), might struggle with Chrome.
    *   GitHub Actions provides a fresh VM with decent specs for free.
*   **Workflow:**
    *   Create `.github/workflows/scraper.yml`.
    *   **Schedule:** `cron: '0 8 * * *'` (Every day at 8 AM).
    *   **Steps:**
        1.  Checkout code.
        2.  Install Node.js.
        3.  Install dependencies (`npm ci`).
        4.  Install Playwright browsers (`npx playwright install chromium`).
        5.  Run Scraper Script: `npx ts-node apps/api/src/scripts/run-scraper-standalone.ts`.
*   **Standalone Script:** We need a script that initializes the `ScraperService` (or similar logic) *without* starting the full NestJS server, or just uses the NestJS context to run the job and exit.

---

## Implementation Steps

1.  **Prepare Dockerfile:** Create a Dockerfile for `apps/api` compatible with Render.
2.  **Prepare Scraper Script:** Create a standalone entry point for the scraper to be run by GitHub Actions.
3.  **GitHub Actions Workflow:** Create the YAML file.
4.  **Environment Setup:** User needs to sign up for Render and Upstash and configure secrets in GitHub.

## Analysis of Tools

*   **Playwright:** Heavy but necessary. Running in GitHub Actions isolates the resource usage.
*   **BullMQ:** Good for decoupling. In this setup, the API (Render) will process *notification* jobs. The Scraper (GitHub Actions) will insert events directly into the DB.
    *   *Refinement:* The Scraper Action can trigger the "New Event" notification logic by calling an API endpoint (securely) or by pushing to Redis directly if possible (but API trigger is safer/easier).

## Recommendation for Next Steps

1.  Create the `Dockerfile` for the API.
2.  Create the `scraper-action` script.
3.  Create the GitHub Actions workflow.
