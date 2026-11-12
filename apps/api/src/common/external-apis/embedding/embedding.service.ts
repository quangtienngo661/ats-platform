import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiActionType, AiLogStatus } from '@ats-platform/database';
import { OpenAI } from 'openai';
import { AiUsageLogsService } from '../../../app/ai-usage-logs/ai-usage-logs.service';

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

// OpenAI accepts at most 2048 inputs per embeddings request (see research.md).
const EMBEDDING_MAX_BATCH = 2048;
const EMBEDDING_TIMEOUT_MS = 120_000;

@Injectable()
export class EmbeddingService {
    private readonly logger = new Logger(EmbeddingService.name);
    private client: OpenAI | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly aiUsageLogsService: AiUsageLogsService,
    ) {}

    /** Embeds `texts` and returns one vector per text, in input order. */
    async embed(refId: string | null, texts: string[], organizationId: string | null = null): Promise<number[][]> {
        if (texts.length === 0) return [];

        const client = this.getClient();
        const vectors: number[][] = [];

        for (let start = 0; start < texts.length; start += EMBEDDING_MAX_BATCH) {
            const batch = texts.slice(start, start + EMBEDDING_MAX_BATCH);
            vectors.push(...(await this.embedBatch(client, refId, batch, organizationId)));
        }

        return vectors;
    }

    // Created lazily: with AI_PROVIDER=gemini the key may legitimately be absent
    // until something actually needs an embedding.
    private getClient(): OpenAI {
        if (!this.client) {
            let apiKey: string;
            try {
                apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
            } catch {
                throw new Error('OPENAI_API_KEY is required for embeddings but is not set');
            }
            // BullMQ is the only retry layer, so the SDK must not retry on its own.
            this.client = new OpenAI({ apiKey, maxRetries: 0, timeout: EMBEDDING_TIMEOUT_MS });
        }
        return this.client;
    }

    private async embedBatch(
        client: OpenAI,
        refId: string | null,
        batch: string[],
        organizationId: string | null,
    ): Promise<number[][]> {
        const startTime = performance.now();

        try {
            const response = await client.embeddings.create({
                model: EMBEDDING_MODEL,
                input: batch,
                dimensions: EMBEDDING_DIMENSIONS,
                encoding_format: 'float',
            });

            const vectors = [...response.data]
                .sort((a, b) => a.index - b.index)
                .map((item) => item.embedding);

            this.recordUsage(refId, response.usage?.prompt_tokens ?? 0, startTime, AiLogStatus.success, organizationId);
            return vectors;
        } catch (error) {
            this.logger.error(
                `Embedding call failed — refId: ${refId}, inputs: ${batch.length}`,
                error instanceof Error ? error.stack : String(error),
            );
            this.recordUsage(refId, 0, startTime, AiLogStatus.failed, organizationId);
            throw error;
        }
    }

    // Fire and forget: a broken usage log must never fail the embedding call.
    private recordUsage(
        refId: string | null,
        promptTokens: number,
        startTime: number,
        status: AiLogStatus,
        organizationId: string | null,
    ) {
        void Promise.resolve(
            this.aiUsageLogsService.create({
                refId,
                actionType: AiActionType.embedding,
                model: EMBEDDING_MODEL,
                promptTokenCount: promptTokens,
                candidatesTokenCount: 0,
                duration: Math.round(performance.now() - startTime),
                status,
                organizationId,
            }),
        ).catch((error) => this.logger.warn(`Failed to record AI usage: ${error?.message}`));
    }
}
