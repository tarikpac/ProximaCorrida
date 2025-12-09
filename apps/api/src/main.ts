import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Production CORS configuration with whitelist
  const allowedOrigins = [
    'https://proximacorrida.com.br',
    'https://www.proximacorrida.com.br',
    'https://proxima-corrida.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  const corsOriginHandler = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow if in whitelist, Vercel preview, or localhost (dev)
    if (
      allowedOrigins.includes(origin) ||
      origin.includes('vercel.app') ||
      origin.includes('localhost')
    ) {
      callback(null, true);
    } else {
      // Log blocked origins for debugging, but allow for now
      console.warn(`CORS: Origin not in whitelist: ${origin}`);
      callback(null, true);
    }
  };

  app.enableCors({
    origin: corsOriginHandler,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on port ${port}`);
}

bootstrap();

