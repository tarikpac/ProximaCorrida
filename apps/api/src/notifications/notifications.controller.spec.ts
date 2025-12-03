import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    upsertSubscription: jest.fn(),
    getPreferences: jest.fn(),
    sendTestNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should subscribe a user', async () => {
    const subscriptionDto = {
      endpoint: 'test-endpoint',
      keys: { p256dh: 'key', auth: 'auth' },
      statePreferences: ['PB'],
    };

    mockNotificationsService.upsertSubscription.mockResolvedValue({
      id: '1',
      ...subscriptionDto,
    });

    const result = await controller.subscribe(subscriptionDto);

    expect(result).toEqual(
      expect.objectContaining({ endpoint: 'test-endpoint' }),
    );
    expect(mockNotificationsService.upsertSubscription).toHaveBeenCalledWith(
      subscriptionDto,
    );
  });

  it('should get preferences', async () => {
    const body = { endpoint: 'test-endpoint' };
    mockNotificationsService.getPreferences.mockResolvedValue(['PB', 'PE']);

    const result = await controller.getPreferences(body);

    expect(result).toEqual(['PB', 'PE']);
    expect(mockNotificationsService.getPreferences).toHaveBeenCalledWith(
      'test-endpoint',
    );
  });
});
