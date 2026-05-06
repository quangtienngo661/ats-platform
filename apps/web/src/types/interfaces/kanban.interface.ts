import { IApplicationDto } from "./application.interface";
import { IJobPostingDto } from "./job-posting.interface";

export type Stage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'cancelled';

export interface Candidate {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  rating: number;
  daysInStage: number;
  source: string;
  stage: Stage;
  score: number;
  location: string;
  tags: string[];
  screeningStatus?: 'pending' | 'screened';
}

export interface StageConfig {
  id: Stage;
  label: string;
  color: string;
  light: string;
  border: string;
  text: string;
}

/** Kanban board — map từ status sang danh sách ApplicationDto */
export interface IKanbanDto {
  job: IJobPostingDto,
  board: Record<string, IApplicationDto[]>,
  cancelledCount: number
};