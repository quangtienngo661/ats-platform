// Component behaviour only: what the form submits. The API round trip and the stored
// instant are proven by the GĐ2 schedule e2e (web server under TZ=UTC).
import { fireEvent, render, screen } from '@testing-library/react';
import { afterAll, describe, expect, it, vi } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import type { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import type { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { MutateInterviewScheduleModal } from './MutateInterviewScheduleModal';

const originalTz = process.env.TZ;
process.env.TZ = 'Asia/Ho_Chi_Minh';

vi.mock('@/servers/interviews/interviews.action', () => ({
  createInterviewScheduleAction: vi.fn(async () => ({ success: false, message: '' })),
  updateInterviewScheduleAction: vi.fn(async () => ({ success: false, message: '' })),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterAll(() => {
  process.env.TZ = originalTz;
});

const application = {
  applicationId: 'app-1',
  status: 'interview',
  candidate: { user: { fullName: 'Nguyễn Văn A' } },
  jobPosting: { title: 'Backend Engineer', organizationId: 'org-1', department: { organizationId: 'org-1' } },
} as unknown as IApplicationDto;

const interviewer = {
  recruiterId: 'rec-1',
  position: 'Tech Lead',
  user: { userId: 'user-2', fullName: 'Trần Thị B', role: 'recruiter', status: 'active' },
  department: { organizationId: 'org-1' },
} as unknown as IRecruiterDto;

function renderModal(schedule?: IInterviewSchedule) {
  return render(
    <MutateInterviewScheduleModal
      schedule={schedule}
      applications={[application]}
      interviewers={[interviewer]}
      currentRecruiter={null}
      userRole="recruiter"
      defaultDate="2026-10-04"
      minDate="2026-10-03"
      onClose={vi.fn()}
    />,
  );
}

function startAtField() {
  return document.querySelector<HTMLInputElement>('input[type="hidden"][name="startAt"]');
}

describe('MutateInterviewScheduleModal — start time (C17)', () => {
  it('carries the start time converted in the browser', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText('Ngày phỏng vấn'), { target: { value: '2026-10-05' } });
    fireEvent.change(screen.getByLabelText('Giờ phỏng vấn'), { target: { value: '09:00' } });

    expect(startAtField()).not.toBeNull();
    expect(startAtField()).toHaveValue('2026-10-05T02:00:00.000Z');
  });

  it('prefills the local time when editing', () => {
    renderModal({
      interviewId: 'int-1',
      applicationId: 'app-1',
      interviewerId: 'user-2',
      scheduledBy: 'user-2',
      interviewType: 'onsite',
      startAt: '2026-10-05T02:00:00.000Z',
      durationMinutes: 60,
      onlineMeetingLink: null,
      status: 'scheduled',
      application,
      interviewer: { userId: 'user-2', fullName: 'Trần Thị B', email: 'b@ats.test' },
      scheduler: { userId: 'user-2', fullName: 'Trần Thị B', email: 'b@ats.test' },
    } as IInterviewSchedule);

    expect(screen.getByLabelText('Giờ phỏng vấn')).toHaveValue('09:00');
    expect(screen.getByLabelText('Ngày phỏng vấn')).toHaveValue('2026-10-05');
  });
});
