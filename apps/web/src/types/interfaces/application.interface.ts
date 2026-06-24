import { IApplication, IApplicationCard, IKanbanColumn, IPaginatedResponse } from "@ats-platform/types";
import { ICandidateDto } from "./candidate.interface";
import { IJobPostingDto } from "./job-posting.interface";
import { IScreeningResultDto } from "./cv-screening.interface";

export interface IApplicationDto extends IApplication {
    applicationId: string;
    jobId: string;
    cvId: string;
    candidateId?: string;
    status: string;
    appliedAt?: string;             // matches schema appliedAt
    notes?: string;
    rejectionReason?: string;
    createdAt?: string;
    updatedAt?: string;
    jobPosting?: {
        title: string;
        departmentId: string;
        department?: {
            name: string,
        };         // resolved name, returned by some endpoints
        locationType?: string;
    };
    candidate?: ICandidateDto;
    screening?: IScreeningResultDto | null;
}

export interface IApplicationHistoryItem {
    historyId: string;
    applicationId: string;
    status: string;
    notes?: string;
    changedAt: string;
}

export interface IGetApplicationsByJobQuery {
    includeCancelled?: boolean;
    page?: number;
    limit?: number;
}

export type IPaginatedApplications = IPaginatedResponse<IApplicationDto>;

// Re-export lib types cho tiện dùng
export type { IApplicationCard, IKanbanColumn };
