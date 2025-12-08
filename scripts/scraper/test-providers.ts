/**
 * Test specific providers with detailed logging
 */
import { chromium } from 'playwright';

async function testTicketSports() {
    console.log('\n=== Testing TicketSports PB ===');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const url = 'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua,Trail-run/PB/Todas-as-cidades/0,00/0,00/false/';
    console.log(`URL: ${url}`);

    await page.goto(url, { timeout: 30000 });
    console.log('Page loaded');

    // Wait for content
    await page.waitForTimeout(5000);

    // Check what selectors we can find
    const cardEventoCount = await page.$$eval('.card-evento', el => el.length);
    console.log(`.card-evento count: ${cardEventoCount}`);

    const divCardCount = await page.$$eval('div[class*="card-evento"]', el => el.length);
    console.log(`div[class*="card-evento"] count: ${divCardCount}`);

    const aCardCount = await page.$$eval('a[class*="card"]', el => el.length);
    console.log(`a[class*="card"] count: ${aCardCount}`);

    // Get all card elements with their classes
    const allCards = await page.$$eval('div.card-evento, .card-evento', (cards) => {
        return cards.map(c => ({
            tag: c.tagName,
            classes: c.className,
            text: c.textContent?.substring(0, 100)
        }));
    });
    console.log('Cards found:', allCards.length);
    allCards.slice(0, 3).forEach(c => console.log(c));

    // Check if "Nenhum evento" message exists
    const noEventsText = await page.evaluate(() => {
        return document.body.innerText.includes('Nenhum evento');
    });
    console.log(`"Nenhum evento" message present: ${noEventsText}`);

    // Get page text snippet
    const pageText = await page.evaluate(() => document.body.innerText.substring(0, 1500));
    console.log('\nPage text:\n', pageText);

    await browser.close();
}

async function testRace83() {
    console.log('\n=== Testing Race83 ===');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const url = 'https://www.race83.com.br/eventos';
    console.log(`URL: ${url}`);

    await page.goto(url, { timeout: 30000 });
    console.log('Page loaded');

    await page.waitForTimeout(5000);

    // Check for INSCREVA-SE buttons
    const inscrevaCount = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a, button')).filter(
            el => el.textContent?.toUpperCase().includes('INSCREVA')
        ).length;
    });
    console.log(`INSCREVA-SE buttons: ${inscrevaCount}`);

    // Check for event links
    const eventoLinks = await page.$$eval('a[href*="evento"]', links => links.length);
    console.log(`Event links: ${eventoLinks}`);

    // Test the parsing logic
    const bodyText = await page.evaluate(() => document.body.innerText);
    const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let eventCount = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})$/);
        if (dateMatch) {
            eventCount++;
            if (eventCount <= 5) {
                console.log(`\nEvent ${eventCount}:`);
                console.log(`  Date: ${line}`);
                console.log(`  Next lines: ${lines.slice(i + 1, i + 4).join(' | ')}`);
            }
        }
    }
    console.log(`\nTotal date patterns found: ${eventCount}`);

    await browser.close();
}

async function testZenite() {
    console.log('\n=== Testing Zenite ===');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const url = 'https://www.zeniteesportes.com/proximos-eventos';
    console.log(`URL: ${url}`);

    await page.goto(url, { timeout: 30000 });
    console.log('Page loaded');

    await page.waitForTimeout(3000);

    // Get all links and filter for event links
    const eventLinks = await page.evaluate(() => {
        const links: Array<{ href: string, text: string }> = [];
        document.querySelectorAll('a').forEach((a) => {
            const href = a.href;
            const text = a.textContent?.trim() || '';

            // Skip obvious navigation links
            if (href.includes('/proximos-eventos')) return;
            if (href.includes('/resultados')) return;
            if (href.includes('/sobre')) return;
            if (href.includes('/blogs')) return;
            if (href.includes('/minha-conta')) return;
            if (href.includes('/home')) return;
            if (text.length < 10) return;
            if (text.toUpperCase().includes('MENU')) return;
            if (text.toUpperCase().includes('WHATSAPP')) return;
            if (text.toUpperCase().includes('CADASTRE')) return;
            if (text.toUpperCase().includes('ACESSAR')) return;
            if (text.includes('@')) return;

            if (href.includes('zeniteesportes.com/')) {
                links.push({ href, text });
            }
        });
        return links;
    });

    console.log(`Event links found: ${eventLinks.length}`);
    eventLinks.forEach(l => console.log(`  - ${l.text.substring(0, 50)} -> ${l.href}`));

    // Get body text
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\nPage text (first 1000 chars):');
    console.log(bodyText.substring(0, 1000));

    await browser.close();
}

async function main() {
    try {
        await testTicketSports();
        await testRace83();
        await testZenite();
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
