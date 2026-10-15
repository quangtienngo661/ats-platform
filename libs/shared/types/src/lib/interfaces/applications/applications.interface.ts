import {
  ApplicationStatus,
  AiRecommendation,
  ScreeningSkipReason,
} from '../../enums';

export interface IApplication {
  jobId: string;
  cvId: string;
}

export interface IApplicationStatusUpdate {
  status: ApplicationStatus;
  notes?: string;
  rejectionReason?: string;
}

/** Shape của một card hiển thị trong Kanban board */
export interface IApplicationCard {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  departmentName: string;
  appliedAt: string;
  currentStageSince?: string;
  status: string;
  cvId: string;
  locationType: string;
  aiScore?: number;
  aiRecommendation?: string;
}

/** Shape của một cột trên Kanban board */
export interface IKanbanColumn {
  status: ApplicationStatus;
  applications: IApplicationCard[];
}

export interface IBulkScreeningResult {
  queued: { applicationId: string; movedToScreening: boolean }[];
  skipped: {
    applicationId: string;
    reason: ScreeningSkipReason;
    movedToScreening: boolean;
  }[];
  remaining: number;
}
