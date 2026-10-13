import type {
    AiRecommendation,
    ApplicationStatus,
    InterviewType,
    IPaginatedResponse,
    ScheduleStatus,
    ScorecardRecommendation,
} from '@ats-platform/types';

export interface IScorecard {
    id: string;
    interviewId: string;
    technicalSkills: number;
    problemSolving: number;
    communication: number;
    cultureFit: number;
    recommendation: ScorecardRecommendation;
    comment: string | null;
    submittedAt: string;
    updatedAt: string;
    author: { userId: string; fullName: string };
}

export interface IScorecardListItem extends IScorecard {
    interview: {
        interviewId: string;
        startAt: string;
        interviewType: InterviewType;
        status: ScheduleStatus;
    };
}

export interface IScorecardInput {
    technicalSkills: number;
    problemSolving: number;
    communication: number;
    cultureFit: number;
    recommendation: ScorecardRecommendation;
    comment?: string;
}

export interface IApplicationNote {
    id: string;
    applicationId: string;
    body: string;
    createdAt: string;
    updatedAt: string;
    author: { userId: string; fullName: string };
}

export type IPaginatedApplicationNotes = IPaginatedResponse<IApplicationNote>;

export interface IComparisonItem {
    applicationId: string;
    candidateName: string;
    status: ApplicationStatus;
    appliedAt: string;
    screening: {
        overallScore: number | null;
        skillsScore: number | null;
        experienceScore: number | null;
        educationScore: number | null;
        aiRecommendation: AiRecommendation | null;
        matchedSkills: unknown;
        missingSkills: unknown;
    } | null;
    scorecards: {
        count: number;
        average: {
            technicalSkills: number | null;
            problemSolving: number | null;
            communication: number | null;
            cultureFit: number | null;
        };
        recommendations: {
            interviewerName: string;
            recommendation: ScorecardRecommendation;
        }[];
    };
    noteCount: number;
}
