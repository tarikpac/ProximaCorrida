/**
 * ProximaCorrida Standalone Scraper
 * Main Entry Point
 * 
 * This script runs as a GitHub Actions cron job and:
 * 1. Scrapes all 27 Brazilian states from corridasemaratonas.com.br
 * 2. Upserts events directly to Supabase/Postgres
 * 3. Triggers push notifications for new events
 */

import { chromium } from 'playwright';
import { loadConfig, logConfigSummary, ScraperConfig } from './config';
import { initDatabase, disconnectDatabase, upsertEvent, checkEventsFreshness } from './db';
import { scrapeState, STATE_URLS } from './scraper';
import { triggerNotification, NotificationPayload } from './notifications';
import { ScraperOptions } from './interfaces';

interface JobSummary {
    totalStates: number;
    totalProcessed: number;
    totalSkipped: number;
    totalNew: number;
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
    log('=== ProximaCorrida Scraper Started ===');

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

    // Prepare scraper options
    const scraperOptions: ScraperOptions = {
        detailTimeoutMs: config.detailTimeoutMs,
        regTimeoutMs: config.regTimeoutMs,
        eventDelayMs: config.eventDelayMs,
        stalenessDays: config.stalenessDays,
        shouldLogDebug: config.shouldLogDebug,
    };

    // Summary counters
    const summary: JobSummary = {
        totalStates: STATE_URLS.length,
        totalProcessed: 0,
        totalSkipped: 0,
        totalNew: 0,
        totalErrors: 0,
        notificationsSent: 0,
        notificationsFailed: 0,
        durationMs: 0,
    };

    // Check for single state filter (for testing)
    const stateFilter = process.argv.find((arg) => arg.startsWith('--state='));
    let statesToProcess = STATE_URLS;

    if (stateFilter) {
        const filterValue = stateFilter.split('=')[1];
        statesToProcess = STATE_URLS.filter((s) => s.state === filterValue);
        if (statesToProcess.length === 0) {
            log(`State filter "${filterValue}" matched no states. Available: ${STATE_URLS.map((s) => s.state).join(', ')}`);
            await browser.close();
            await disconnectDatabase();
            process.exit(1);
        }
        log(`Filtering to state: ${filterValue}`);
        summary.totalStates = statesToProcess.length;
    }

    // Process each state
    for (const stateConfig of statesToProcess) {
        log(`\n--- Processing ${stateConfig.state} ---`);

        try {
            // Pre-fetch filter: get fresh URLs for this state
            const rawEvents = await getAllSourceUrlsForState(context, stateConfig.url, scraperOptions.detailTimeoutMs);
            const freshUrls = await checkEventsFreshness(rawEvents, config.stalenessDays);

            if (config.shouldLogDebug) {
                log(`Pre-fetch filter: ${freshUrls.size} fresh events will be skipped`);
            }

            // Scrape the state
            const { events, counters } = await scrapeState(context, stateConfig, scraperOptions, freshUrls);

            summary.totalProcessed += counters.processed;
            summary.totalSkipped += counters.skipped;
            summary.totalErrors += counters.errors;

            // Upsert events and collect new ones for notification
            const newEvents: NotificationPayload[] = [];

            for (const event of events) {
                try {
                    const result = await upsertEvent(event);
                    if (result.isNew) {
                        summary.totalNew++;
                        newEvents.push({
                            eventId: result.eventId,
                            eventTitle: event.title,
                            eventState: event.state ?? 'BR',
                        });
                    }
                } catch (err) {
                    log(`Failed to upsert event ${event.title}: ${(err as Error).message}`);
                    summary.totalErrors++;
                }
            }

            // Trigger notifications for new events
            for (const payload of newEvents) {
                const success = await triggerNotification(config.apiBaseUrl, payload);
                if (success) {
                    summary.notificationsSent++;
                } else {
                    summary.notificationsFailed++;
                }
            }

            log(
                `[${stateConfig.state}] Summary: processed=${counters.processed}, skipped=${counters.skipped}, errors=${counters.errors}, new=${newEvents.length}`
            );
        } catch (error) {
            log(`Failed to process state ${stateConfig.state}: ${(error as Error).message}`);
            summary.totalErrors++;
        }
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
    log(`States Processed: ${summary.totalStates}`);
    log(`Events Processed: ${summary.totalProcessed}`);
    log(`Events Skipped (fresh): ${summary.totalSkipped}`);
    log(`New Events Created: ${summary.totalNew}`);
    log(`Errors: ${summary.totalErrors}`);
    log(`Notifications Sent: ${summary.notificationsSent}`);
    log(`Notifications Failed: ${summary.notificationsFailed}`);
    log(`Duration: ${durationMinutes} minutes`);
    log('===================');

    // Exit with error if too many errors
    if (summary.totalErrors > summary.totalStates * 2) {
        log('Too many errors occurred. Exiting with error status.');
        process.exit(1);
    }

    log('=== Scraper Completed Successfully ===');
}

/**
 * Helper to get all source URLs for pre-fetch filter
 * This is a lightweight scrape just to get URLs
 */
async function getAllSourceUrlsForState(
    context: Awaited<ReturnType<typeof chromium.launch>>['newContext'] extends (...args: any[]) => Promise<infer R> ? R : never,
    stateUrl: string,
    timeoutMs: number
): Promise<string[]> {
    const page = await context.newPage();

    try {
        await page.goto(stateUrl, { timeout: timeoutMs * 2 });

        try {
            await page.waitForSelector('.table-row', { timeout: timeoutMs });
        } catch {
            await page.close();
            return [];
        }

        const urls = await page.$$eval('.table-row', (rows) => {
            return rows
                .map((row) => {
                    const titleLink = row.querySelector('td:nth-child(1) a') as HTMLAnchorElement;
                    return titleLink?.href;
                })
                .filter((url): url is string => !!url && url.startsWith('http') && !url.includes('#N/A'));
        });

        await page.close();
        return urls;
    } catch {
        await page.close();
        return [];
    }
}

// Run main
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
