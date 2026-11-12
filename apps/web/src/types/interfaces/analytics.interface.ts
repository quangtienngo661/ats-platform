/** GET /analytics/recruitment (GĐ4 R18). */
export interface IRecruitmentAnalytics {
    range: { from: string; to: string };
    totals: { applications: number; openJobs: number; hired: number; averageDaysToHire: number | null };
    funnel: { stage: FunnelStage; reached: number; conversion: number | null }[];
    outcomes: { rejected: number; cancelled: number };
    timeInStage: { stage: Exclude<FunnelStage, 'hired'>; averageDays: number | null; samples: number }[];
    trend: { date: string; count: number }[];
    recent: {
        applicationId: string;
        jobId: string;
        jobTitle: string;
        candidateName: string;
        status: string;
        appliedAt: string;
    }[];
}

export type FunnelStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired';

/** GET /analytics/ai-cost (GĐ4 R22). */
export interface IAiCostSummary {
    range: { from: string; to: string };
    organizationId: string | null;
    items: {
        month: string;
        actionType: string;
        calls: number;
        failedCalls: number;
        promptTokens: number;
        completionTokens: number;
        estimatedCostUsd: number | null;
    }[];
    totals: { calls: number; promptTokens: number; completionTokens: number; estimatedCostUsd: number | null };
    modelsWithoutPrice: string[];
}

/** GET /analytics/ai-model-prices (GĐ4 R21). */
export interface IModelPrice {
    modelName: string;
    inputUsdPerMillion: number | null;
    outputUsdPerMillion: number | null;
    updatedAt: string | null;
}
