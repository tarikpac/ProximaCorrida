/**
 * Debug script for Race83 provider
 */

import { chromium } from 'playwright';

async function debugRace83() {
    console.log('=== Debug Race83 ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    try {
        const page = await context.newPage();
        console.log('Navigating to Race83...');
        await page.goto('https://www.race83.com.br/', { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(5000);

        // Get all links
        const pageData = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const allLinks = Array.from(document.querySelectorAll('a')).map(a => ({
                href: (a as HTMLAnchorElement).href,
                text: a.textContent?.trim() || '',
            }));

            // Get button texts
            const buttons = Array.from(document.querySelectorAll('button, [role="button"], .btn')).map(b =>
                b.textContent?.trim() || ''
            );

            return {
                bodyText: bodyText.substring(0, 4000),
                allLinksCount: allLinks.length,
                sampleLinks: allLinks.slice(0, 20),
                buttons,
            };
        });

        console.log(`Total links: ${pageData.allLinksCount}`);
        console.log('\nSample links:');
        pageData.sampleLinks.forEach((l, i) => console.log(`  ${i + 1}. "${l.text.substring(0, 30)}" -> ${l.href.substring(0, 60)}`));

        console.log('\nButtons:', pageData.buttons.slice(0, 10));

        console.log('\n\nBody text (first 3000 chars):');
        console.log('='.repeat(60));
        console.log(pageData.bodyText.substring(0, 3000));
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

debugRace83();
