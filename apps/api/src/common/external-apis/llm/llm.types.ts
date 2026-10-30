import { AiActionType } from '@ats-platform/database';

export type LlmTier = 'pro' | 'flash';
export type LlmReasoning = 'medium' | 'high';

export interface LlmRequest {
    refId: string | null;
    actionType: AiActionType;
    tier: LlmTier;
    reasoning: LlmReasoning;
    systemPrompt: string;
    content: string;
    signal: AbortSignal;
}

export interface LlmResult {
    /** Raw text from the provider; JSON parsing is LlmService's job. */
    text: string;
    model: string;
    promptTokens: number;
    /** Answer tokens plus reasoning/thinking tokens (the billed part). */
    outputTokens: number;
}

export interface LlmClient {
    generateJson(req: LlmRequest): Promise<LlmResult>;
}

export const LLM_CLIENT = Symbol('LLM_CLIENT');
