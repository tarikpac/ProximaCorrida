/**
 * ProximaCorrida Multi-Provider Scraper
 * Main Entry Point
 * 
 * This script runs as a GitHub Actions cron job and:
 * 1. Orchestrates multiple provider scrapers (or legacy-only mode)
 * 2. Deduplicates events across providers
 * 3. Upserts events directly to Supabase/Postgres
 * 4. Triggers push notifications for new events
 * 
 * CLI Arguments:
 *   --state=XX,YY    Filter by state(s)
 *   --provider=NAME  Run only specific provider
 *   --skip-legacy    Skip legacy corridasemaratonas provider
 *   --legacy-only    Use legacy mode (bypass orchestrator)
 */

import { chromium } from 'playwright';
import { loadConfig, logConfigSummary, ScraperConfig } from './config';
import { initDatabase, disconnectDatabase, upsertEvent } from './db';
import { triggerNotification, NotificationPayload } from './notifications';
import { ProviderScraperOptions } from './interfaces';
import { orchestrateProviders, parseOrchestratorArgs, OrchestratorResult } from './orchestrator';

interface JobSummary {
    mode: 'orchestrator' | 'legacy';
    totalProviders: number;
    totalEventsScraped: number;
    duplicatesRemoved: number;
    totalNew: number;
    totalUpdated: number;
    totalErrors: number;
    notificationsSent: number;
    notificationsFailed: number;
    durationMs: number;
}

function log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

async function main(): Promise<void> {
    const startTime = Date.now();
    log('=== ProximaCorrida Multi-Provider Scraper Started ===');

    // Parse CLI arguments
    const cliArgs = parseOrchestratorArgs(process.argv);
    const legacyOnly = process.argv.includes('--legacy-only');

    log(`Mode: ${legacyOnly ? 'legacy' : 'orchestrator'}`);
    if (cliArgs.stateFilter) {
        log(`State filter: ${cliArgs.stateFilter.join(', ')}`);
    }
    if (cliArgs.providerFilter) {
        log(`Provider filter: ${cliArgs.providerFilter}`);
    }
    if (cliArgs.skipLegacy) {
        log('Skip legacy: enabled');
    }

    // Load configuration
    let config: ScraperConfig;
    try {
        config = loadConfig();
        logConfigSummary(config);
    } catch (error) {
        console.error(`Configuration error: ${(error as Error).message}`);
        process.exit(1);
    }

    // Initialize database
    log('Initializing database connection...');
    initDatabase();

    // Launch browser
    log('Launching Playwright browser...');
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
        ],
    });

    const context = await browser.newContext({
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        extraHTTPHeaders: {
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            Referer: 'https://www.google.com/',
        },
    });

    // Prepare orchestrator options
    const options: ProviderScraperOptions = {
        detailTimeoutMs: config.detailTimeoutMs,
        regTimeoutMs: config.regTimeoutMs,
        eventDelayMs: config.eventDelayMs,
        stalenessDays: config.stalenessDays,
        shouldLogDebug: config.shouldLogDebug,
        providerName: cliArgs.providerFilter,
        skipLegacy: cliArgs.skipLegacy,
        stateFilter: cliArgs.stateFilter,
    };

    // Summary counters
    const summary: JobSummary = {
        mode: legacyOnly ? 'legacy' : 'orchestrator',
        totalProviders: 0,
        totalEventsScraped: 0,
        duplicatesRemoved: 0,
        totalNew: 0,
        totalUpdated: 0,
        totalErrors: 0,
        notificationsSent: 0,
        notificationsFailed: 0,
        durationMs: 0,
    };

    try {
        // Run orchestrator
        log('\n=== Running Provider Orchestrator ===');
        const orchestratorResult = await orchestrateProviders(context, options);

        summary.totalProviders = orchestratorResult.summary.totalProviders;
        summary.totalEventsScraped = orchestratorResult.summary.totalEventsBeforeDedup;
        summary.duplicatesRemoved = orchestratorResult.summary.duplicatesRemoved;
        summary.totalErrors = orchestratorResult.providerResults
            .reduce((sum, r) => sum + r.result.stats.errors, 0);

        // Upsert events and collect new ones for notification
        log('\n=== Upserting Events to Database ===');
        const newEvents: NotificationPayload[] = [];

        for (const event of orchestratorResult.events) {
            try {
                const result = await upsertEvent(event);
                if (result.isNew) {
                    summary.totalNew++;
                    newEvents.push({
                        eventId: result.eventId,
                        eventTitle: event.title,
                        eventState: event.state ?? 'BR',
                    });
                } else {
                    summary.totalUpdated++;
                }
            } catch (err) {
                log(`Failed to upsert event ${event.title}: ${(err as Error).message}`);
                summary.totalErrors++;
            }
        }

        log(`Upserted ${orchestratorResult.events.length} events (${summary.totalNew} new, ${summary.totalUpdated} updated)`);

        // Trigger notifications for new events
        if (newEvents.length > 0) {
            log('\n=== Sending Notifications ===');
            for (const payload of newEvents) {
                const success = await triggerNotification(config.apiBaseUrl, payload);
                if (success) {
                    summary.notificationsSent++;
                } else {
                    summary.notificationsFailed++;
                }
            }
            log(`Notifications: ${summary.notificationsSent} sent, ${summary.notificationsFailed} failed`);
        }

    } catch (error) {
        log(`Orchestrator error: ${(error as Error).message}`);
        summary.totalErrors++;
    }

    // Cleanup
    log('\nClosing browser...');
    await context.close();
    await browser.close();

    log('Disconnecting database...');
    await disconnectDatabase();

    // Final summary
    summary.durationMs = Date.now() - startTime;
    const durationMinutes = (summary.durationMs / 60000).toFixed(2);

    log('\n=== JOB SUMMARY ===');
    log(`Mode: ${summary.mode}`);
    log(`Providers Executed: ${summary.totalProviders}`);
    log(`Events Scraped: ${summary.totalEventsScraped}`);
    log(`Duplicates Removed: ${summary.duplicatesRemoved}`);
    log(`New Events Created: ${summary.totalNew}`);
    log(`Events Updated: ${summary.totalUpdated}`);
    log(`Errors: ${summary.totalErrors}`);
    log(`Notifications Sent: ${summary.notificationsSent}`);
    log(`Notifications Failed: ${summary.notificationsFailed}`);
    log(`Duration: ${durationMinutes} minutes`);
    log('===================');

    // Exit with error if too many errors
    if (summary.totalErrors > 10) {
        log('Too many errors occurred. Exiting with error status.');
        process.exit(1);
    }

    log('=== Scraper Completed Successfully ===');
}

// Run main
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
