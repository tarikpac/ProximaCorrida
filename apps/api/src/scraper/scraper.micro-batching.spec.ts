import { Test, TestingModule } from '@nestjs/testing';
import { ScraperService } from './scraper.service';
import { getQueueToken } from '@nestjs/bullmq';
import { EventsService } from '../events/events.service';
import { CorridasEMaratonasScraper } from './scrapers/corridas-emaratonas.scraper';
import { StandardizedEvent } from './interfaces/standardized-event.interface';
import { Browser } from 'playwright';

// Mock dependencies
const mockQueue = {
    add: jest.fn(),
};

const mockEventsService = {
    upsertFromStandardized: jest.fn(),
};

// Start Mock Playwright Setup
// We need to mock the scraper's dependencies (Browser, Context, Page) to test the scraping logic itself
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
// End Mock Playwright Setup

describe('ScraperService Micro-Batching & Error Handling', () => {
    let service: ScraperService;
    let scraperInstance: CorridasEMaratonasScraper;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScraperService,
                {
                    provide: getQueueToken('scraper'),
                    useValue: mockQueue,
                },
                {
                    provide: EventsService,
                    useValue: mockEventsService,
                },
            ],
        }).compile();

        service = module.get<ScraperService>(ScraperService);
        scraperInstance = new CorridasEMaratonasScraper();

        // Clear mocks before each test
        mockQueue.add.mockClear();
        mockEventsService.upsertFromStandardized.mockClear();
        jest.clearAllMocks();
    });

    describe('Micro-Batching Scheduling', () => {
        it('should split jobs for CorridasEMaratonasScraper', async () => {
            const expectedSplits = scraperInstance.getSplits();
            expect(expectedSplits.length).toBeGreaterThan(0);

            await service.enqueueAllPlatforms();

            expect(mockQueue.add).toHaveBeenCalledTimes(expectedSplits.length);
            expect(mockQueue.add).toHaveBeenCalledWith(
                'scrape-platform',
                expect.objectContaining({
                    platform: 'corridasemaratonas',
                    filter: expectedSplits[0] // 'AC'
                }),
                expect.any(Object)
            );
        });
    });

    describe('Filtering Logic', () => {
        it('should only process the specific state when filter is provided to scrape()', async () => {
            // Setup mock response for page.$$eval to return one dummy event
            mockPage.$$eval.mockResolvedValue([{ title: 'Test Race', detailsUrl: 'http://test.com' }]);
            mockPage.evaluate.mockResolvedValue(null); // Price

            // Spy on logger to verify filter usage
            const loggerSpy = jest.spyOn((scraperInstance as any).logger, 'log');

            const events = await scraperInstance.scrape(mockBrowser, undefined, 'AC');

            // Verify that it tried to scrape AC url
            expect(mockPage.goto).toHaveBeenCalledWith(
                expect.stringContaining('corridas-no-acre'),
                expect.any(Object)
            );

            // Verify it did NOT try to scrape AL (Alagoas)
            expect(mockPage.goto).not.toHaveBeenCalledWith(
                expect.stringContaining('corridas-no-alagoas'),
                expect.any(Object)
            );

            // Verify logging confirms filtering
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Filtering scraper to state: AC'));
        });

        it('should handle invalid filter gracefully by doing nothing', async () => {
            const loggerSpy = jest.spyOn((scraperInstance as any).logger, 'warn');

            await scraperInstance.scrape(mockBrowser, undefined, 'XYZ_INVALID_STATE');

            // Should warn and not open any page (other than context creation)
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('matched no states'));
            expect(mockPage.goto).not.toHaveBeenCalled();
        });
    });

    describe('Callback & Error Resilience', () => {
        it('should call onEventFound callback when event is processed', async () => {
            mockPage.$$eval.mockResolvedValue([{
                title: 'Callback Race',
                detailsUrl: 'http://callback.com',
                dateStr: '01/01/2025',
                city: 'Test City',
                distancesStr: '5km'
            }]);

            const mockCallback = jest.fn();

            await scraperInstance.scrape(mockBrowser, mockCallback, 'AC');

            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Callback Race'
            }));
        });

        it('should continue to next state/event even if one upsert fails', async () => {
            // This simulates the runPlatform wrapper logic
            const failingUpsert = jest.fn().mockRejectedValue(new Error('Database Timeout'));

            mockPage.$$eval.mockResolvedValue([
                { title: 'Event 1', detailsUrl: 'http://e1.com' },
                { title: 'Event 2', detailsUrl: 'http://e2.com' } // Should still process this one
            ]);

            // We manually execute the logic that ScraperService.runPlatform does:
            // pass a callback that handles error suppression.
            const safeCallback = async (e) => {
                try {
                    await failingUpsert(e);
                } catch (err) {
                    // Squelch error
                }
            };

            await scraperInstance.scrape(mockBrowser, safeCallback, 'AC');

            // Both events should have triggered the callback attempt
            expect(failingUpsert).toHaveBeenCalledTimes(2);
        });
    });
});
