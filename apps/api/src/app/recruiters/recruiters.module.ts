import { Module } from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { RecruitersController } from './recruiters.controller';

@Module({
  controllers: [RecruitersController],
  providers: [RecruitersService],
})
export class RecruitersModule {}
