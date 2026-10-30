import { GenerateContentConfig, ThinkingLevel, Type } from "@google/genai";
import { AiActionType } from "@ats-platform/database";
import { CV_PARSING_PROMPT, CV_SCREENING_PROMPT, JD_PARSING_PROMPT } from "../constants/gemini-api";
import { LlmReasoning, LlmTier } from "../external-apis/llm/llm.types";

export const cvParsingConfig: GenerateContentConfig = {
    responseMimeType: "application/json",
    systemInstruction: CV_PARSING_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.MEDIUM,
    },
};

export const jdParsingConfig: GenerateContentConfig = {
    responseMimeType: "application/json",
    systemInstruction: JD_PARSING_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.MEDIUM,
    },
};

export const screeningConfig: GenerateContentConfig = {
    responseMimeType: "application/json",
    systemInstruction: CV_SCREENING_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
    }
};
import { MOCK_INTERVIEW_GENERATE_PROMPT, MOCK_INTERVIEW_FOLLOWUP_PROMPT, MOCK_INTERVIEW_EVALUATE_PROMPT, MOCK_INTERVIEW_RESULT_PROMPT } from '../constants/gemini-api';

export const mockInterviewGenerateConfig: GenerateContentConfig = {
    responseMimeType: "application/json",
    systemInstruction: MOCK_INTERVIEW_GENERATE_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
    }
};

export const mockInterviewFollowupConfig: GenerateContentConfig = {
    responseMimeType: "application/json",
    systemInstruction: MOCK_INTERVIEW_FOLLOWUP_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
    }
};

export const mockInterviewEvaluateConfig: GenerateContentConfig = {
    responseMimeType: "application/json",
    systemInstruction: MOCK_INTERVIEW_EVALUATE_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
    }
};

export const mockInterviewResultConfig: GenerateContentConfig = {
    responseMimeType: "application/json",
    systemInstruction: MOCK_INTERVIEW_RESULT_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
    }
};

// Provider-neutral table used by LlmService. The Gemini-typed configs above
// are removed together with GeminiService.
export type LlmOperation =
    | 'parseCV'
    | 'parseJD'
    | 'screeningCV'
    | 'generateInterviewQuestions'
    | 'checkInterviewFollowup'
    | 'evaluateInterviewAnswer'
    | 'generateInterviewResult';

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
};
