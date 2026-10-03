import { ApplicationStatus } from '@ats-platform/database';

/** The history columns read for a candidate (`candidateHistorySelect`). */
export interface CandidateHistoryRow {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedAt: Date;
  rejectionReason: string | null;
}

/** What a candidate receives for one step of their application (R1). */
export interface CandidateHistoryItem {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedAt: Date;
  rejectionReason?: string;
}

/**
 * Strips a history to what a candidate may see, keeping the input order. A rejection
 * reason is passed on only for the decision in force (D8): the latest row that moved
 * the application to `rejected`, while it is still rejected. `updateStatus` stores a
 * reason on any change, so the reason column alone says nothing.
 */
export function toCandidateHistory(
  rows: CandidateHistoryRow[],
  currentStatus: ApplicationStatus,
): CandidateHistoryItem[] {
  const latestRejection =
    currentStatus === ApplicationStatus.rejected
      ? rows
          .filter((row) => row.toStatus === ApplicationStatus.rejected)
          .reduce<CandidateHistoryRow | null>(
            (latest, row) => (!latest || row.changedAt > latest.changedAt ? row : latest),
            null,
          )
      : null;
  const reason = latestRejection?.rejectionReason?.trim();

  return rows.map(({ id, fromStatus, toStatus, changedAt }) => ({
    id,
    fromStatus,
    toStatus,
    changedAt,
    ...(reason && id === latestRejection?.id ? { rejectionReason: reason } : {}),
  }));
}
