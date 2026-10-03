import { ApplicationStatus } from '@ats-platform/database';
import { toCandidateHistory } from './candidate-history';

type Row = Parameters<typeof toCandidateHistory>[0][number];

function row(id: string, fromStatus: ApplicationStatus | null, toStatus: ApplicationStatus, day: number, rejectionReason: string | null = null): Row {
  return { id, fromStatus, toStatus, changedAt: new Date(Date.UTC(2026, 9, day, 2)), rejectionReason };
}

describe('toCandidateHistory (R1, D8)', () => {
  it('keeps only the four fields a candidate may see', () => {
    const internal = {
      ...row('h1', null, ApplicationStatus.applied, 1),
      notes: 'ghi chú nội bộ',
      changedBy: 'recruiter-1',
      user: { userId: 'recruiter-1', fullName: 'Trần Thị B', role: 'recruiter' },
    };

    expect(toCandidateHistory([internal], ApplicationStatus.applied)).toEqual([
      { id: 'h1', fromStatus: null, toStatus: ApplicationStatus.applied, changedAt: internal.changedAt },
    ]);
  });

  it('gives the reason only on the latest rejection while the application is rejected', () => {
    const history = toCandidateHistory([
      row('h1', ApplicationStatus.interview, ApplicationStatus.rejected, 2, 'Lần đầu'),
      row('h2', ApplicationStatus.rejected, ApplicationStatus.interview, 3),
      row('h3', ApplicationStatus.interview, ApplicationStatus.rejected, 4, 'Chưa đủ kinh nghiệm NestJS'),
    ], ApplicationStatus.rejected);

    expect(history.map((item) => item.rejectionReason)).toEqual([undefined, undefined, 'Chưa đủ kinh nghiệm NestJS']);
    expect(history[0]).not.toHaveProperty('rejectionReason');
  });

  it('gives no reason at all once the rejection has been reverted (C20)', () => {
    const history = toCandidateHistory([
      row('h1', ApplicationStatus.interview, ApplicationStatus.rejected, 2, 'Chưa đủ kinh nghiệm NestJS'),
      row('h2', ApplicationStatus.rejected, ApplicationStatus.interview, 3),
    ], ApplicationStatus.interview);

    expect(history).toHaveLength(2);
    expect(history.every((item) => !('rejectionReason' in item))).toBe(true);
  });

  it('never passes on a reason written on a row that is not a rejection', () => {
    const history = toCandidateHistory([
      row('h1', ApplicationStatus.interview, ApplicationStatus.rejected, 2),
      row('h2', ApplicationStatus.rejected, ApplicationStatus.interview, 3, 'ghi khi hoàn tác'),
      row('h3', ApplicationStatus.interview, ApplicationStatus.rejected, 4),
    ], ApplicationStatus.rejected);

    expect(history).toHaveLength(3);
    expect(history.every((item) => !('rejectionReason' in item))).toBe(true);
  });

  it('treats a blank reason as no reason (E12)', () => {
    const [rejection] = toCandidateHistory([
      row('h1', ApplicationStatus.interview, ApplicationStatus.rejected, 2, '   '),
    ], ApplicationStatus.rejected);

    expect(rejection).not.toHaveProperty('rejectionReason');
  });

  it('trims the reason it passes on', () => {
    const [rejection] = toCandidateHistory([
      row('h1', ApplicationStatus.interview, ApplicationStatus.rejected, 2, '  Thiếu NestJS  '),
    ], ApplicationStatus.rejected);

    expect(rejection.rejectionReason).toBe('Thiếu NestJS');
  });

  it('picks the latest rejection by time, not by position', () => {
    const history = toCandidateHistory([
      row('late', ApplicationStatus.interview, ApplicationStatus.rejected, 9, 'Lần sau'),
      row('early', ApplicationStatus.screening, ApplicationStatus.rejected, 2, 'Lần trước'),
    ], ApplicationStatus.rejected);

    expect(history.find((item) => item.id === 'late')?.rejectionReason).toBe('Lần sau');
    expect(history.find((item) => item.id === 'early')).not.toHaveProperty('rejectionReason');
  });
});
