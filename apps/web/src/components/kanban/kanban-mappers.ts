import { effectiveScreeningScores } from '@ats-platform/types';
import { Candidate, Stage } from '@/types/interfaces/kanban.interface';
import { IApplicationDto } from '@/types/interfaces/application.interface';

// ── Helper: convert API ApplicationDto to UI Candidate card ─────────────────
export function mapApplicationToCandidate(app: IApplicationDto, stage: Stage): Candidate {
  const name = app.candidate?.user?.fullName || 'N/A';
  const initials = name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
  // The reviewer's overall score when the screening was reviewed, the AI's otherwise.
  const effective = effectiveScreeningScores(app.screening ?? {});
  const score = effective.overall ?? 0;

  const screeningStatus = app.screening?.status ?? undefined;

  return {
    id: app.applicationId,
    name,
    role: app.jobPosting?.title || '',
    initials,
    avatarColor: '#0071E3',
    rating: score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score === 0 ? 0 : 2,
    daysInStage: app.appliedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(app.appliedAt).getTime()) / 86400000))
      : 0,
    source: 'Website',
    stage,
    score,
    location: app.jobPosting?.locationType || '',
    tags: [],
    screeningStatus,
    reviewed: effective.isReviewed,
  };
}

export function boardToCandidates(board: Record<string, IApplicationDto[]>): Candidate[] {
  const result: Candidate[] = [];
  for (const [status, applications] of Object.entries(board)) {
    for (const app of applications) {
      result.push(mapApplicationToCandidate(app, status as Stage));
    }
  }
  return result;
}
