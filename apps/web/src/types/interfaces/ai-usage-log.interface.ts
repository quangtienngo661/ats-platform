export interface IAiUsageLogDto {
    logId: string;
    actionType: 'cv_parsing' | 'cv_scoring' | 'mock_interview' | 'job_parsing';
    referenceId: string | null;
    modelName: string;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
    status: 'success' | 'failed';
    createdAt: string;
}
