import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { LlmClient, LlmRequest, LlmResult, LlmTier } from './llm.types';

const DEFAULT_MODEL_PRO = 'gpt-6.1-sol';
const DEFAULT_MODEL_FLASH = 'gpt-6-luna';

@Injectable()
export class OpenAiClient implements LlmClient {
    private readonly ai: OpenAI;
    private readonly modelPro: string;
    private readonly modelFlash: string;

    constructor(private readonly configService: ConfigService) {
        // BullMQ is the only retry layer, so the SDK must not retry on its own.
        this.ai = new OpenAI({
            apiKey: this.configService.getOrThrow('OPENAI_API_KEY'),
            maxRetries: 0,
        });
        this.modelPro =
            this.configService.get<string>('OPENAI_MODEL_PRO') ||
            DEFAULT_MODEL_PRO;
        this.modelFlash =
            this.configService.get<string>('OPENAI_MODEL_FLASH') ||
            DEFAULT_MODEL_FLASH;
    }

    modelFor(tier: LlmTier): string {
        return tier === 'pro' ? this.modelPro : this.modelFlash;
    }

    async generateJson(req: LlmRequest): Promise<LlmResult> {
        const model = this.modelFor(req.tier);

        const response = await this.ai.responses.create(
            {
                model,
                instructions: req.systemPrompt,
                input: req.content,
                text: { format: { type: 'json_object' } },
                reasoning: { effort: req.reasoning },
            },
            { signal: req.signal },
        );

        return {
            text: response.output_text ?? '',
            model,
            promptTokens: response.usage?.input_tokens ?? 0,
            // output_tokens already includes reasoning_tokens (see research.md #3).
            outputTokens: response.usage?.output_tokens ?? 0,
        };
    }
}
