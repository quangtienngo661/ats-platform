import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  describe('the built-in room (GĐ4 R7)', () => {
    const builtIn = schedule({
      interviewType: 'online',
      onlineMeetingLink: 'http://localhost:3001/interview-room/int-1',
      interviewerId: 'user-2',
      scheduledBy: 'user-3',
    });

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-05T02:10:00.000Z')); // ten minutes in
    });
    afterEach(() => vi.useRealTimers());

    it.each([
      ['the interviewer', 'user-2'],
      ['the recruiter who scheduled it', 'user-3'],
    ])('lets %s enter it while it is open', (_label, viewer) => {
      renderDrawer(builtIn, viewer);

      expect(screen.getByText('Phòng phỏng vấn trực tuyến của hệ thống')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Vào phòng phỏng vấn' })).toHaveAttribute('href', '/interview-room/int-1');
    });

    it('does not offer it to staff who are not in the interview', () => {
      renderDrawer(builtIn, 'user-9');

      expect(screen.getByText('Phòng phỏng vấn trực tuyến của hệ thống')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Vào phòng phỏng vấn' })).toBeNull();
    });
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

  it('drawer shows the evaluation link only to the interviewer of a completed interview', async () => {
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
        await waitFor(() => expect(link).toBeVisible());
        expect(link).toHaveAttribute('href', href);
      } else {
        expect(screen.queryByRole('link', { name: /đánh giá/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
      }
      drawer.unmount();
    }
  });
});
