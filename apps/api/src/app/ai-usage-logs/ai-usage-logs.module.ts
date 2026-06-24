import { Module } from '@nestjs/common';
import { AiUsageLogsService } from './ai-usage-logs.service';
import { AiUsageLogsController } from './ai-usage-logs.controller';

@Module({
  controllers: [AiUsageLogsController],
  providers: [AiUsageLogsService],
  exports: [AiUsageLogsService],
})
export class AiUsageLogsModule {}
