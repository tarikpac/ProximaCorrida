# Raw Idea: Scraper as External Job (GitHub Actions)

## Source
Product Roadmap Item #16

## Description
Extract scraper from Nest/HTTP to standalone Playwright script that writes directly to Supabase. Use GitHub Actions daily cron as default (zero cost). Configure workflow with secrets (DATABASE_URL, DIRECT_URL, REDIS_URL, VAPID). Trigger notifications inline or via dedicated endpoint. Fallback: Cloud Run Job + Cloud Scheduler if lower latency/controlled region needed.

## Size Estimate
`M` (Medium)

## Context
This is part of a critical infrastructure sequence (items #15-18) that must be executed in order. Item #15 (Scraper Performance Optimizations) has been completed. This item (#16) is the next step before API Migration (#17) and Worker Removal (#18).

## Goals
- Decouple scraper from the main API deployment
- Reduce infrastructure costs (zero cost with GitHub Actions)
- Improve reliability and scheduling control
- Enable independent scraper updates without API redeploy
- Prepare for API-only deployment (no continuous worker)
