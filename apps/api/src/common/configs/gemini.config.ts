import { AiActionType } from "@ats-platform/database";
import {
    COPILOT_EXPLAIN_PROMPT,
    CV_PARSING_PROMPT,
    CV_SCREENING_PROMPT,
    JD_PARSING_PROMPT,
    MOCK_INTERVIEW_EVALUATE_PROMPT,
    MOCK_INTERVIEW_FOLLOWUP_PROMPT,
    MOCK_INTERVIEW_GENERATE_PROMPT,
    MOCK_INTERVIEW_RESULT_PROMPT,
} from "../constants/gemini-api";
import { LlmReasoning, LlmTier } from "../external-apis/llm/llm.types";

// Provider-neutral table used by LlmService: which model tier, reasoning level,
// usage-log action type and system prompt each AI operation runs with.
export type LlmOperation =
    | 'parseCV'
    | 'parseJD'
    | 'screeningCV'
    | 'generateInterviewQuestions'
    | 'checkInterviewFollowup'
    | 'evaluateInterviewAnswer'
    | 'generateInterviewResult'
    | 'explainSuggestion';

export interface LlmOperationConfig {
    tier: LlmTier;
    reasoning: LlmReasoning;
    actionType: AiActionType;
    systemPrompt: string;
}

export const LLM_OPERATIONS: Record<LlmOperation, LlmOperationConfig> = {
    parseCV: { tier: 'flash', reasoning: 'medium', actionType: AiActionType.cv_parsing, systemPrompt: CV_PARSING_PROMPT },
    parseJD: { tier: 'flash', reasoning: 'medium', actionType: AiActionType.job_parsing, systemPrompt: JD_PARSING_PROMPT },
    screeningCV: { tier: 'pro', reasoning: 'high', actionType: AiActionType.cv_scoring, systemPrompt: CV_SCREENING_PROMPT },
    generateInterviewQuestions: { tier: 'pro', reasoning: 'high', actionType: AiActionType.mock_interview, systemPrompt: MOCK_INTERVIEW_GENERATE_PROMPT },
    checkInterviewFollowup: { tier: 'flash', reasoning: 'high', actionType: AiActionType.mock_interview, systemPrompt: MOCK_INTERVIEW_FOLLOWUP_PROMPT },
    evaluateInterviewAnswer: { tier: 'flash', reasoning: 'high', actionType: AiActionType.mock_interview, systemPrompt: MOCK_INTERVIEW_EVALUATE_PROMPT },
    generateInterviewResult: { tier: 'pro', reasoning: 'high', actionType: AiActionType.mock_interview, systemPrompt: MOCK_INTERVIEW_RESULT_PROMPT },
    explainSuggestion: { tier: 'flash', reasoning: 'medium', actionType: AiActionType.copilot, systemPrompt: COPILOT_EXPLAIN_PROMPT },
};
