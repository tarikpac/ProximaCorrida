/**
 * Debug script for Doity provider
 */

import { chromium } from 'playwright';

async function debugDoity() {
    console.log('=== Debug Doity ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    try {
        const page = await context.newPage();

        // Doity URL for sports events
        const url = 'https://doity.com.br/eventos?category=24771';  // Sports category
        console.log(`Navigating to: ${url}`);
        await page.goto(url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(5000);

        // Get all links and page content
        const pageData = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const allLinks = Array.from(document.querySelectorAll('a')).map(a => ({
                href: (a as HTMLAnchorElement).href,
                text: a.textContent?.trim() || '',
            }));

            // Event card selectors
            const eventCards = document.querySelectorAll('.event-card, .wrapper__event-card, [class*="event"]');

            return {
                bodyText: bodyText.substring(0, 5000),
                allLinksCount: allLinks.length,
                sampleLinks: allLinks.filter(l => l.text.length > 3).slice(0, 25),
                eventCardsCount: eventCards.length,
                title: document.title,
            };
        });

        console.log(`Page title: ${pageData.title}`);
        console.log(`Total links: ${pageData.allLinksCount}`);
        console.log(`Event cards found: ${pageData.eventCardsCount}`);

        console.log('\nSample links with text:');
        pageData.sampleLinks.forEach((l, i) => console.log(`  ${i + 1}. "${l.text.substring(0, 40)}" -> ${l.href.substring(0, 70)}`));

        console.log('\n\nBody text (first 4000 chars):');
        console.log('='.repeat(60));
        console.log(pageData.bodyText.substring(0, 4000));
        console.log('='.repeat(60));

        // Try to visit first event
        const eventLink = pageData.sampleLinks.find(l => l.href.includes('doity.com.br/') && !l.href.includes('?'));
        if (eventLink) {
            console.log(`\n\nVisiting event: ${eventLink.href}`);
            await page.goto(eventLink.href, { timeout: 30000 });
            await page.waitForTimeout(3000);

            const eventData = await page.evaluate(() => ({
                bodyText: document.body.innerText.substring(0, 3000),
                h1: document.querySelector('h1')?.textContent?.trim() || '',
            }));

            console.log(`\nEvent title: ${eventData.h1}`);
            console.log('\nEvent body (first 2000 chars):');
            console.log('='.repeat(60));
            console.log(eventData.bodyText.substring(0, 2000));
            console.log('='.repeat(60));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

debugDoity();
