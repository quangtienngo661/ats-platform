import { IApplication, IApplicationCard, IKanbanColumn, IPaginatedResponse } from "@ats-platform/types";
import { ICandidateDto } from "./candidate.interface";

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
        jobId?: string;
        organizationId?: string;
        title: string;
        departmentId: string;
        department?: {
            name: string,
            organizationId?: string;
        };         // resolved name, returned by some endpoints
        locationType?: string;
    };
    candidate?: ICandidateDto;
    screening?: IScreeningResultDto | null;
    history?: IApplicationHistoryItem[];
}

/** One step of an application, as the API sends it to a candidate (R1). */
export interface IApplicationHistoryItem {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedAt: string;
    rejectionReason?: string;
}

export interface IGetApplicationsByJobQuery {
    includeCancelled?: boolean;
    page?: number;
    limit?: number;
}

export type IPaginatedApplications = IPaginatedResponse<IApplicationDto>;

// Re-export lib types cho tiện dùng
export type { IApplicationCard, IKanbanColumn };
