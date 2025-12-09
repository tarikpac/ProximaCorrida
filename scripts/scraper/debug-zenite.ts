/**
 * Debug script for Zenite provider - visit product detail page
 */

import { chromium } from 'playwright';

async function debugZenite() {
    console.log('=== Debug Zenite Product Detail ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Go directly to a product page
        console.log('1. Visiting product detail page...');
        await page.goto('https://www.zeniteesportes.com/corridacontraocancer2026', { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(5000);

        const productInfo = await page.evaluate(() => {
            const bodyText = document.body.innerText;

            return {
                first2000: bodyText.substring(0, 2000),
            };
        });

        console.log('\nFirst 2000 chars of page:');
        console.log('='.repeat(80));
        console.log(productInfo.first2000);
        console.log('='.repeat(80));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

debugZenite();
