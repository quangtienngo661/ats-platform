import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ApplicationsModule } from '../applications/applications.module';
import { InterviewsModule } from '../interviews/interviews.module';
import { InterviewScorecardsController } from './interview-scorecards.controller';
import { InterviewScorecardsService } from './interview-scorecards.service';

@Module({
  imports: [PrismaModule, InterviewsModule, ApplicationsModule],
  controllers: [InterviewScorecardsController],
  providers: [InterviewScorecardsService],
})
export class InterviewScorecardsModule {}
