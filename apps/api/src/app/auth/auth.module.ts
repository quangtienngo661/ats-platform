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
    BullModule.registerQueue({
      name: 'send-verification-email',
      defaultJobOptions: { removeOnComplete: true },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
  ],
})
export class AuthModule implements OnModuleInit {
  constructor(@InjectQueue('send-verification-email') private readonly queue: Queue) { }

  async onModuleInit() {
    await this.queue.setGlobalRateLimit(30, 60000);
  }
}
