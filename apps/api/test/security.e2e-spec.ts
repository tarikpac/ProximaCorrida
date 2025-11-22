import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ApiKeyGuard } from '../src/common/guards/api-key.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from '../src/prisma/prisma.service';
import { APP_GUARD } from '@nestjs/core';

// Mock Controller to test Guards and Filters
@Controller('test-security')
class TestSecurityController {
    @Get('error-500')
    throwError() {
        throw new Error('Secret Database Error');
    }

    @Get('error-400')
    throwHttpError() {
        throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    }

    @Get('protected')
    @UseGuards(ApiKeyGuard)
    protectedRoute() {
        return { message: 'Access Granted' };
    }

    @Get('throttled')
    // ThrottlerGuard is usually global, but we can test it here if it's applied globally
    throttledRoute() {
        return { message: 'Throttled Route' };
    }
}

describe('Security Features (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        process.env.INTERNAL_API_KEY = 'test-secret-key';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            ],
            controllers: [TestSecurityController],
            providers: [
                {
                    provide: APP_GUARD,
                    useClass: ThrottlerGuard,
                }
            ]
        }).compile();

        app = moduleFixture.createNestApplication();

        // Register Global Filter
        const { GlobalExceptionFilter } = require('../src/common/filters/http-exception.filter');
        app.useGlobalFilters(new GlobalExceptionFilter());

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Global Exception Filter', () => {
        it('should mask 500 errors and not leak stack trace', async () => {
            const response = await request(app.getHttpServer())
                .get('/test-security/error-500')
                .expect(500);

            expect(response.body).toEqual({
                statusCode: 500,
                message: 'Internal Server Error',
                timestamp: expect.any(String),
                path: '/test-security/error-500',
            });
            // Ensure no stack trace or original error message
            expect(JSON.stringify(response.body)).not.toContain('Secret Database Error');
        });

        it('should pass through 400 errors correctly', async () => {
            const response = await request(app.getHttpServer())
                .get('/test-security/error-400')
                .expect(400);

            expect(response.body).toMatchObject({
                statusCode: 400,
                message: 'Bad Request',
            });
        });
    });

    describe('API Key Guard', () => {
        it('should block requests without api key', async () => {
            await request(app.getHttpServer())
                .get('/test-security/protected')
                .expect(401);
        });

        it('should block requests with invalid api key', async () => {
            await request(app.getHttpServer())
                .get('/test-security/protected')
                .set('x-api-key', 'wrong-key')
                .expect(401);
        });

        it('should allow requests with valid api key', async () => {
            await request(app.getHttpServer())
                .get('/test-security/protected')
                .set('x-api-key', 'test-secret-key')
                .expect(200)
                .expect({ message: 'Access Granted' });
        });
    });

    describe('Rate Limiting', () => {
        // Note: Testing rate limiting in e2e can be tricky due to time/counters.
        // We verify headers are present to ensure module is active.
        it('should have rate limit headers', async () => {
            const response = await request(app.getHttpServer())
                .get('/test-security/throttled')
                .expect(200);

            // console.log('Headers:', response.headers);
            // Headers are lowercased by Node.js
            expect(response.headers['x-ratelimit-limit']).toBeDefined();
            expect(response.headers['x-ratelimit-remaining']).toBeDefined();
            expect(response.headers['x-ratelimit-reset']).toBeDefined();
        });
    });
});
