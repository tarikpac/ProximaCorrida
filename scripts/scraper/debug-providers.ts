/**
 * Complete debug script for all providers
 */
import { chromium } from 'playwright';

async function debugProvider(name: string, url: string, waitTime: number = 5000) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`=== Debugging ${name} ===`);
    console.log(`URL: ${url}`);
    console.log('='.repeat(60));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto(url, { timeout: 30000 });
        await page.waitForTimeout(waitTime);

        // Scroll to load lazy content
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(1000);
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(1000);

        // Get page text
        const bodyText = await page.evaluate(() => document.body.innerText);
        console.log('\n--- Page Text (first 2500 chars) ---\n');
        console.log(bodyText.substring(0, 2500));

        // Get all relevant class names
        const classNames = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const classes = new Set<string>();
            elements.forEach(el => {
                el.classList.forEach(c => {
                    if (c.includes('card') || c.includes('event') || c.includes('evento') ||
                        c.includes('item') || c.includes('list') || c.includes('grid') ||
                        c.includes('title') || c.includes('titulo') || c.includes('date') ||
                        c.includes('data') || c.includes('local') || c.includes('location')) {
                        classes.add(c);
                    }
                });
            });
            return Array.from(classes).sort();
        });
        console.log('\n--- Relevant CSS Classes ---');
        console.log(classNames.join(', '));

        // Count links with common patterns
        const linkStats = await page.evaluate(() => {
            const allLinks = document.querySelectorAll('a');
            const inscrevaLinks = Array.from(allLinks).filter(a =>
                a.textContent?.toUpperCase().includes('INSCREV') ||
                a.textContent?.toUpperCase().includes('INSCRIÇÃO')
            );
            const eventoLinks = Array.from(allLinks).filter(a =>
                a.href.includes('/evento') || a.href.includes('/event') || a.href.includes('/e/')
            );
            return {
                total: allLinks.length,
                inscrevaCount: inscrevaLinks.length,
                eventoCount: eventoLinks.length,
            };
        });
        console.log('\n--- Link Statistics ---');
        console.log(`Total links: ${linkStats.total}`);
        console.log(`INSCREVA-SE buttons: ${linkStats.inscrevaCount}`);
        console.log(`Event links: ${linkStats.eventoCount}`);

        // Save screenshot
        const screenshotName = `debug-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
        await page.screenshot({ path: screenshotName, fullPage: true });
        console.log(`\nScreenshot saved: ${screenshotName}`);

    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
    } finally {
        await browser.close();
    }
}

async function main() {
    // TicketSports - correct URL format
    await debugProvider(
        'TicketSports PB',
        'https://www.ticketsports.com.br/Calendario/Todos-os-organizadores/Corrida-de-rua,Trail-run/PB/Todas-as-cidades/0,00/0,00/false/?termo=&periodo=0&mes=0&inicio=&fim=&ordenacao=&pais='
    );

    // Minhas Inscrições
    await debugProvider(
        'Minhas Inscrições',
        'https://www.minhasinscricoes.com.br/eventos/corrida'
    );

    // Doity - Sports/Running category
    await debugProvider(
        'Doity',
        'https://doity.com.br/eventos?category=24771'
    );

    // Sympla - Running search
    await debugProvider(
        'Sympla',
        'https://www.sympla.com.br/eventos?s=corrida&c=esportes'
    );

    // Zenite Esportes
    await debugProvider(
        'Zenite',
        'https://www.zeniteesportes.com/proximos-eventos'
    );

    // Corre Paraíba
    await debugProvider(
        'Corre Paraíba',
        'https://correparaiba.com.br/eventos'
    );

    // Race83
    await debugProvider(
        'Race83',
        'https://www.race83.com.br/eventos'
    );

    console.log('\n\n=== DEBUG COMPLETE ===\n');
}

main().catch(console.error);
