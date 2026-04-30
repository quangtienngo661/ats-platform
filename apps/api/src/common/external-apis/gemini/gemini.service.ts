import { Injectable, Logger } from '@nestjs/common';
import { GenerateContentConfig, GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { GeminiModel } from '../../types/enums/gemini-model.enum';
import { AiUsageLogsService } from '../../../app/ai-usage-logs/ai-usage-logs.service';
import { AiActionType, AiLogStatus } from '@ats-platform/database';
import { cvParsingConfig, jdParsingConfig, screeningConfig } from '../../configs/gemini.config';

@Injectable()
export class GeminiService {
    private readonly ai: GoogleGenAI;

    constructor(
        private configService: ConfigService,
        private readonly aiUsageLogsService: AiUsageLogsService
    ) {
        this.ai = new GoogleGenAI({
            apiKey: this.configService.getOrThrow('GOOGLE_API_KEY'),
            // apiKey: this.configService.getOrThrow('KEY_FREE_TIER'),
        });
    }

    async parseCV(
        refId: string,
        content: string,
        model: string = GeminiModel.G_3_Flash
    ) {
        const result = await this.generateContent(
            refId,
            model,
            content,
            AiActionType.cv_parsing,
            cvParsingConfig,
        );
        return result.text;
    }

    async screeningCV(
        refId: string,
        content: string,
        model: string = GeminiModel.G_3_1_Pro,
    ) {
        const result = await this.generateContent(
            refId,
            model,
            content,
            AiActionType.cv_scoring,
            screeningConfig
        );

        return result.text;
    }

    async parseJD(
        refId: string,
        rawDescription: string,
        model: string = GeminiModel.G_3_Flash
    ) {
        const result = await this.generateContent(
            refId,
            model,
            rawDescription,
            AiActionType.job_parsing,
            jdParsingConfig
        );

        return result.text;
    }

    // General function
    private async generateContent(
        refId: string,
        model: string,
        content: string,
        actionType: AiActionType,
        config?: GenerateContentConfig,
    ) {
        const startTime = performance.now();

        const timeoutStr = 30000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutStr);

        try {
            Logger.log(
                `Gemini API call started — action: ${actionType}, refId: ${refId}`,
                'GeminiService',
            );

            const finalConfig = { ...config, abortSignal: controller.signal };

            const response = await this.ai.models.generateContent({
                model,
                contents: content,
                config: finalConfig
            });

            clearTimeout(timeoutId);

            const duration = Math.round(performance.now() - startTime);
            Logger.log(
                `Gemini API call completed — action: ${actionType}, refId: ${refId}, duration: ${duration}ms`,
                'GeminiService',
            );
            // return { text: "Hello world" }
            const { promptTokenCount, candidatesTokenCount } = response.usageMetadata;

            void this.aiUsageLogsService.create({
                refId,
                actionType,
                model,
                promptTokenCount,
                candidatesTokenCount,
                duration,
                status: AiLogStatus.success,
            });

            return {
                text: JSON.parse(response.text),
            };

        } catch (error) {
            clearTimeout(timeoutId);
            const duration = Math.round(performance.now() - startTime);
            // 3. Nếu lỗi là do Timeout (AbortError), hoặc do Rate Limit
            if (error.name === 'AbortError') {
                Logger.error(`Gemini API TIMEOUT after 15s. BullMQ will retry this job...`, 'GeminiService');
            } else {
                Logger.error(`Gemini API ERROR. BullMQ will retry this job...`, error.stack, 'GeminiService');
            }

            void this.aiUsageLogsService.create({
                refId,
                actionType,
                model,
                promptTokenCount: 0,
                candidatesTokenCount: 0,
                duration,
                status: AiLogStatus.failed,
            });

            Logger.error(
                `Gemini API call failed — action: ${actionType}, refId: ${refId}`,
                error.stack,
                'GeminiService',
            );

            throw error;
        }
    }
}
