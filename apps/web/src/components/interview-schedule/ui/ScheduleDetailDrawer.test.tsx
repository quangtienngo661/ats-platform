import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import type { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import { ScheduleDetailDrawer } from './ScheduleDetailDrawer';

vi.mock('@/servers/interviews/interviews.action', () => ({
  cancelInterviewScheduleAction: vi.fn(),
  completeInterviewScheduleAction: vi.fn(),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function schedule(overrides: Partial<IInterviewSchedule>): IInterviewSchedule {
  return {
    interviewId: 'int-1',
    applicationId: 'app-1',
    interviewerId: 'user-2',
    scheduledBy: 'user-2',
    interviewType: 'onsite',
    startAt: '2026-10-05T02:00:00.000Z',
    durationMinutes: 60,
    onlineMeetingLink: null,
    location: null,
    status: 'scheduled',
    application: {
      applicationId: 'app-1',
      candidate: { user: { fullName: 'Nguyễn Văn A', email: 'a@ats.test' } },
      // The staff schedule include keeps jobId, although IApplicationDto omits it.
      jobPosting: { jobId: 'job-1', title: 'Backend Engineer', department: { name: 'Kỹ thuật' } },
    } as unknown as IApplicationDto,
    interviewer: { userId: 'user-2', fullName: 'Trần Thị B', email: 'b@ats.test' },
    scheduler: { userId: 'user-2', fullName: 'Trần Thị B', email: 'b@ats.test' },
    ...overrides,
  };
}

function renderDrawer(value: IInterviewSchedule, currentUserId = 'user-2') {
  return render(<ScheduleDetailDrawer schedule={value} currentUserId={currentUserId} onClose={vi.fn()} onChanged={vi.fn()} onReschedule={vi.fn()} />);
}

describe('ScheduleDetailDrawer — how the interview takes place (R3)', () => {
  it('shows an online interview with its meeting link', () => {
    renderDrawer(schedule({ interviewType: 'online', onlineMeetingLink: 'https://meet.example.com/abc' }));

    expect(screen.getByText('Phỏng vấn trực tuyến')).toBeInTheDocument();
    expect(screen.queryByText('Phỏng vấn trực tiếp')).toBeNull();
    const link = screen.getByRole('link', { name: 'https://meet.example.com/abc' });
    expect(link).toHaveAttribute('href', 'https://meet.example.com/abc');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows a stored non-http(s) link as text, never as a link', () => {
    renderDrawer(schedule({ interviewType: 'online', onlineMeetingLink: 'javascript:alert(1)' }));

    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('shows an onsite interview with its address', () => {
    renderDrawer(schedule({ location: 'Tầng 5, 123 Lê Lợi, Q.1' }));

    expect(screen.getByText('Phỏng vấn trực tiếp')).toBeInTheDocument();
    expect(screen.getByText('Tầng 5, 123 Lê Lợi, Q.1')).toBeInTheDocument();
  });

  it('says when an older onsite interview has no address yet', () => {
    renderDrawer(schedule({ location: null }));

    expect(screen.getByText('Chưa có địa điểm')).toBeInTheDocument();
  });

  it('drawer shows the evaluation link only to the interviewer of a completed interview', () => {
    const currentUserId = 'user-2';
    const href = '/jobs/job-1/candidates/app-1?tab=evaluation';
    const cases = [
      { status: 'scheduled', interviewerId: currentUserId, visible: false },
      // I scheduled it, but someone else is its interviewer.
      { status: 'completed', interviewerId: 'user-other', visible: false },
      { status: 'completed', interviewerId: currentUserId, visible: true },
    ] as const;

    for (const testCase of cases) {
      const value = schedule({
        status: testCase.status,
        interviewerId: testCase.interviewerId,
        interviewer: { userId: testCase.interviewerId, fullName: 'Trần Thị B', email: 'b@ats.test' },
      });
      const drawer = renderDrawer(value, currentUserId);
      if (testCase.visible) {
        const link = screen.getByRole('link', { name: /đánh giá/i });
        expect(link).toBeVisible();
        expect(link).toHaveAttribute('href', href);
      } else {
        expect(screen.queryByRole('link', { name: /đánh giá/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
      }
      drawer.unmount();
    }
  });
});
