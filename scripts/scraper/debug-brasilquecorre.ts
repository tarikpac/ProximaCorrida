/**
 * Debug script for BrasilQueCorre
 */

import { chromium } from 'playwright';

async function debugBrasilQueCorre() {
    console.log('=== Debug BrasilQueCorre ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    try {
        const page = await context.newPage();

        // Test with Paraiba first
        const url = 'https://brasilquecorre.com/paraiba';
        console.log(`Navigating to: ${url}`);
        await page.goto(url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(5000);

        // Get page content
        const pageData = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const allLinks = Array.from(document.querySelectorAll('a')).map(a => ({
                href: (a as HTMLAnchorElement).href,
                text: a.textContent?.trim() || '',
            }));

            // Event card selectors
            const eventCards = document.querySelectorAll('[class*="event"], [class*="card"], article');

            return {
                bodyText: bodyText.substring(0, 6000),
                allLinksCount: allLinks.length,
                sampleLinks: allLinks.filter(l => l.text.length > 3).slice(0, 30),
                eventCardsCount: eventCards.length,
                title: document.title,
            };
        });

        console.log(`Page title: ${pageData.title}`);
        console.log(`Total links: ${pageData.allLinksCount}`);
        console.log(`Event cards found: ${pageData.eventCardsCount}`);

        console.log('\nSample links with text:');
        pageData.sampleLinks.forEach((l, i) => console.log(`  ${i + 1}. "${l.text.substring(0, 50)}" -> ${l.href.substring(0, 70)}`));

        console.log('\n\nBody text (first 5000 chars):');
        console.log('='.repeat(60));
        console.log(pageData.bodyText.substring(0, 5000));
        console.log('='.repeat(60));

        // Visit first event if available
        const eventLink = pageData.sampleLinks.find(l =>
            l.href.includes('brasilquecorre.com/') &&
            !l.href.endsWith('/paraiba') &&
            !l.href.includes('facebook') &&
            !l.href.includes('instagram') &&
            l.text.length > 10
        );

        if (eventLink) {
            console.log(`\n\nVisiting event: ${eventLink.text}`);
            console.log(`URL: ${eventLink.href}`);
            await page.goto(eventLink.href, { timeout: 30000 });
            await page.waitForTimeout(3000);

            const eventData = await page.evaluate(() => ({
                bodyText: document.body.innerText.substring(0, 4000),
                h1: document.querySelector('h1')?.textContent?.trim() || '',
                h2: document.querySelector('h2')?.textContent?.trim() || '',
            }));

            console.log(`\nEvent H1: ${eventData.h1}`);
            console.log(`Event H2: ${eventData.h2}`);
            console.log('\nEvent body (first 3000 chars):');
            console.log('='.repeat(60));
            console.log(eventData.bodyText.substring(0, 3000));
            console.log('='.repeat(60));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

debugBrasilQueCorre();
