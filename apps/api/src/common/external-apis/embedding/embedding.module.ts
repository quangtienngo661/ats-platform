import { Module } from '@nestjs/common';
import { AiUsageLogsModule } from '../../../app/ai-usage-logs/ai-usage-logs.module';
import { EmbeddingService } from './embedding.service';

@Module({
    imports: [AiUsageLogsModule],
    providers: [EmbeddingService],
    exports: [EmbeddingService],
})
export class EmbeddingModule {}
