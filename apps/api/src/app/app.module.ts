import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DepartmentsModule } from './departments/departments.module';
import { AdminSeedService } from './seed/admin-seed.service';
import { JobCategoriesModule } from './job-categories/job-categories.module';
import { SkillsModule } from './skills/skills.module';
import { RecruitersModule } from './recruiters/recruiters.module';
import { JobPostingsModule } from './job-postings/job-postings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, AdminSeedService],
})
export class AppModule {}
