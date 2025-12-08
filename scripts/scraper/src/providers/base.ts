/**
 * Base Provider Utilities
 * Common utilities and helpers for all provider implementations
 */

import { Page, BrowserContext } from 'playwright';
import { StandardizedEvent, ProviderScrapeResult } from '../interfaces';
import { extractPriceWithHeuristics } from '../utils/price-extraction';

/**
 * Logging utility for providers
 */
export function providerLog(
    providerName: string,
    message: string,
    level: 'info' | 'debug' | 'warn' | 'error' = 'info'
): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${providerName.toUpperCase()}] [${level.toUpperCase()}]`;

    if (level === 'error') {
        console.error(`${prefix} ${message}`);
    } else if (level === 'warn') {
        console.warn(`${prefix} ${message}`);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

/**
 * Create an empty scrape result
 */
export function emptyResult(): ProviderScrapeResult {
    return {
        events: [],
        stats: {
            processed: 0,
            skipped: 0,
            errors: 0,
        },
    };
}

/**
 * Merge multiple scrape results into one
 */
export function mergeResults(results: ProviderScrapeResult[]): ProviderScrapeResult {
    return results.reduce(
        (acc, result) => ({
            events: [...acc.events, ...result.events],
            stats: {
                processed: acc.stats.processed + result.stats.processed,
                skipped: acc.stats.skipped + result.stats.skipped,
                errors: acc.stats.errors + result.stats.errors,
            },
        }),
        emptyResult()
    );
}

/**
 * Safe navigation to a URL with error handling
 */
export async function safeNavigate(
    page: Page,
    url: string,
    timeoutMs: number
): Promise<boolean> {
    try {
        await page.goto(url, {
            timeout: timeoutMs,
            waitUntil: 'domcontentloaded',
        });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Extract image URL from page using common patterns
 */
export async function extractImageUrl(page: Page): Promise<string | null> {
    return page.evaluate(() => {
        // Try og:image first
        const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
        if (ogImage?.content) {
            return ogImage.content;
        }

        // Try twitter:image
        const twitterImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
        if (twitterImage?.content) {
            return twitterImage.content;
        }

        // Try banner images by keywords
        const bannerKeywords = ['banner', 'cartaz', 'poster', 'capa', 'hero', 'event', 'cover'];
        const images = Array.from(document.querySelectorAll('img'));

        for (const img of images) {
            const srcText = [img.src, img.alt, img.className].join(' ').toLowerCase();
            if (bannerKeywords.some((k) => srcText.includes(k))) {
                return img.src;
            }
        }

        // Fallback to largest image
        const validImages = images.filter((img) => img.naturalWidth >= 300);
        if (validImages.length > 0) {
            validImages.sort((a, b) => b.naturalWidth - a.naturalWidth);
            return validImages[0].src;
        }

        return null;
    });
}

/**
 * Extract price from page text
 */
export async function extractPrice(page: Page): Promise<{ priceText: string | null; priceMin: number | null }> {
    const pageText = await page.evaluate(() => document.body?.innerText || '');
    return extractPriceWithHeuristics(pageText);
}

/**
 * Parse Brazilian date string (DD/MM/YYYY) to Date object
 */
export function parseBrazilianDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    // Try ISO format
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
        return isoDate;
    }

    return null;
}

/**
 * Create a slugified version of text for IDs
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a new page from context with common settings
 */
export async function createProviderPage(context: BrowserContext): Promise<Page> {
    const page = await context.newPage();
    return page;
}

/**
 * Safely close a page
 */
export async function closePage(page: Page): Promise<void> {
    try {
        await page.close();
    } catch {
        // Ignore close errors
    }
}
