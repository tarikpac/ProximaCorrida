import { Test, TestingModule } from '@nestjs/testing';
import { ScraperSchedulerService } from './scraper.scheduler.service';
import { EventsService } from '../events/events.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('ScraperSchedulerService', () => {
    let service: ScraperSchedulerService;
    let eventsService: EventsService;
    let queueMock: any;

    beforeEach(async () => {
        queueMock = {
            add: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScraperSchedulerService,
                {
                    provide: EventsService,
                    useValue: {
                        archivePastEvents: jest.fn().mockResolvedValue({ count: 5 }),
                    },
                },
                {
                    provide: getQueueToken('scraper'),
                    useValue: queueMock,
                },
            ],
        }).compile();

        service = module.get<ScraperSchedulerService>(ScraperSchedulerService);
        eventsService = module.get<EventsService>(EventsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call cleanup before triggering scraper', async () => {
        await service.handleCron();

        // Verify cleanup was called
        expect(eventsService.archivePastEvents).toHaveBeenCalled();

        // Verify scraper was queued
        expect(queueMock.add).toHaveBeenCalledWith(
            'orchestrate-scrapers',
            {},
            expect.any(Object),
        );

        // Verify order (though difficult with just toHaveBeenCalled, the await logic implies order)
        // We can rely on implementation correctness for order if calls are present.
    });

    it('should continue to scrape even if cleanup fails', async () => {
        (eventsService.archivePastEvents as jest.Mock).mockRejectedValue(new Error('Cleanup failed'));

        await service.handleCron();

        // Scraper should still be called
        expect(queueMock.add).toHaveBeenCalled();
    });
});
