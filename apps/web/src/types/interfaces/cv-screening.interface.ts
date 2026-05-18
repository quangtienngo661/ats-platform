import { ICVScreening } from "@ats-platform/types";
export interface IScreeningResultDto extends ICVScreening {

}
export interface IScreeningStats {
    jobId: string;
    total: number;
    screened: number;
    averageScore?: number;
    scoreDistribution?: Record<string, number>;
}
export interface ICandidateScreeningResult {
    applicationId: string;
    status: string;
    score?: number;
    summary?: string;
    screened: boolean;
}
