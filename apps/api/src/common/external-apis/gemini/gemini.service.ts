import { Injectable, Logger } from '@nestjs/common';
import { GenerateContentConfig, GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { GeminiModel } from '../../types/enums/gemini-model.enum';
import { AiUsageLogsService } from '../../../app/ai-usage-logs/ai-usage-logs.service';
import { AiActionType, AiLogStatus } from '@ats-platform/database';
import { cvParsingConfig, jdParsingConfig } from '../../configs/gemini.config';
// import { jdParsingConfig } from '../../configs/gemini.config';

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
        prompt: string,
        content: string,
        model: string = GeminiModel.G_3_Flash
    ) {
        const result = await this.generateContent(
            refId,
            model,
            content,
            AiActionType.cv_parsing,
            cvParsingConfig,
            prompt,
        );
        return result.text;
    }

    // async screeningCV(
    //     refId: string,
    //     model: string = GeminiModel.G_3_Flash,
    //     prompt: string,
    //     content: string
    // ) {
    //     const result = await this.generateContent(
    //         refId,
    //         model,
    //         prompt,
    //         content,
    //         AiActionType.cv_scoring
    //     );
    //     return result.text;
    // }

    async parseJD(
        refId: string,
        // prompt: string,
        rawDescription: string,
        model: string = GeminiModel.G_3_Flash
    ) {
        const result = await this.generateContent(
            refId,
            model,
            rawDescription,
            AiActionType.job_parsing,
            jdParsingConfig
            // prompt,
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
        prompt?: string,
    ) {
        const startTime = performance.now();

        // 1. Khai báo Timeout Controller (30 giây để xử lý CV parsing dài)
        const timeoutStr = 20000; // TODO: change the timeout into 30s when using paid gemini
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutStr);

        try {
            Logger.log(
                `Gemini API call started — action: ${actionType}, refId: ${refId}`,
                'GeminiService',
            );

            const finalConfig = { ...config, abortSignal: controller.signal };

            // console.log(content);
            const response = await this.ai.models.generateContent({
                model,
                // contents: prompt ? `${prompt}\n\nPDF raw text:\n${content}` : content,
                // contents: `${prompt}\n\nPDF raw text:\n${content}`,
                contents: content,
                // config: { abortSignal: controller.signal }
                config: finalConfig
            });

            clearTimeout(timeoutId);

            const duration = Math.round(performance.now() - startTime);
            Logger.log(
                `Gemini API call completed — action: ${actionType}, refId: ${refId}, duration: ${duration}ms`,
                'GeminiService',
            );
            // return { text: "Hello world" }
            const { promptTokenCount, candidatesTokenCount, toolUsePromptTokenCount, toolUsePromptTokensDetails } = response.usageMetadata;
            // console.log(response.text)
            console.log(response.usageMetadata)
            // console.log(promptTokenCount, candidatesTokenCount, response.usageMetadata.toolUsePromptTokenCount)
            // console.log(response.usageMetadata.toolUsePromptTokensDetails)
            console.log('==============')

            void this.aiUsageLogsService.create({
                refId,
                actionType,
                model,
                promptTokenCount,
                candidatesTokenCount,
                duration,
                status: AiLogStatus.success,
            });

            // console.log(response.text)

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

    private parseJsonResponse(text: string): object {
        try {
            const cleaned = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            return JSON.parse(cleaned);
        } catch {
            throw new Error(`Invalid JSON response from Gemini: ${text}`);
        }
    }
}
