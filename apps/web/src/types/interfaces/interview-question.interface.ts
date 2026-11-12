import { DifficultyLevel, IPaginatedResponse } from '@ats-platform/types';

/** A question of the system-wide interview bank, as the admin API returns it. */
export interface IInterviewQuestion {
    questionId: string;
    topicId: string;
    difficulty: DifficultyLevel;
    questionText: string;
    expectedPoints: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type IPaginatedInterviewQuestions = IPaginatedResponse<IInterviewQuestion>;

export interface InterviewQuestionInput {
    difficulty: DifficultyLevel;
    questionText: string;
    expectedPoints: string[];
}
