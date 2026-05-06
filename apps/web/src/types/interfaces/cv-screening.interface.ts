import { ICVScreening } from "@ats-platform/types";

/** Kết quả screening đầy đủ — dành cho HR/Admin */
export interface IScreeningResultDto extends ICVScreening {

}

/** Thống kê screening cho một Job */
export interface IScreeningStats {
    jobId: string;
    total: number;
    screened: number;
    averageScore?: number;
    scoreDistribution?: Record<string, number>;
}

/** Kết quả screening partial — dành cho Candidate tự xem */
export interface ICandidateScreeningResult {
    applicationId: string;
    status: string;
    score?: number;
    summary?: string;
    screened: boolean;
}
