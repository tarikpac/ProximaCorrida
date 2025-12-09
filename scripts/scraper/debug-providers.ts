/**
 * Debug script for CorreParaiba and Race83 providers
 */

import { chromium } from 'playwright';

async function debugProviders() {
    console.log('=== Debug CorreParaiba and Race83 ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    try {
        // ======= CORRE PARAÍBA =======
        console.log('1. CORRE PARAÍBA');
        console.log('='.repeat(60));

        const cpPage = await context.newPage();
        await cpPage.goto('https://www.correparaiba.com.br/', { timeout: 30000 });
        await cpPage.waitForLoadState('domcontentloaded');
        await cpPage.waitForTimeout(3000);

        // Get first event link
        const cpEventLinks = await cpPage.$$eval('a[href*="/corrida"], a[href*="corrida"]', (links) => {
            return links.slice(0, 3).map(a => ({
                href: (a as HTMLAnchorElement).href,
                text: a.textContent?.trim() || ''
            }));
        });

        console.log(`Found ${cpEventLinks.length} event links`);
        cpEventLinks.forEach((l, i) => console.log(`  ${i + 1}. ${l.text.substring(0, 40)} -> ${l.href}`));

        if (cpEventLinks.length > 0) {
            console.log('\n   Visiting first event...');
            await cpPage.goto(cpEventLinks[0].href, { timeout: 30000 });
            await cpPage.waitForTimeout(2000);

            const cpDetails = await cpPage.evaluate(() => ({
                bodyText: document.body.innerText.substring(0, 3000),
                h1: document.querySelector('h1')?.textContent?.trim() || '',
                h5s: Array.from(document.querySelectorAll('h5')).map(h => h.textContent?.trim() || ''),
                h6s: Array.from(document.querySelectorAll('h6')).map(h => h.textContent?.trim() || ''),
            }));

            console.log(`   H1: ${cpDetails.h1}`);
            console.log(`   H5s: ${cpDetails.h5s.join(' | ')}`);
            console.log(`   H6s: ${cpDetails.h6s.join(' | ')}`);
            console.log('\n   Body text (first 2000 chars):');
            console.log('   ---');
            console.log(cpDetails.bodyText.substring(0, 2000));
            console.log('   ---');
        }
        await cpPage.close();

        // ======= RACE83 =======
        console.log('\n\n2. RACE83');
        console.log('='.repeat(60));

        const r83Page = await context.newPage();
        await r83Page.goto('https://www.race83.com.br/', { timeout: 30000 });
        await r83Page.waitForLoadState('domcontentloaded');
        await r83Page.waitForTimeout(3000);

        // Get first event link
        const r83EventLinks = await r83Page.$$eval('a[href*="/evento/"], a[href*="/login/"]', (links) => {
            return links.slice(0, 5).map(a => ({
                href: (a as HTMLAnchorElement).href,
                text: a.textContent?.trim() || ''
            }));
        });

        console.log(`Found ${r83EventLinks.length} event links`);
        r83EventLinks.forEach((l, i) => console.log(`  ${i + 1}. ${l.text.substring(0, 40)} -> ${l.href}`));

        if (r83EventLinks.length > 0) {
            // Find actual event link (not login)
            const eventLink = r83EventLinks.find(l => l.href.includes('/evento/'));
            if (eventLink) {
                console.log('\n   Visiting event...');
                await r83Page.goto(eventLink.href, { timeout: 30000 });
                await r83Page.waitForTimeout(2000);

                const r83Details = await r83Page.evaluate(() => ({
                    bodyText: document.body.innerText.substring(0, 3000),
                    h1: document.querySelector('h1')?.textContent?.trim() || '',
                    h2: document.querySelector('h2')?.textContent?.trim() || '',
                }));

                console.log(`   H1: ${r83Details.h1}`);
                console.log(`   H2: ${r83Details.h2}`);
                console.log('\n   Body text (first 2000 chars):');
                console.log('   ---');
                console.log(r83Details.bodyText.substring(0, 2000));
                console.log('   ---');
            }
        }
        await r83Page.close();

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

debugProviders();
