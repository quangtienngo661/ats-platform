import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
    LlmClient,
    LlmReasoning,
    LlmRequest,
    LlmResult,
    LlmTier,
} from './llm.types';

const GEMINI_MODELS: Record<LlmTier, string> = {
    pro: 'gemini-3.1-pro-preview',
    flash: 'gemini-3.5-flash',
};

const THINKING_LEVELS: Record<LlmReasoning, ThinkingLevel> = {
    medium: ThinkingLevel.MEDIUM,
    high: ThinkingLevel.HIGH,
};

@Injectable()
export class GeminiClient implements LlmClient {
    private readonly ai: GoogleGenAI;

    constructor(private readonly configService: ConfigService) {
        this.ai = new GoogleGenAI({
            apiKey: this.configService.getOrThrow('GOOGLE_API_KEY'),
        });
    }

    async generateJson(req: LlmRequest): Promise<LlmResult> {
        const model = GEMINI_MODELS[req.tier];

        const response = await this.ai.models.generateContent({
            model,
            contents: req.content,
            config: {
                responseMimeType: 'application/json',
                systemInstruction: req.systemPrompt,
                thinkingConfig: {
                    thinkingLevel: THINKING_LEVELS[req.reasoning],
                },
                abortSignal: req.signal,
            },
        });

        const {
            promptTokenCount = 0,
            candidatesTokenCount = 0,
            thoughtsTokenCount = 0,
        } = response.usageMetadata ?? {};

        return {
            text: response.text ?? '',
            model,
            promptTokens: promptTokenCount,
            outputTokens: candidatesTokenCount + thoughtsTokenCount,
        };
    }
}
