/**
 * Debug script for Sympla provider
 */

import { chromium } from 'playwright';

async function debugSympla() {
    console.log('=== Debug Sympla ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    try {
        const page = await context.newPage();

        // Sympla URL for running events
        const url = 'https://www.sympla.com.br/eventos/esportes/corrida';
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
            const eventCards = document.querySelectorAll('[class*="event"], [class*="card"], [data-testid*="event"]');

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

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

debugSympla();
