import { GenerateContentConfig, ThinkingLevel, Type } from "@google/genai";
import { CV_PARSING_PROMPT, CV_SCREENING_PROMPT, JD_PARSING_PROMPT } from "../constants/gemini-api";

export const cvParsingConfig: GenerateContentConfig = {
    temperature: 1,
    responseMimeType: "application/json",
    systemInstruction: CV_PARSING_PROMPT,
    thinkingConfig: {
        thinkingBudget: 0,
    },
};

export const jdParsingConfig: GenerateContentConfig = {
    temperature: 1,
    responseMimeType: "application/json",
    systemInstruction: JD_PARSING_PROMPT,
    thinkingConfig: {
        thinkingBudget: 0,
    },
};

export const screeningConfig: GenerateContentConfig = {
    temperature: 1,
    responseMimeType: "application/json",
    systemInstruction: CV_SCREENING_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
    }
};
import { MOCK_INTERVIEW_GENERATE_PROMPT, MOCK_INTERVIEW_FOLLOWUP_PROMPT, MOCK_INTERVIEW_EVALUATE_PROMPT, MOCK_INTERVIEW_RESULT_PROMPT } from '../constants/gemini-api';

export const mockInterviewGenerateConfig: GenerateContentConfig = {
    temperature: 1,
    responseMimeType: "application/json",
    systemInstruction: MOCK_INTERVIEW_GENERATE_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
    }
};

export const mockInterviewFollowupConfig: GenerateContentConfig = {
    temperature: 1,
    responseMimeType: "application/json",
    systemInstruction: MOCK_INTERVIEW_FOLLOWUP_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
    }
};

export const mockInterviewEvaluateConfig: GenerateContentConfig = {
    temperature: 1,
    responseMimeType: "application/json",
    systemInstruction: MOCK_INTERVIEW_EVALUATE_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
    }
};

export const mockInterviewResultConfig: GenerateContentConfig = {
    temperature: 1,
    responseMimeType: "application/json",
    systemInstruction: MOCK_INTERVIEW_RESULT_PROMPT,
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
    }
};
