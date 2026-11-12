import { Inject, Injectable, Logger } from '@nestjs/common';
import { AiLogStatus } from '@ats-platform/database';
import { AiUsageLogsService } from '../../../app/ai-usage-logs/ai-usage-logs.service';
import { LLM_OPERATIONS, LlmOperation } from '../../configs/gemini.config';
import { LLM_CLIENT, LlmClient } from './llm.types';

const LLM_TIMEOUT_MS = 120_000;

@Injectable()
export class LlmService {
    private readonly logger = new Logger(LlmService.name);

    constructor(
        @Inject(LLM_CLIENT) private readonly client: LlmClient,
        private readonly aiUsageLogsService: AiUsageLogsService,
    ) {}

    parseCV(refId: string | null, content: string) {
        return this.run('parseCV', refId, content);
    }

    // The organization, where a call has one, goes into the usage log for the cost view (GĐ4 R20).
    parseJD(refId: string | null, rawDescription: string, organizationId: string | null = null) {
        return this.run('parseJD', refId, `<jd_text>\n${rawDescription}\n</jd_text>`, organizationId);
    }

    screeningCV(refId: string | null, content: string, organizationId: string | null = null) {
        return this.run('screeningCV', refId, content, organizationId);
    }

    generateInterviewQuestions(refId: string | null, content: string) {
        return this.run('generateInterviewQuestions', refId, content);
    }

    checkInterviewFollowup(refId: string | null, content: string) {
        return this.run('checkInterviewFollowup', refId, content);
    }

    evaluateInterviewAnswer(refId: string | null, content: string) {
        return this.run('evaluateInterviewAnswer', refId, content);
    }

    generateInterviewResult(refId: string | null, content: string) {
        return this.run('generateInterviewResult', refId, content);
    }

    /** GĐ4 co-pilot: put a suggestion the rules already decided into words. `facts` is JSON. */
    explainSuggestion(refId: string | null, facts: string, organizationId: string | null = null) {
        return this.run('explainSuggestion', refId, `<application_facts>\n${facts}\n</application_facts>`, organizationId);
    }

    // Callers validate the shape of the parsed JSON themselves; this layer only guarantees it parses.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async run(
        operation: LlmOperation,
        refId: string | null,
        content: string,
        organizationId: string | null = null,
    ): Promise<any> {
        const { tier, reasoning, actionType, systemPrompt } = LLM_OPERATIONS[operation];
        const startTime = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

        try {
            this.logger.log(`LLM call started — action: ${actionType}, operation: ${operation}, refId: ${refId}`);

            const result = await this.client.generateJson({
                refId,
                actionType,
                tier,
                reasoning,
                systemPrompt,
                content,
                signal: controller.signal,
            });

            // Parse before recording success: malformed JSON is one failed call.
            const data = JSON.parse(result.text);
            const duration = Math.round(performance.now() - startTime);
            this.logger.log(
                `LLM call completed — action: ${actionType}, operation: ${operation}, refId: ${refId}, duration: ${duration}ms`,
            );

            this.recordUsage({
                refId,
                actionType,
                model: result.model,
                promptTokenCount: result.promptTokens,
                candidatesTokenCount: result.outputTokens,
                duration,
                status: AiLogStatus.success,
                organizationId,
            });

            return data;
        } catch (error) {
            const duration = Math.round(performance.now() - startTime);
            if (controller.signal.aborted) {
                this.logger.error(`LLM call TIMEOUT after ${LLM_TIMEOUT_MS / 1000}s — operation: ${operation}, refId: ${refId}`);
            } else {
                this.logger.error(
                    `LLM call failed — operation: ${operation}, refId: ${refId}`,
                    error instanceof Error ? error.stack : String(error),
                );
            }

            this.recordUsage({
                refId,
                actionType,
                model: this.client.modelFor(tier),
                promptTokenCount: 0,
                candidatesTokenCount: 0,
                duration,
                status: AiLogStatus.failed,
                organizationId,
            });

            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    // Fire and forget: a broken usage log must never fail the AI call.
    private recordUsage(entry: Parameters<AiUsageLogsService['create']>[0]) {
        void Promise.resolve(this.aiUsageLogsService.create(entry)).catch((error) =>
            this.logger.warn(`Failed to record AI usage: ${error?.message}`),
        );
    }
}
