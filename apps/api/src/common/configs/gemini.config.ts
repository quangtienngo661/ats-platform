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