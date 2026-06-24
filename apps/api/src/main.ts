import 'dotenv/config';

import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

const VALIDATION_MESSAGES: Record<string, string> = {
  whitelistValidation: 'không được phép gửi lên',
  isEmail: 'phải là email hợp lệ',
  isStrongPassword: 'phải có ít nhất 8 ký tự, gồm chữ thường, chữ hoa, số và ký tự đặc biệt',
  isString: 'phải là chuỗi',
  isNotEmpty: 'không được để trống',
  minLength: 'không đủ độ dài tối thiểu',
  isEnum: 'không thuộc giá trị hợp lệ',
  isUUID: 'phải là UUID hợp lệ',
  isBoolean: 'phải là true hoặc false',
  isNumber: 'phải là số',
  min: 'nhỏ hơn giá trị tối thiểu cho phép',
  max: 'lớn hơn giá trị tối đa cho phép',
  isInt: 'phải là số nguyên',
  isObject: 'phải là object hợp lệ',
  isIn: 'không thuộc danh sách giá trị hợp lệ',
  isJSON: 'phải là JSON hợp lệ',
  isDateString: 'phải là ngày giờ hợp lệ',
};

function collectValidationMessages(errors: ValidationError[], parentPath = ''): string[] {
  return errors.flatMap((error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const constraints = error.constraints
      ? Object.keys(error.constraints).map((constraintName) => {
        const translated = VALIDATION_MESSAGES[constraintName] ?? 'không hợp lệ';
        return `${path} ${translated}`;
      })
      : [];

    return [
      ...constraints,
      ...collectValidationMessages(error.children ?? [], path),
    ];
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => {
      const messages = collectValidationMessages(errors);
      return new BadRequestException(
        messages.length
          ? `Dữ liệu không hợp lệ: ${messages.join('; ')}`
          : 'Dữ liệu gửi lên không hợp lệ',
      );
    },
  }));
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
    .addBearerAuth()
    .build();

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter())


  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
