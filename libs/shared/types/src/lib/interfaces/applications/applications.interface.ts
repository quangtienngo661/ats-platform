import { ApplicationStatus, AiRecommendation } from '../../enums';

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
  appliedAt: string;
  currentStageSince: string;
  status: ApplicationStatus;
  cvId: string;
  aiScore?: number;
  aiRecommendation?: AiRecommendation;
}

/** Shape của một cột trên Kanban board */
export interface IKanbanColumn {
  status: ApplicationStatus;
  applications: IApplicationCard[];
}
