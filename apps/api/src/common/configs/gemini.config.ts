import { GenerateContentConfig, Type } from "@google/genai";
import { CV_PARSING_PROMPT, JD_PARSING_PROMPT } from "../constants/gemini-api";

// export const jdParsingConfig: GenerateContentConfig = {
//     temperature: 0,
//     topK: 1,
//     topP: 0.1,
//     thinkingConfig: {
//         thinkingBudget: 0
//     },

//     systemInstruction: "You are a highly accurate ATS (Applicant Tracking System) Data Extraction Engine. Your sole purpose is to analyze Job Description (JD) texts and extract specific information into a strict, predefined JSON format. ZERO HALLUCINATION: You must extract information EXCLUSIVELY from the provided text. STRICT NULL OR EMPTY: If a specific piece of information is NOT explicitly stated in the JD, you MUST return null or an empty array []. NO METADATA: Do not extract Job Title, Salary, or Location into the description arrays unless it is deeply embedded in a requirement sentence.",

//     responseMimeType: "application/json",

//     responseSchema: {
//         type: Type.OBJECT,
//         properties: {
//             job_summary: {
//                 type: Type.STRING,
//                 description: "EXPLICIT SUMMARY ONLY. Extract the intro/summary paragraph if it exists. ABSOLUTELY DO NOT auto-generate, synthesize, or summarize the text yourself. If the JD does not have an explicit summary section, you MUST return null.",
//                 nullable: true,
//             },
//             responsibilities: {
//                 type: Type.ARRAY,
//                 items: {
//                     type: Type.STRING
//                 },
//                 description: "Exact sentences detailing day-to-day tasks. Return [] if none.",
//             },
//             requirements: {
//                 type: Type.OBJECT,
//                 properties: {
//                     minimum_experience_years: {
//                         type: Type.NUMBER,
//                         description: "STRICT LOGIC: If the JD explicitly states 'no experience required', 'fresher accepted', 'chấp nhận sinh viên', or '0 years', you MUST return 0. If it says e.g., '2-3 years', return 2. If 'at least 6 months', return 0.5. If experience is completely unmentioned, you MUST return null.",
//                         nullable: true,
//                     },
//                     education_level: {
//                         type: Type.STRING,
//                         // FIX #1: Removed "None" from enum — conflicts with nullable: true.
//                         // Model now has only one way to express "no info": null.
//                         description: "Extract the minimum degree mentioned. If education is not mentioned, return null.",
//                         enum: ["Certificate", "Diploma", "Bachelor", "Master", "PhD"],
//                         nullable: true,
//                     },
//                     hard_skills: {
//                         type: Type.ARRAY,
//                         items: {
//                             type: Type.STRING
//                         },
//                         description: "Technical tools, frameworks, and domain-specific knowledge explicitly mentioned. Return [] if none.",
//                     },
//                     soft_skills: {
//                         type: Type.ARRAY,
//                         items: {
//                             type: Type.STRING
//                         },
//                         description: "Interpersonal and communication skills explicitly mentioned. Return [] if none.",
//                     },
//                     languages: {
//                         type: Type.ARRAY,
//                         items: { type: Type.STRING },
//                         description: "Required spoken/written languages explicitly mentioned. Extract ONLY the language name (e.g., 'English', 'Vietnamese') without full sentences. Return [] if none.",
//                     }
//                 },
//                 required: ["minimum_experience_years", "education_level", "hard_skills", "soft_skills", "languages"]
//             },
//             nice_to_haves: {
//                 type: Type.ARRAY,
//                 items: {
//                     type: Type.STRING
//                 },
//                 description: "Skills, experiences, or traits explicitly marked as 'plus', 'preferred', 'nice to have', 'ưu tiên', or 'điểm cộng'. Return [] if none.",
//             },
//             benefits: {
//                 type: Type.ARRAY,
//                 items: { type: Type.STRING },
//                 description: "Perks, allowances, insurance, equipment, or work environment details explicitly mentioned. ABSOLUTELY DO NOT extract legal disclaimers, Equal Employment Opportunity (EEO) statements, or non-discrimination policies. Return [] if no real benefits are found.",
//             }
//         },
//         required: ["job_summary", "responsibilities", "requirements", "nice_to_haves", "benefits"]
//     }
// };


// export const cvParsingConfig: GenerateContentConfig = {
//     temperature: 1,
//     topK: 1,
//     topP: 0.1,
//     thinkingConfig: {
//         thinkingBudget: 0, // Tắt thinking — extraction task không cần reasoning
//     },

//     // maxOutputTokens: 1024,
//     systemInstruction: `You are an enterprise-grade ATS (Applicant Tracking System) CV Parser. Your sole objective is to extract information from raw CV text into a structured JSON object with 100% fidelity.
// CRITICAL RULES:
// 1. ZERO HALLUCINATION: Extract information EXCLUSIVELY from the provided text. Do NOT infer skills, job titles, or dates that are not explicitly mentioned.
// 2. RAW EXTRACTION ONLY: ABSOLUTELY DO NOT calculate total years of experience or durations. Extract start and end dates exactly as they are written.
// 3. STRICT BOUNDARIES: Official, paid work history goes into the "experience" array. Academic, personal, freelance, or school projects MUST go into the "projects" array. DO NOT leak projects into the work experience section.
// 4. MISSING DATA: If a specific piece of information is NOT present, you MUST assign null (for strings/objects) or an empty array [] (for arrays).
// 5. STRICT OUTPUT: Return ONLY a valid JSON object without markdown formatting.`,

//     responseMimeType: "application/json",
//     // systemInstruction: CV_PARSING_PROMPT,

//     responseSchema: {
//         type: Type.OBJECT,
//         properties: {
//             fullName: { type: Type.STRING, description: "The candidate's full name.", nullable: true },
//             email: { type: Type.STRING, description: "The candidate's email address.", nullable: true },
//             phone: {
//                 type: Type.STRING,
//                 description: "The candidate's phone number. If it contains a '+84' country code, convert it to a '0' prefix.",
//                 nullable: true
//             },
//             links: {
//                 type: Type.OBJECT,
//                 properties: {
//                     linkedin: { type: Type.STRING, description: "LinkedIn profile URL.", nullable: true },
//                     github: { type: Type.STRING, description: "GitHub profile URL.", nullable: true },
//                     portfolio: { type: Type.STRING, description: "Personal website or portfolio URL.", nullable: true }
//                 },
//                 required: ["linkedin", "github", "portfolio"]
//             },
//             summary: {
//                 type: Type.STRING,
//                 description: "The objective or professional summary paragraph, if present.",
//                 nullable: true
//             },
//             skills: {
//                 type: Type.OBJECT,
//                 properties: {
//                     technical: {
//                         type: Type.ARRAY,
//                         items: { type: Type.STRING },
//                         description: "Technical skills, programming languages, frameworks, and tools."
//                     },
//                     soft: {
//                         type: Type.ARRAY,
//                         items: { type: Type.STRING },
//                         description: "Interpersonal, leadership, or communication skills."
//                     },
//                     // FIX #2: Added languages field to mirror the JD schema,
//                     // enabling direct CV ↔ JD language comparison in the matching pipeline.
//                     languages: {
//                         type: Type.ARRAY,
//                         items: { type: Type.STRING },
//                         description: "Spoken/written languages explicitly mentioned. Extract the language name and proficiency level if stated (e.g., 'English - B2', 'Japanese - N3', 'Vietnamese'). Return [] if none."
//                     }
//                 },
//                 required: ["technical", "soft", "languages"]
//             },
//             experience: {
//                 type: Type.ARRAY,
//                 description: "Official, paid work history. DO NOT leak projects here.",
//                 items: {
//                     type: Type.OBJECT,
//                     properties: {
//                         company: { type: Type.STRING, description: "Name of the employer/company.", nullable: true },
//                         position: { type: Type.STRING, description: "Official job title.", nullable: true },
//                         start_date: { type: Type.STRING, description: "Extract exactly as written.", nullable: true },
//                         end_date: { type: Type.STRING, description: "Extract exactly as written, or use 'Present'.", nullable: true },
//                         description: { type: Type.STRING, description: "Concise summary of responsibilities.", nullable: true }
//                     },
//                     required: ["company", "position", "start_date", "end_date", "description"]
//                 }
//             },
//             projects: {
//                 type: Type.ARRAY,
//                 description: "Academic, personal, freelance, or school projects.",
//                 items: {
//                     type: Type.OBJECT,
//                     properties: {
//                         name: { type: Type.STRING, description: "Name of the project.", nullable: true },
//                         role: { type: Type.STRING, description: "Candidate's specific role.", nullable: true },
//                         technologies: {
//                             type: Type.ARRAY,
//                             items: { type: Type.STRING },
//                             description: "Tech stack used in this specific project."
//                         },
//                         description: { type: Type.STRING, description: "What the project does and contributions.", nullable: true },
//                         start_date: { type: Type.STRING, nullable: true },
//                         end_date: { type: Type.STRING, nullable: true },
//                         link: { type: Type.STRING, description: "URL to project repo or demo.", nullable: true }
//                     },
//                     required: ["name", "role", "technologies", "description", "start_date", "end_date", "link"]
//                 }
//             },
//             education: {
//                 type: Type.ARRAY,
//                 items: {
//                     type: Type.OBJECT,
//                     properties: {
//                         institution: { type: Type.STRING, description: "Name of the university or school.", nullable: true },
//                         degree: {
//                             type: Type.STRING,
//                             // FIX #3: Unified enum to English-only to match the JD schema,
//                             // with an explicit Vietnamese → English mapping rule in the description
//                             // so the model can normalize regardless of CV source language.
//                             description: "STRICT RULE: Must ONLY be one of the provided enum values. Return null if the degree level cannot be determined.",
//                             enum: ["Certificate", "Diploma", "Bachelor", "Master", "PhD"],
//                             nullable: true
//                         },
//                         major: { type: Type.STRING, description: "The academic major or field of study.", nullable: true },
//                         start_date: { type: Type.STRING, nullable: true },
//                         end_date: { type: Type.STRING, nullable: true }
//                     },
//                     required: ["institution", "degree", "major", "start_date", "end_date"]
//                 }
//             },
//             certificates: {
//                 type: Type.ARRAY,
//                 items: { type: Type.STRING },
//                 description: "Names of certifications (e.g., IELTS, TOEIC, AWS Certified)."
//             }
//         },
//         required: [
//             "fullName",
//             "email",
//             "phone",
//             "links",
//             "summary",
//             "skills",
//             "experience",
//             "projects",
//             "education",
//             "certificates"
//         ]
//     }
// };

export const cvParsingConfig: GenerateContentConfig = {
    temperature: 1,        // Bắt buộc = 1 khi dùng thinkingBudget
    responseMimeType: "application/json",
    systemInstruction: CV_PARSING_PROMPT,
    thinkingConfig: {
        thinkingBudget: 0, // Tắt thinking — extraction task không cần reasoning
    },
};

export const jdParsingConfig: GenerateContentConfig = {
    temperature: 1,         // Bắt buộc = 1 khi dùng thinkingBudget
    responseMimeType: "application/json",
    systemInstruction: JD_PARSING_PROMPT,
    thinkingConfig: {
        thinkingBudget: 0,  // Tắt thinking — extraction task không cần reasoning
    },
};