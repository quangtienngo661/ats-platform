import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LlmModule } from '../../common/external-apis/llm/llm.module';
import { ApplicationsModule } from '../applications/applications.module';
import { CopilotController } from './copilot.controller';
import { CopilotService } from './copilot.service';

@Module({
  imports: [PrismaModule, LlmModule, ApplicationsModule],
  controllers: [CopilotController],
  providers: [CopilotService],
})
export class CopilotModule {}
