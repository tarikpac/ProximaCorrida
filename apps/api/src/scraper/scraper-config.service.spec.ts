import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ScraperConfigService } from './scraper-config.service';

describe('ScraperConfigService', () => {
    let service: ScraperConfigService;
    let configService: ConfigService;

    const createTestModule = async (envOverrides: Record<string, any> = {}) => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScraperConfigService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => envOverrides[key] ?? undefined),
                    },
                },
            ],
        }).compile();

        service = module.get<ScraperConfigService>(ScraperConfigService);
        configService = module.get<ConfigService>(ConfigService);
        return module;
    };

    describe('default values', () => {
        beforeEach(async () => {
            await createTestModule({});
        });

        it('should return default DETAIL_TIMEOUT_MS of 15000', () => {
            expect(service.detailTimeoutMs).toBe(15000);
        });

        it('should return default REG_TIMEOUT_MS of 20000', () => {
            expect(service.regTimeoutMs).toBe(20000);
        });

        it('should return default SCRAPER_EVENT_DELAY_MS of 500', () => {
            expect(service.eventDelayMs).toBe(500);
        });

        it('should return default SCRAPER_LOG_LEVEL of info', () => {
            expect(service.logLevel).toBe('info');
        });

        it('should return default SCRAPER_STALENESS_DAYS of 7', () => {
            expect(service.stalenessDays).toBe(7);
        });

        it('should return default SCRAPER_BATCH_SIZE of 1', () => {
            expect(service.batchSize).toBe(1);
        });

        it('should return shouldLogDebug as false in production', () => {
            expect(service.shouldLogDebug).toBe(false);
        });
    });

    describe('custom values from environment', () => {
        it('should read custom DETAIL_TIMEOUT_MS', async () => {
            await createTestModule({ DETAIL_TIMEOUT_MS: 10000 });
            expect(service.detailTimeoutMs).toBe(10000);
        });

        it('should read custom REG_TIMEOUT_MS', async () => {
            await createTestModule({ REG_TIMEOUT_MS: 25000 });
            expect(service.regTimeoutMs).toBe(25000);
        });

        it('should read custom SCRAPER_EVENT_DELAY_MS', async () => {
            await createTestModule({ SCRAPER_EVENT_DELAY_MS: 1000 });
            expect(service.eventDelayMs).toBe(1000);
        });

        it('should read custom SCRAPER_LOG_LEVEL and SCRAPER_STALENESS_DAYS', async () => {
            await createTestModule({
                SCRAPER_LOG_LEVEL: 'debug',
                SCRAPER_STALENESS_DAYS: 14,
            });
            expect(service.logLevel).toBe('debug');
            expect(service.stalenessDays).toBe(14);
        });
    });

    describe('shouldLogDebug', () => {
        it('should return true when SCRAPER_LOG_LEVEL is debug', async () => {
            await createTestModule({ SCRAPER_LOG_LEVEL: 'debug' });
            expect(service.shouldLogDebug).toBe(true);
        });

        it('should return true when NODE_ENV is development', async () => {
            await createTestModule({ NODE_ENV: 'development' });
            expect(service.shouldLogDebug).toBe(true);
        });

        it('should return false when NODE_ENV is production and log level is info', async () => {
            await createTestModule({ NODE_ENV: 'production', SCRAPER_LOG_LEVEL: 'info' });
            expect(service.shouldLogDebug).toBe(false);
        });
    });

    describe('getScraperOptions', () => {
        it('should return all options as a single object', async () => {
            await createTestModule({
                DETAIL_TIMEOUT_MS: 12000,
                REG_TIMEOUT_MS: 18000,
                SCRAPER_EVENT_DELAY_MS: 750,
                SCRAPER_STALENESS_DAYS: 5,
                SCRAPER_BATCH_SIZE: 3,
                SCRAPER_CONTEXT_RENEWAL_THRESHOLD: 100,
                SCRAPER_LOG_LEVEL: 'debug',
            });

            const options = service.getScraperOptions();

            expect(options).toEqual({
                detailTimeoutMs: 12000,
                regTimeoutMs: 18000,
                eventDelayMs: 750,
                stalenessDays: 5,
                batchSize: 3,
                contextRenewalThreshold: 100,
                shouldLogDebug: true,
            });
        });
    });
});
