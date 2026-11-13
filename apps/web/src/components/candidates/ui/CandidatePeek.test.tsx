import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserStatus, type ICVScreening } from '@ats-platform/types';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import { CandidatePeek } from './CandidatePeek';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

const jobId = '10000000-0000-4000-8000-000000000001';
const applicationId = '30000000-0000-4000-8000-000000000007';

function application(screening: ICVScreening | null): IApplicationDto {
  return {
    applicationId,
    jobId,
    cvId: 'cv-7',
    status: 'interview',
    appliedAt: '2026-10-14T02:00:00.000Z',
    candidate: {
      candidateId: 'candidate-7',
      userId: 'user-7',
      currentTitle: 'Kỹ sư dữ liệu',
      user: {
        fullName: 'Trần Thu Hà',
        email: 'ha.tran@ats.test',
        status: UserStatus.active,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    },
    screening,
  };
}

// Scores arrive as strings (Prisma Decimal in JSON). The reviewer moved the AI's 62 to 81.
const reviewedScreening = {
  screeningId: 'screen-7',
  applicationId,
  status: 'completed',
  overallScore: '62',
  aiRecommendation: 'interview',
  matchedSkills: { hardSkills: ['SQL', 'Python'], niceToHaveSkills: ['dbt'] },
  missingSkills: ['Spark'],
  reviewedAt: '2026-10-15T03:00:00.000Z',
  reviewedOverallScore: '81',
} as unknown as ICVScreening;

describe('CandidatePeek', () => {
  it('names the panel after the candidate, shows the reviewed score and links to the full profile', () => {
    render(<CandidatePeek application={application(reviewedScreening)} jobId={jobId} onClose={vi.fn()} />);

    const peek = screen.getByRole('dialog', { name: 'Trần Thu Hà' });
    const meter = within(peek).getByRole('meter', { name: 'Gợi ý AI' });
    expect(meter).toHaveAttribute('aria-valuenow', '81');
    expect(within(peek).getByRole('link', { name: 'Mở hồ sơ đầy đủ' }))
      .toHaveAttribute('href', `/jobs/${jobId}/candidates/${applicationId}`);
    expect(within(peek).getByText('Điểm AI chỉ là gợi ý. Bạn quyết định vòng tiếp theo.')).toBeVisible();
    expect(within(peek).getByText('Nên phỏng vấn')).toBeVisible();
    expect(within(peek).getByText('SQL')).toBeVisible();
    expect(within(peek).getByText('Spark')).toBeVisible();
    // No stage change from the peek: the only button closes it.
    expect(within(peek).getAllByRole('button').map(button => button.getAttribute('aria-label') ?? button.textContent))
      .toEqual(['Đóng']);
  });

  it('says "Chưa có điểm" when the candidate has no screening yet', () => {
    render(<CandidatePeek application={application(null)} jobId={jobId} onClose={vi.fn()} />);

    const peek = screen.getByRole('dialog', { name: 'Trần Thu Hà' });
    expect(within(peek).getByText('Chưa có điểm')).toBeVisible();
    expect(within(peek).queryByRole('meter')).not.toBeInTheDocument();
    expect(within(peek).getByText('Điểm AI chỉ là gợi ý. Bạn quyết định vòng tiếp theo.')).toBeVisible();
  });

  it('renders nothing without an application', () => {
    render(<CandidatePeek application={null} jobId={jobId} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
