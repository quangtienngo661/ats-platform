import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiUsageLogsService } from 'apps/api/src/app/ai-usage-logs/ai-usage-logs.service';
import { AiUsageLogsModule } from 'apps/api/src/app/ai-usage-logs/ai-usage-logs.module';

@Module({
  imports: [AiUsageLogsModule],
  providers: [GeminiService, AiUsageLogsService],
  exports: [GeminiService],
})
export class GeminiModule {}
