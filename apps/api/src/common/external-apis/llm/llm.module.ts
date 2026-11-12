import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiUsageLogsModule } from '../../../app/ai-usage-logs/ai-usage-logs.module';
import { GeminiClient } from './gemini.client';
import { LlmService } from './llm.service';
import { LLM_CLIENT, LlmClient } from './llm.types';
import { OpenAiClient } from './openai.client';

// Only the selected client is built: each one demands its own API key at construction.
export function createLlmClient(configService: ConfigService): LlmClient {
    return configService.get('AI_PROVIDER') === 'openai'
        ? new OpenAiClient(configService)
        : new GeminiClient(configService);
}

@Module({
    imports: [AiUsageLogsModule],
    providers: [
        { provide: LLM_CLIENT, useFactory: createLlmClient, inject: [ConfigService] },
        LlmService,
    ],
    exports: [LlmService],
})
export class LlmModule {}
