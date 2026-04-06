import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiUsageLogsModule } from '../../../app/ai-usage-logs/ai-usage-logs.module';

@Module({
  imports: [AiUsageLogsModule],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule { }
