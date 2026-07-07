import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from '../common/prisma/prisma.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DepartmentsModule } from './departments/departments.module';
import { AdminSeedService } from '../common/prisma/seed/admin-seed.service';
import { JobCategoriesModule } from './job-categories/job-categories.module';
import { SkillsModule } from './skills/skills.module';
import { RecruitersModule } from './recruiters/recruiters.module';
import { JobPostingsModule } from './job-postings/job-postings.module';
import { AiConfigModule } from './ai-config/ai-config.module';
import { CandidatesModule } from './candidates/candidates.module';
import { CVsModule } from './cvs/cvs.module';
import { LocalStorageModule } from '../common/storage/local-storage.module';
import { GeminiModule } from '../common/external-apis/gemini/gemini.module';
import { BullModule } from '@nestjs/bullmq';
import { AiUsageLogsModule } from './ai-usage-logs/ai-usage-logs.module';
import { ApplicationsModule } from './applications/applications.module';
import { CvScreeningsModule } from './cv-screenings/cv-screenings.module';
import { SocketIoModule } from '../common/socket-io/socket-io.module';
import { InterviewsModule } from './interviews/interviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { validate } from '../common/configs/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    RedisModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      global: true,
      signOptions: { expiresIn: '1h' },
    }),
    DepartmentsModule,
    JobCategoriesModule,
    SkillsModule,
    RecruitersModule,
    JobPostingsModule,
    AiConfigModule,
    CandidatesModule,
    CVsModule,
    LocalStorageModule,
    GeminiModule,
    AiUsageLogsModule,
    ApplicationsModule,
    CvScreeningsModule,
    SocketIoModule,
    InterviewsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, AdminSeedService],
})
export class AppModule {}
