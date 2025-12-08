import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import { Context, Handler } from 'aws-lambda';
import express from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

let cachedServer: Handler;

/**
 * Bootstrap NestJS application for Lambda execution.
 * Unlike main.ts, this does NOT call app.listen() - Lambda handles HTTP.
 */
async function bootstrap(): Promise<Handler> {
    if (cachedServer) {
        return cachedServer;
    }

    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter, {
        logger: ['error', 'warn', 'log'],
    });

    // Configure CORS for production
    const allowedOrigins = [
        'https://proximacorrida.com.br',
        'https://www.proximacorrida.com.br',
        'https://proxima-corrida.vercel.app',
        process.env.FRONTEND_URL,
    ].filter(Boolean) as string[];

    // Also allow Vercel preview deployments
    const corsOriginHandler = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // Check if it's an allowed origin or a Vercel preview URL
        if (allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('localhost')) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for now, can restrict later
        }
    };

    app.enableCors({
        origin: corsOriginHandler,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
    });

    // Apply same pipes and filters as main.ts
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();

    cachedServer = serverlessExpress({ app: expressApp });
    return cachedServer;
}

/**
 * Lambda handler function.
 * This is the entry point for AWS Lambda invocations.
 */
export const handler: Handler = async (event: any, context: Context, callback: any) => {
    // Optimize for Lambda: don't wait for event loop to be empty
    context.callbackWaitsForEmptyEventLoop = false;

    const server = await bootstrap();
    return server(event, context, callback);
};
