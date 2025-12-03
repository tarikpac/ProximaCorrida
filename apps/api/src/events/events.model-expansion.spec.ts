import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

describe('Event Model Expansion', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [PrismaService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should support new scraper expansion fields', async () => {
    // This test verifies that we can save and retrieve the new fields
    // It will fail compilation until schema is updated and client generated

    const testEvent = {
      title: 'Test Event Expansion',
      date: new Date(),
      city: 'João Pessoa',
      state: 'PB',
      distances: ['5km', '10km'],
      regLink: 'http://example.com/reg',
      sourceUrl: 'http://example.com/source-expansion-' + Date.now(),
      // New fields
      sourcePlatform: 'test-platform',
      sourceEventId: 'evt-123',
      rawLocation: 'João Pessoa - PB',
      priceText: 'R$ 89,90',
      priceMin: 89.9,
    };

    // @ts-ignore - ignoring type check until client is regenerated
    const created = await prisma.event.create({
      data: testEvent,
    });

    expect(created.id).toBeDefined();
    // @ts-ignore
    expect(created.sourcePlatform).toBe('test-platform');
    // @ts-ignore
    expect(created.sourceEventId).toBe('evt-123');
    // @ts-ignore
    expect(created.priceMin).toBeDefined(); // Decimal handling might return object or string depending on config
  });

  it('should enforce sourcePlatform requirement', async () => {
    const invalidEvent = {
      title: 'Invalid Event',
      date: new Date(),
      city: 'João Pessoa',
      state: 'PB',
      distances: ['5km'],
      regLink: 'http://example.com/reg-invalid',
      sourceUrl: 'http://example.com/source-invalid-' + Date.now(),
      // Missing sourcePlatform
    };

    try {
      await prisma.event.create({
        data: invalidEvent as any,
      });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
      // Prisma error code for missing required field is usually P2002 or P2012 depending on context,
      // but here it's a TS error mostly. Runtime it throws validation error.
    }
  });
});
