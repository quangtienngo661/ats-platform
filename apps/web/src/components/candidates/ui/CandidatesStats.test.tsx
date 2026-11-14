import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ICVScreening } from '@ats-platform/types';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import { CandidatesStats } from './CandidatesStats';

function application(index: number, screening: Record<string, unknown> | null): IApplicationDto {
  return {
    applicationId: `app-${index}`,
    jobId: 'job-1',
    cvId: `cv-${index}`,
    status: 'screening',
    appliedAt: '2026-10-14T02:00:00.000Z',
    screening: screening as unknown as ICVScreening | null,
  };
}

// Scores arrive as strings (Prisma Decimal in JSON). overallScore stays null until a screening completes,
// so a 0 is a real score.
const zero = { status: 'completed', overallScore: '0' };
const reviewedTo80 = { status: 'completed', overallScore: '50', reviewedAt: '2026-10-15T03:00:00.000Z', reviewedOverallScore: '80' };
const pending = { status: 'pending', overallScore: null };

function averageShown() {
  return screen.getByText('Điểm AI trung bình').nextElementSibling;
}

describe('CandidatesStats', () => {
  it('counts a real 0 in the average of effective scores: [0, 80] averages 40', () => {
    render(<CandidatesStats applications={[application(1, zero), application(2, reviewedTo80), application(3, null)]} />);
    expect(averageShown()).toHaveTextContent(/^40$/);
  });

  it('shows 0, not "Chưa có", when every score is a real 0', () => {
    render(<CandidatesStats applications={[application(1, zero), application(2, zero)]} />);
    expect(averageShown()).toHaveTextContent(/^0$/);
  });

  it('shows "Chưa có" when no application has a score yet', () => {
    render(<CandidatesStats applications={[application(1, null), application(2, pending)]} />);
    expect(averageShown()).toHaveTextContent(/^Chưa có$/);
  });
});
