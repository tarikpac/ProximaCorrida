import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright';
import { EventsService } from '../events/events.service';

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);

    constructor(private readonly eventsService: EventsService) { }

    async scrapeEvents() {
        this.logger.log('Starting scraping process...');
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();

        try {
            await page.goto('https://corridasemaratonas.com.br/corridas-na-paraiba/', { timeout: 60000 });
            await page.waitForSelector('.table-row', { timeout: 15000 });

            const events = await page.$$eval('.table-row', (rows) => {
                return rows.map(row => {
                    const titleLink = row.querySelector('td:nth-child(1) a') as HTMLAnchorElement;
                    const dateStr = row.querySelector('td:nth-child(2)')?.textContent?.trim();
                    const city = row.querySelector('td:nth-child(3)')?.textContent?.trim();
                    const distancesStr = row.querySelector('td:nth-child(4)')?.textContent?.trim();

                    return {
                        title: titleLink?.textContent?.trim(),
                        detailsUrl: titleLink?.href,
                        dateStr,
                        city,
                        distancesStr
                    };
                });
            });

            this.logger.log(`Found ${events.length} events. Processing...`);

            for (const event of events) {
                if (!event.detailsUrl) continue;

                try {
                    const detailsPage = await context.newPage();
                    await detailsPage.goto(event.detailsUrl, { timeout: 30000 });

                    // Registration Link
                    const regLink = await detailsPage.evaluate(() => {
                        const links = Array.from(document.querySelectorAll('a'));
                        const found = links.find(a =>
                            a.textContent?.toLowerCase().includes('inscrição') ||
                            a.textContent?.toLowerCase().includes('inscreva-se') ||
                            a.href.includes('zeniteesportes') ||
                            a.href.includes('ticketsports') ||
                            a.href.includes('doity')
                        );
                        return found ? found.href : null;
                    });

                    // Price Extraction (Heuristic)
                    let price = await detailsPage.evaluate(() => {
                        const bodyText = document.body.innerText;
                        const priceMatch = bodyText.match(/R\$\s?(\d{2,3}[.,]\d{2})/i);
                        return priceMatch ? `R$ ${priceMatch[1]}` : null;
                    });

                    // Image Extraction
                    let imageUrl = null;
                    if (regLink) {
                        try {
                            const regPage = await context.newPage();
                            await regPage.goto(regLink, { timeout: 45000, waitUntil: 'domcontentloaded' });

                            // Try to get price from reg page if not found
                            if (!price) {
                                price = await regPage.evaluate(() => {
                                    const bodyText = document.body.innerText;
                                    const priceMatch = bodyText.match(/R\$\s?(\d{2,3}[.,]\d{2})/i);
                                    return priceMatch ? `R$ ${priceMatch[1]}` : null;
                                });
                            }

                            imageUrl = await regPage.evaluate(() => {
                                const ogImage = document.querySelector('meta[property="og:image"]');
                                if (ogImage && (ogImage as HTMLMetaElement).content) return (ogImage as HTMLMetaElement).content;

                                const race83Img = document.querySelector('img.img-capa-evento');
                                if (race83Img) return (race83Img as HTMLImageElement).src;

                                const images = Array.from(document.querySelectorAll('img'));
                                const bannerCandidate = images.find(img => {
                                    const isLarge = img.naturalWidth > 600;
                                    const hasBannerKeyword = (img.src + img.alt).toLowerCase().includes('banner') ||
                                        (img.src + img.alt).toLowerCase().includes('cartaz');
                                    return isLarge || hasBannerKeyword;
                                });
                                return bannerCandidate ? bannerCandidate.src : null;
                            });
                            await regPage.close();
                        } catch (e) {
                            this.logger.warn(`Failed to load registration page for image/price: ${(e as Error).message}`);
                        }
                    }

                    await detailsPage.close();

                    // Normalization
                    const dateParts = event.dateStr?.split('/');
                    const eventDate = dateParts && dateParts.length === 3
                        ? new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
                        : new Date();

                    const distances = event.distancesStr ? event.distancesStr.split('/').map(d => d.trim()) : [];

                    // Upsert
                    await this.eventsService.upsertBySourceUrl({
                        title: event.title || 'Untitled',
                        date: eventDate,
                        city: event.city || 'Unknown',
                        distances: distances,
                        regLink: regLink || '',
                        sourceUrl: event.detailsUrl,
                        imageUrl: imageUrl,
                        price: price || 'Sob Consulta',
                        state: 'PB'
                    });

                    this.logger.log(`Upserted event: ${event.title} - Price: ${price}`);

                } catch (err) {
                    this.logger.error(`Failed to process event ${event.title}: ${(err as Error).message}`);
                }
            }

        } catch (error) {
            this.logger.error('Scraping failed', error);
        } finally {
            await browser.close();
        }
    }
}
