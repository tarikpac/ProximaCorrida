import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();
console.log('After dotenv config. DATABASE_URL:', process.env.DATABASE_URL);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('Main bootstrap. DATABASE_URL:', process.env.DATABASE_URL);
  app.enableCors({
    origin: '*', // Allow all origins for development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
