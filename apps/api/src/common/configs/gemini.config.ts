import { GenerateContentConfig, ThinkingLevel, Type } from "@google/genai";
import { CV_PARSING_PROMPT, CV_SCREENING_PROMPT, JD_PARSING_PROMPT } from "../constants/gemini-api";

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
