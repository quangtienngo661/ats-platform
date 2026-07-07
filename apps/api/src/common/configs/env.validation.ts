import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

/**
 * Fail-fast validation of environment variables at application bootstrap.
 * Wired into `ConfigModule.forRoot({ validate })` so the process crashes on
 * startup — with a clear list of what's wrong — instead of deferring config
 * errors to the first request that happens to read the bad variable.
 *
 * Only variables the API actually reads are declared here. Variables that
 * have a runtime default or self-guard (SERVER_PORT, ADMIN_*, EMAIL_VERIFICATION_*)
 * are intentionally not required.
 */
class EnvironmentVariables {
  @IsNotEmpty()
  @IsString()
  DATABASE_URL!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(16, { message: 'JWT_SECRET phải dài ít nhất 16 ký tự' })
  JWT_SECRET!: string;

  @IsNotEmpty()
  @IsString()
  GOOGLE_API_KEY!: string;

  @IsNotEmpty()
  @IsString()
  REDIS_HOST!: string;

  @IsNotEmpty()
  @IsNumberString({}, { message: 'REDIS_PORT phải là số' })
  REDIS_PORT!: string;

  @IsNotEmpty()
  @IsString()
  CLIENT_URL!: string;

  @IsIn(['development', 'production', 'test'], {
    message: 'NODE_ENV phải là development, production hoặc test',
  })
  NODE_ENV!: string;

  @IsOptional()
  @IsNumberString({}, { message: 'SERVER_PORT phải là số' })
  SERVER_PORT?: string;

  // SMTP chỉ bắt buộc khi bật gửi mail
  @IsOptional()
  @IsString()
  SMTP_ENABLED?: string;

  @ValidateIf((o) => o.SMTP_ENABLED === 'true')
  @IsNotEmpty()
  @IsString()
  SMTP_HOST?: string;

  @ValidateIf((o) => o.SMTP_ENABLED === 'true')
  @IsNotEmpty()
  @IsNumberString({}, { message: 'SMTP_PORT phải là số' })
  SMTP_PORT?: string;

  @ValidateIf((o) => o.SMTP_ENABLED === 'true')
  @IsNotEmpty()
  @IsString()
  SMTP_USER?: string;

  @ValidateIf((o) => o.SMTP_ENABLED === 'true')
  @IsNotEmpty()
  @IsString()
  SMTP_PASS?: string;

  @ValidateIf((o) => o.SMTP_ENABLED === 'true')
  @IsNotEmpty()
  @IsString()
  SMTP_FROM?: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Env validation thất bại:\n  - ${messages}`);
  }

  // Trả về config gốc (không phải instance) để giữ nguyên mọi biến khác cho ConfigService.
  return config;
}
