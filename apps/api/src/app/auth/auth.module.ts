import { Module, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import dotenv from 'dotenv';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../../common/mail/mail.module';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';
import { RedisThrottlerStorage } from '../../common/redis/redis-throttler.storage';

dotenv.config();

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule,
    // JwtModule.register({
    //   secret: process.env.JWT_SECRET,
    //   signOptions: { expiresIn: '1h' },
    // }),
    // No `defaultJobOptions` here on purpose — it would replace, not extend, the
    // global defaults in app.module.ts (attempts/backoff/removeOnComplete).
    BullModule.registerQueue({ name: 'send-verification-email' }),
    // Counters live in Redis, not in process memory: the in-memory default resets
    // the rate limit on every restart and isn't shared across instances.
    ThrottlerModule.forRootAsync({
      inject: ['REDIS_CLIENT'],
      useFactory: (redis: Redis) => ({
        throttlers: [{ ttl: 60000, limit: 5 }],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule implements OnModuleInit {
  constructor(
    @InjectQueue('send-verification-email') private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    await this.queue.setGlobalRateLimit(30, 60000);
  }
}
