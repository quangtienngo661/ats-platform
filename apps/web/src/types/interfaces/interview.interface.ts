import { DifficultyLevel, InterviewStatus, InterviewType, ScheduleStatus, IPaginatedResponse } from '@ats-platform/types';
import { IApplicationDto } from './application.interface';
import { IJobCategoryDto } from './job-category.interface';

export interface IInterviewUserBrief {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
}

export interface IInterviewSchedule {
    interviewId: string;
    applicationId: string;
    scheduledBy: string;
    interviewerId: string;
    interviewType: InterviewType;
    startAt: string;
    durationMinutes: number;
    onlineMeetingLink?: string | null;
    status: ScheduleStatus;
    application: IApplicationDto;
    interviewer: IInterviewUserBrief;
    scheduler: IInterviewUserBrief;
}

export interface IInterviewScheduleQuery {
    applicationId?: string;
    status?: ScheduleStatus;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
}

export type IPaginatedInterviewSchedules = IPaginatedResponse<IInterviewSchedule>;

export interface IInterviewTopic {
    topicId: string;
    name: string;
    categoryId?: string | null;
    category?: IJobCategoryDto | null;
    _count?: { sessions: number };
}

export interface IInterviewQnA {
    qnaId: string;
    orderIndex: number;
    difficulty: DifficultyLevel;
    questionText: string;
    expectedPoints: string[] | null;
    answerText: string | null;
    correctnessScore: number | null;
    feedback: string | null;
    coveredPoints: string[] | null;
    missedPoints: string[] | null;
    hasFollowup: boolean;
    followupQuestion: string | null;
    followupAnswer: string | null;
    followupReason: string | null;
}

export interface IInterviewSession {
    sessionId: string;
    candidateId: string;
    topicId: string;
    difficultyLevel: DifficultyLevel;
    status: InterviewStatus;
    startedAt: string;
    topic: Pick<IInterviewTopic, 'topicId' | 'name' | 'categoryId' | 'category'>;
    qnas?: IInterviewQnA[];
    result?: IInterviewResult | null;
}

export interface IInterviewResult {
    resultId: string;
    sessionId: string;
    overallScore: number;
    strengths: string[] | null;
    weaknesses: string[] | null;
    actionPlan: string | null;
    generatedAt: string;
    session?: IInterviewSession;
}

export interface ISessionSummary {
    sessionId: string;
    status: InterviewStatus;
    difficultyLevel: DifficultyLevel;
    startedAt: string;
    topic: Pick<IInterviewTopic, 'name' | 'categoryId' | 'category'>;
    result?: { overallScore: number } | null;
}

export interface IResumeSession {
    session: IInterviewSession;
    currentQuestion: IInterviewQnA;
}
