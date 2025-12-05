import { Browser, Page } from 'playwright';
import { BaseScraper } from './base.scraper';
import { StandardizedEvent } from '../interfaces/standardized-event.interface';
import { Logger } from '@nestjs/common';

const STATE_URLS = [
  { state: 'AC', url: 'https://corridasemaratonas.com.br/corridas-no-acre/' },
  { state: 'AL', url: 'https://corridasemaratonas.com.br/corridas-no-alagoas/' },
  { state: 'AP', url: 'https://corridasemaratonas.com.br/corridas-no-amapa/' },
  { state: 'AM', url: 'https://corridasemaratonas.com.br/corridas-no-amazonas/' },
  { state: 'BA', url: 'https://corridasemaratonas.com.br/corridas-na-bahia/' },
  { state: 'CE', url: 'https://corridasemaratonas.com.br/corridas-no-ceara/' },
  { state: 'DF', url: 'https://corridasemaratonas.com.br/corridas-no-distrito-federal/' },
  { state: 'ES', url: 'https://corridasemaratonas.com.br/corridas-no-espirito-santo/' },
  { state: 'GO', url: 'https://corridasemaratonas.com.br/corridas-em-goias/' },
  { state: 'MA', url: 'https://corridasemaratonas.com.br/corridas-no-maranhao/' },
  { state: 'MT', url: 'https://corridasemaratonas.com.br/corridas-no-mato-grosso/' },
  { state: 'MS', url: 'https://corridasemaratonas.com.br/corridas-no-mato-grosso-do-sul/' },
  { state: 'MG', url: 'https://corridasemaratonas.com.br/corridas-em-minas-gerais/' },
  { state: 'PA', url: 'https://corridasemaratonas.com.br/corridas-no-para/' },
  { state: 'PB', url: 'https://corridasemaratonas.com.br/corridas-na-paraiba/' },
  { state: 'PR', url: 'https://corridasemaratonas.com.br/corridas-no-parana/' },
  { state: 'PE', url: 'https://corridasemaratonas.com.br/corridas-em-pernambuco/' },
  { state: 'PI', url: 'https://corridasemaratonas.com.br/corridas-no-piaui/' },
  { state: 'RJ', url: 'https://corridasemaratonas.com.br/corridas-no-rio-de-janeiro/' },
  { state: 'RN', url: 'https://corridasemaratonas.com.br/corridas-no-rio-grande-do-norte/' },
  { state: 'RS', url: 'https://corridasemaratonas.com.br/corridas-no-rio-grande-do-sul/' },
  { state: 'RO', url: 'https://corridasemaratonas.com.br/corridas-em-rondonia/' },
  { state: 'RR', url: 'https://corridasemaratonas.com.br/corridas-em-roraima/' },
  { state: 'SC', url: 'https://corridasemaratonas.com.br/corridas-em-santa-catarina/' },
  { state: 'SP', url: 'https://corridasemaratonas.com.br/corridas-em-sao-paulo/' },
  { state: 'SE', url: 'https://corridasemaratonas.com.br/corridas-em-sergipe/' },
  { state: 'TO', url: 'https://corridasemaratonas.com.br/corridas-no-tocantins/' },
];

export class CorridasEMaratonasScraper extends BaseScraper {
  readonly name = 'corridasemaratonas';
  private readonly logger = new Logger(CorridasEMaratonasScraper.name);

  async scrape(browser: Browser): Promise<StandardizedEvent[]> {
    const results: StandardizedEvent[] = [];
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://www.google.com/',
      },
    });

    for (const config of STATE_URLS) {
      this.logger.log(`Scraping ${config.state} from ${config.url}`);
      try {
        const page = await context.newPage();
        await page.goto(config.url, { timeout: 60000 });

        // Wait for table rows or check if empty
        try {
          await page.waitForSelector('.table-row', { timeout: 15000 });
        } catch (e) {
          this.logger.warn(`No events found for ${config.state} or timeout.`);
          await page.close();
          continue;
        }

        const rawEvents = await page.$$eval('.table-row', (rows) => {
          return rows.map((row) => {
            const titleLink = row.querySelector(
              'td:nth-child(1) a',
            ) as HTMLAnchorElement;
            const dateStr = row
              .querySelector('td:nth-child(2)')
              ?.textContent?.trim();
            const city = row
              .querySelector('td:nth-child(3)')
              ?.textContent?.trim();
            const distancesStr = row
              .querySelector('td:nth-child(4)')
              ?.textContent?.trim();

            return {
              title: titleLink?.textContent?.trim(),
              detailsUrl: titleLink?.href,
              dateStr,
              city,
              distancesStr,
            };
          });
        });

        this.logger.log(
          `Found ${rawEvents.length} raw events for ${config.state}. Processing details...`,
        );

        for (const raw of rawEvents) {
          if (!raw.detailsUrl) continue;

          try {
            const detailsPage = await context.newPage();
            await detailsPage.goto(raw.detailsUrl, { timeout: 30000 });

            // Registration Link
            const regLink = await detailsPage.evaluate(() => {
              const links = Array.from(document.querySelectorAll('a'));
              const found = links.find(
                (a) =>
                  a.textContent?.toLowerCase().includes('inscrição') ||
                  a.textContent?.toLowerCase().includes('inscreva-se') ||
                  a.href.includes('zeniteesportes') ||
                  a.href.includes('ticketsports') ||
                  a.href.includes('doity'),
              );
              return found ? found.href : null;
            });

            // Price Extraction
            let priceText = await detailsPage.evaluate(() => {
              const bodyText = document.body.innerText;
              const priceMatch = bodyText.match(/R\$\s?(\d{2,3}[.,]\d{2})/i);
              return priceMatch ? `R$ ${priceMatch[1]}` : null;
            });

            // Image Extraction
            let imageUrl: string | null = null;
            if (regLink) {
              try {
                const regPage = await context.newPage();
                await regPage.goto(regLink, {
                  timeout: 45000,
                  waitUntil: 'domcontentloaded',
                });

                if (!priceText) {
                  priceText = await regPage.evaluate(() => {
                    const bodyText = document.body.innerText;
                    const priceMatch = bodyText.match(
                      /R\$\s?(\d{2,3}[.,]\d{2})/i,
                    );
                    return priceMatch ? `R$ ${priceMatch[1]}` : null;
                  });
                }

                imageUrl = await regPage.evaluate(() => {
                  const ogImage = document.querySelector(
                    'meta[property="og:image"]',
                  );
                  if (ogImage && (ogImage as HTMLMetaElement).content)
                    return (ogImage as HTMLMetaElement).content;

                  const race83Img = document.querySelector(
                    'img.img-capa-evento',
                  );
                  if (race83Img) return (race83Img as HTMLImageElement).src;

                  const images = Array.from(document.querySelectorAll('img'));
                  const bannerCandidate = images.find((img) => {
                    const isLarge = img.naturalWidth > 600;
                    const hasBannerKeyword =
                      (img.src + img.alt).toLowerCase().includes('banner') ||
                      (img.src + img.alt).toLowerCase().includes('cartaz');
                    return isLarge || hasBannerKeyword;
                  });
                  return bannerCandidate ? bannerCandidate.src : null;
                });
                await regPage.close();
              } catch (e) {
                this.logger.warn(
                  `Failed to load registration page for image/price: ${(e as Error).message}`,
                );
              }
            }

            await detailsPage.close();

            // Normalization
            const dateParts = raw.dateStr?.split('/');
            const eventDate =
              dateParts && dateParts.length === 3
                ? new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
                : new Date();

            const distances = raw.distancesStr
              ? raw.distancesStr.split('/').map((d) => d.trim())
              : [];

            // Price Min Parsing
            let priceMin: number | null = null;
            if (priceText) {
              const numericString = priceText
                .replace('R$', '')
                .replace('.', '')
                .replace(',', '.')
                .trim();
              const parsed = parseFloat(numericString);
              if (!isNaN(parsed)) priceMin = parsed;
            }

            results.push({
              title: raw.title || 'Untitled',
              date: eventDate,
              city: raw.city || null,
              state: config.state, // Explicit from config
              distances,
              regUrl: regLink || null,
              sourceUrl: raw.detailsUrl,
              sourcePlatform: this.name,
              sourceEventId: null, // This platform doesn't have clear IDs
              imageUrl: imageUrl || null,
              priceText: priceText || null,
              priceMin,
              rawLocation: raw.city ? `${raw.city} - ${config.state}` : null,
            });
          } catch (err) {
            this.logger.error(
              `Failed to process event ${raw.title}: ${(err as Error).message}`,
            );
          }
        }
        await page.close();
      } catch (error) {
        this.logger.error(`Failed to scrape state ${config.state}`, error);
      }
    }

    await context.close();
    return results;
  }
}
