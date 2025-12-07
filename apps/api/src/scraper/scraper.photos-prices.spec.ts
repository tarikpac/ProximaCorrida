/**
 * Tests for Scraper Enhancement: Photos & Prices
 * Task Groups 1-4: Price extraction, Image extraction, Platform handling, Integration
 */

import { CorridasEMaratonasScraper } from './scrapers/corridas-emaratonas.scraper';
import {
    extractAllPrices,
    classifyPrice,
    selectBestPrice,
    ExtractedPrice,
} from './utils/price-extraction.utils';
import {
    extractBannerImage,
    extractLargestImage,
    extractCssBackgroundImage,
    detectPlatform,
    ImageInfo,
} from './utils/image-extraction.utils';

// ============================================
// TASK GROUP 1: Price Extraction Heuristics
// ============================================

describe('Price Extraction Heuristics', () => {
    describe('extractAllPrices', () => {
        it('should extract all prices from page body text', () => {
            const text = `
        Lote 1: R$ 89,90
        Lote 2: R$ 99,90
        PCD: R$ 45,00
      `;
            const prices = extractAllPrices(text);

            expect(prices).toHaveLength(3);
            expect(prices[0].value).toBe(89.9);
            expect(prices[1].value).toBe(99.9);
            expect(prices[2].value).toBe(45.0);
        });

        it('should capture context window around prices', () => {
            const text = 'Inscrição Kit Básico 5km: R$ 79,90 - inclui camiseta';
            const prices = extractAllPrices(text);

            expect(prices).toHaveLength(1);
            expect(prices[0].context.toLowerCase()).toContain('kit básico');
            expect(prices[0].context).toContain('5km');
        });
    });

    describe('classifyPrice', () => {
        it('should classify price as discounted when context contains PCD/meia/kids keywords', () => {
            const pcdPrice: ExtractedPrice = {
                value: 45.0,
                context: 'categoria pcd r$ 45,00',
                rawMatch: 'R$ 45,00',
            };
            const meiaPrice: ExtractedPrice = {
                value: 50.0,
                context: 'meia entrada estudante r$ 50,00',
                rawMatch: 'R$ 50,00',
            };
            const kidsPrice: ExtractedPrice = {
                value: 30.0,
                context: 'infantil kids r$ 30,00',
                rawMatch: 'R$ 30,00',
            };

            expect(classifyPrice(pcdPrice)).toBe('discounted');
            expect(classifyPrice(meiaPrice)).toBe('discounted');
            expect(classifyPrice(kidsPrice)).toBe('discounted');
        });

        it('should classify price as general when context contains lote/kit/geral keywords', () => {
            const lotePrice: ExtractedPrice = {
                value: 89.9,
                context: 'lote 1 r$ 89,90',
                rawMatch: 'R$ 89,90',
            };
            const kitPrice: ExtractedPrice = {
                value: 99.9,
                context: 'kit básico r$ 99,90',
                rawMatch: 'R$ 99,90',
            };
            const geralPrice: ExtractedPrice = {
                value: 79.9,
                context: 'categoria geral r$ 79,90',
                rawMatch: 'R$ 79,90',
            };

            expect(classifyPrice(lotePrice)).toBe('general');
            expect(classifyPrice(kitPrice)).toBe('general');
            expect(classifyPrice(geralPrice)).toBe('general');
        });

        it('should prioritize discounted classification over general', () => {
            // Edge case: text mentions both kit and PCD
            const mixedPrice: ExtractedPrice = {
                value: 45.0,
                context: 'kit básico pcd r$ 45,00',
                rawMatch: 'R$ 45,00',
            };

            expect(classifyPrice(mixedPrice)).toBe('discounted');
        });
    });

    describe('selectBestPrice', () => {
        it('should select lowest general price when multiple exist', () => {
            const prices: ExtractedPrice[] = [
                { value: 120.0, context: 'lote 2 r$ 120,00', rawMatch: 'R$ 120,00' },
                { value: 89.9, context: 'lote 1 r$ 89,90', rawMatch: 'R$ 89,90' },
                { value: 45.0, context: 'pcd r$ 45,00', rawMatch: 'R$ 45,00' },
            ];

            const result = selectBestPrice(prices, false);

            expect(result.priceMin).toBe(89.9);
            expect(result.priceText).toBe('A partir de R$ 89,90');
        });

        it('should return null priceMin when only discounted prices exist', () => {
            const prices: ExtractedPrice[] = [
                { value: 45.0, context: 'pcd r$ 45,00', rawMatch: 'R$ 45,00' },
                { value: 50.0, context: 'meia entrada r$ 50,00', rawMatch: 'R$ 50,00' },
            ];

            const result = selectBestPrice(prices, false);

            expect(result.priceMin).toBeNull();
            expect(result.priceText).toBe('Ver valores na página de inscrição');
        });

        it('should detect free events', () => {
            const result = selectBestPrice([], true);

            expect(result.priceMin).toBe(0);
            expect(result.priceText).toBe('Gratuito');
        });
    });
});

// ============================================
// TASK GROUP 2: Image Extraction Fallback Chain
// ============================================

describe('Image Extraction Fallback Chain', () => {
    describe('extractBannerImage', () => {
        it('should prefer images with banner/cartaz keywords', () => {
            const images: ImageInfo[] = [
                { src: 'https://example.com/logo.png', alt: 'logo', width: 100 },
                {
                    src: 'https://example.com/banner-corrida.jpg',
                    alt: 'banner da corrida',
                    width: 800,
                },
                { src: 'https://example.com/photo.jpg', alt: 'photo', width: 600 },
            ];

            const result = extractBannerImage(images);

            expect(result).toBe('https://example.com/banner-corrida.jpg');
        });
    });

    describe('extractLargestImage', () => {
        it('should return largest image when meta tags and banner missing', () => {
            const images: ImageInfo[] = [
                { src: 'https://example.com/small.png', naturalWidth: 100 },
                { src: 'https://example.com/large.jpg', naturalWidth: 1200 },
                { src: 'https://example.com/medium.jpg', naturalWidth: 600 },
            ];

            const result = extractLargestImage(images);

            expect(result).toBe('https://example.com/large.jpg');
        });

        it('should filter out small tracking pixels and icons', () => {
            const images: ImageInfo[] = [
                { src: 'https://example.com/pixel.gif', naturalWidth: 1 },
                { src: 'https://example.com/icon.png', naturalWidth: 32 },
                { src: 'https://example.com/banner.jpg', naturalWidth: 800 },
            ];

            const result = extractLargestImage(images);

            expect(result).toBe('https://example.com/banner.jpg');
        });
    });

    describe('extractCssBackgroundImage', () => {
        it('should extract CSS background-image as last resort', () => {
            const backgroundStyle = 'url("https://example.com/hero-bg.jpg")';

            const result = extractCssBackgroundImage(backgroundStyle);

            expect(result).toBe('https://example.com/hero-bg.jpg');
        });

        it('should return null when no valid background found', () => {
            const result = extractCssBackgroundImage('none');

            expect(result).toBeNull();
        });
    });
});

// ============================================
// TASK GROUP 3: Platform-Specific Handling
// ============================================

describe('Platform-Specific Handling', () => {
    describe('detectPlatform', () => {
        it('should detect TicketSports platform from regLink URL', () => {
            const result = detectPlatform(
                'https://www.ticketsports.com.br/e/corrida-abc-123',
            );

            expect(result).toBe('ticketsports');
        });

        it('should detect Doity platform from regLink URL', () => {
            const result = detectPlatform('https://doity.com.br/corrida-xyz');

            expect(result).toBe('doity');
        });

        it('should detect Zenite platform from regLink URL', () => {
            const result = detectPlatform(
                'https://zeniteesportes.com.br/inscricao/12345',
            );

            expect(result).toBe('zenite');
        });

        it('should return other for unknown platforms', () => {
            const result = detectPlatform('https://unknown-platform.com/event');

            expect(result).toBe('other');
        });
    });
});

// ============================================
// TASK GROUP 4: Integration Tests
// ============================================

describe('Scraper Integration - Photos & Prices', () => {
    let scraperInstance: CorridasEMaratonasScraper;

    const mockPage = {
        goto: jest.fn(),
        waitForSelector: jest.fn(),
        $$eval: jest.fn(),
        evaluate: jest.fn(),
        close: jest.fn(),
    } as any;

    const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn(),
    } as any;

    const mockBrowser = {
        newContext: jest.fn().mockResolvedValue(mockContext),
        close: jest.fn(),
    } as any;

    beforeEach(() => {
        scraperInstance = new CorridasEMaratonasScraper();
        jest.clearAllMocks();
    });

    it('should extract both image and price correctly in full scrape flow', async () => {
        mockPage.$$eval.mockResolvedValue([
            {
                title: 'Corrida Teste',
                detailsUrl: 'http://test.com/corrida',
                dateStr: '15/03/2025',
                city: 'João Pessoa',
                distancesStr: '5km/10km',
            },
        ]);

        // Mock page.evaluate for various extraction calls
        mockPage.evaluate
            .mockResolvedValueOnce(null) // detectRegistrationLink url
            .mockResolvedValueOnce('Lote 1: R$ 89,90') // extractPriceWithClassification body text
            .mockResolvedValueOnce('https://example.com/banner.jpg'); // extractImageWithFallback

        const mockCallback = jest.fn();
        const results = await scraperInstance.scrape(mockBrowser, mockCallback, 'PB');

        expect(results).toHaveLength(1);
        const event = results[0];

        expect(event.title).toBe('Corrida Teste');
        expect(event.state).toBe('PB');
    });

    it('should handle page with no image gracefully', async () => {
        mockPage.$$eval.mockResolvedValue([
            {
                title: 'Corrida Sem Imagem',
                detailsUrl: 'http://test.com/corrida-2',
                dateStr: '20/04/2025',
                city: 'Recife',
                distancesStr: '10km',
            },
        ]);

        mockPage.evaluate
            .mockResolvedValueOnce(null) // detectRegistrationLink
            .mockResolvedValueOnce('R$ 100,00') // price text
            .mockResolvedValueOnce(null); // No image found

        const results = await scraperInstance.scrape(mockBrowser, undefined, 'PE');

        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Corrida Sem Imagem');
    });

    it('should handle fallback URL for #N/A details URL', async () => {
        mockPage.$$eval.mockResolvedValue([
            {
                title: 'Corrida Com Link Quebrado',
                detailsUrl: 'https://corridasemaratonas.com.br/corridas-na-bahia/#N/A',
                dateStr: '01/05/2025',
                city: 'Salvador',
                distancesStr: '5km',
            },
        ]);

        // Clear goto mock to count calls
        mockPage.goto.mockClear();

        const results = await scraperInstance.scrape(mockBrowser, undefined, 'BA');

        expect(results).toHaveLength(1);
        expect(results[0].sourceUrl).toContain('/fallback/BA/');
        expect(results[0].priceText).toBe('Sob Consulta');

        // Should only call goto once (for the list page), not for #N/A link
        expect(mockPage.goto).toHaveBeenCalledTimes(1);
    });
});
