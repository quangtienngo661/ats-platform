import { IApplication, IApplicationCard, IKanbanColumn } from "@ats-platform/types";

/** DTO đầu ra từ API cho một Application */
export interface IApplicationDto extends IApplication {
    applicationId: string;
    jobId: string;
    cvId: string;
    candidateId?: string;
    status: string;
    notes?: string;
    rejectionReason?: string;
    createdAt?: string;
    updatedAt?: string;
    job?: {
        title: string;
        departmentId: string;
    };
    candidate?: {
        fullName: string;
        email: string;
    };
}

/** Một entry trong lịch sử thay đổi trạng thái đơn ứng tuyển */
export interface IApplicationHistoryItem {
    historyId: string;
    applicationId: string;
    status: string;
    notes?: string;
    changedAt: string;
}

/** Kanban board — map từ status sang danh sách ApplicationDto */
export type IKanbanBoard = Record<string, IApplicationDto[]>;

export interface IGetApplicationsByJobQuery {
    includeCancelled?: boolean;
    page?: number;
    limit?: number;
}

export interface IPaginatedApplications {
    data: IApplicationDto[];
    total: number;
    page: number;
    limit: number;
}

// Re-export lib types cho tiện dùng
export type { IApplicationCard, IKanbanColumn };
