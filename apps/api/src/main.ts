/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'dotenv/config';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL
      : 'http://localhost:3000',
    credentials: true,
  });
  const port = process.env.SERVER_PORT || 5000;

  const config = new DocumentBuilder()
    .setTitle('AI Recruitment Platform (ATS) API')
    .setDescription('Tài liệu API cho hệ thống tuyển dụng và Mock Interview')
    .setVersion('1.0')
    .addBearerAuth() // Để sử dụng JWT Token trên giao diện Swagger
    .build();

  // TODO: FINSIH API DOCUMENTATION FOR ALL ENDPOINTS
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
