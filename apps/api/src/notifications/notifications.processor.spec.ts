import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { Job } from 'bullmq';

describe('NotificationsProcessor', () => {
    let processor: NotificationsProcessor;
    let notificationsService: NotificationsService;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsProcessor,
                {
                    provide: NotificationsService,
                    useValue: {
                        sendNotification: jest.fn().mockResolvedValue({ success: true }),
                    },
                },
                {
                    provide: PrismaService,
                    useValue: {
                        pushSubscription: {
                            findMany: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        processor = module.get<NotificationsProcessor>(NotificationsProcessor);
        notificationsService = module.get<NotificationsService>(NotificationsService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(processor).toBeDefined();
    });

    describe('process', () => {
        it('should process send-push-notification jobs', async () => {
            const job = {
                name: 'send-push-notification',
                data: {
                    eventId: '1',
                    eventTitle: 'Corrida Teste',
                    eventDate: new Date(),
                    eventCity: 'João Pessoa',
                    eventState: 'PB',
                },
            } as Job;

            const subscriptions = [
                { endpoint: 'sub1', keys: {}, statePreferences: ['PB'] },
                { endpoint: 'sub2', keys: {}, statePreferences: ['PB', 'PE'] },
            ];

            (prismaService.pushSubscription.findMany as jest.Mock).mockResolvedValue(subscriptions);

            await processor.process(job);

            expect(prismaService.pushSubscription.findMany).toHaveBeenCalledWith({
                where: {
                    statePreferences: {
                        has: 'PB',
                    },
                },
            });

            expect(notificationsService.sendNotification).toHaveBeenCalledTimes(2);
        });

        it('should ignore unknown job names', async () => {
            const job = {
                name: 'unknown-job',
                data: {},
            } as Job;

            await processor.process(job);

            expect(prismaService.pushSubscription.findMany).not.toHaveBeenCalled();
        });
    });
});
