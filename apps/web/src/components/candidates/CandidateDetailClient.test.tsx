import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import CandidateDetailClient from './CandidateDetailClient';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/jobs/job-1/candidates/app-1',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const base = {
  applicationId: 'app-1',
  jobId: 'job-1',
  cvId: 'cv-1',
  status: 'interview',
  appliedAt: '2026-10-01T02:00:00.000Z',
  candidate: { user: { fullName: 'Trần Thị Lan', email: 'lan@example.com' } },
  jobPosting: { title: 'Kỹ sư backend' },
} as unknown as IApplicationDto;

const props = { jobId: 'job-1', currentUserId: 'user-1', isClosed: false };

beforeEach(() => vi.clearAllMocks());

describe('CandidateDetailClient', () => {
  it('shows the candidate name as the page heading with the status chip', () => {
    render(<CandidateDetailClient {...props} application={base} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Trần Thị Lan' })).toBeVisible();
    expect(screen.getByText('Phỏng vấn')).toBeVisible();
  });

  it('shows the reviewed score in the "Gợi ý AI" meter and says the AI only advises', () => {
    const application = {
      ...base,
      screening: {
        screeningId: 's-1',
        applicationId: 'app-1',
        status: 'completed',
        overallScore: 73,
        skillsScore: 80,
        experienceScore: 70,
        educationScore: 60,
        reviewedAt: '2026-10-30T08:00:00.000Z',
        reviewedOverallScore: 88,
        reviewedSkillsScore: 90,
        reviewedExperienceScore: 85,
        reviewedEducationScore: 80,
        aiRecommendation: 'interview',
        aiReasoning: 'Có 4 năm kinh nghiệm NestJS.',
      },
    } as unknown as IApplicationDto;
    render(<CandidateDetailClient {...props} application={application} />);

    const meter = screen.getByRole('meter', { name: 'Gợi ý AI' });
    expect(meter).toHaveAttribute('aria-valuenow', '88');
    expect(screen.getByText('Điểm AI chỉ là gợi ý. Bạn quyết định vòng tiếp theo.')).toBeVisible();
    expect(screen.getByText('Đã duyệt')).toBeVisible();
    expect(screen.getByText(/Điểm AI ban đầu: 73/)).toBeVisible();
    expect(screen.getByText('Có 4 năm kinh nghiệm NestJS.')).toBeVisible();
    const skills = screen.getByRole('meter', { name: 'Kỹ năng' });
    expect(skills).toHaveAttribute('aria-valuenow', '90');
    expect(within(screen.getByRole('region', { name: 'Gợi ý AI' })).getByRole('button', { name: 'Duyệt điểm' })).toBeVisible();
  });
});
