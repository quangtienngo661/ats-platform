import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserStatus } from '@ats-platform/types';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { BulkScreeningBar } from './BulkScreeningBar';

const mocks = vi.hoisted(() => ({ bulk: vi.fn() }));
vi.mock('@/servers/applications/applications.action', () => ({
  bulkScreenApplicationsAction: mocks.bulk,
}));

const jobId = '10000000-0000-4000-8000-000000000001';
const configId = '20000000-0000-4000-8000-000000000001';
const aiProfiles: ConfigProfile[] = [{
  configId,
  name: 'Cấu hình mặc định',
  isDefault: true,
  skillsWeight: 40,
  experienceWeight: 40,
  educationWeight: 20,
  minimumScoreThreshold: 60,
}];
const applications: IApplicationDto[] = Array.from({ length: 51 }, (_, index) => ({
  applicationId: `30000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  jobId,
  cvId: `cv-${index + 1}`,
  status: 'screening',
  appliedAt: '2026-10-13T08:00:00.000Z',
  candidate: {
    candidateId: `candidate-${index + 1}`,
    userId: `user-${index + 1}`,
    user: {
      fullName: `Ứng viên ${index + 1}`,
      email: `candidate-${index + 1}@ats.test`,
      status: UserStatus.active,
      createdAt: '2026-10-01T00:00:00.000Z',
    },
  },
  jobPosting: {
    title: 'Frontend Engineer',
    departmentId: 'department-1',
    department: { name: 'Kỹ thuật' },
  },
  screening: null,
}));

describe('BulkScreeningBar', () => {
  beforeEach(() => {
    mocks.bulk.mockReset().mockResolvedValue({
      success: true,
      message: 'Đã gửi yêu cầu',
      data: { queued: [], skipped: [], remaining: 0 },
    });
  });

  it('BulkScreeningBar enables "Chấm AI (n đã chọn)" from 1 to 50 and disables it at 0 and 51 with the note', async () => {
    const user = userEvent.setup();
    const bar = (count: number) => (
      <BulkScreeningBar jobId={jobId} applications={applications}
        selectedApplications={applications.slice(0, count)} aiProfiles={aiProfiles} />
    );
    const { rerender } = render(bar(0));

    for (const count of [0, 1, 50, 51]) {
      rerender(bar(count));
      const button = screen.getByRole('button', { name: `Chấm AI (${count} đã chọn)` });
      if (count === 0 || count > 50) expect(button).toBeDisabled();
      else expect(button).toBeEnabled();
      if (count > 50) {
        expect(screen.getByText('Chọn tối đa 50 đơn để chấm cùng lúc')).toBeVisible();
      } else {
        expect(screen.queryByText('Chọn tối đa 50 đơn để chấm cùng lúc')).not.toBeInTheDocument();
      }
    }

    rerender(bar(1));
    await user.click(screen.getByRole('button', { name: 'Chấm AI (1 đã chọn)' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Bắt đầu chấm' }));
    await waitFor(() => expect(mocks.bulk).toHaveBeenCalledExactlyOnceWith(jobId, {
      applicationIds: [applications[0].applicationId],
      moveAppliedToScreening: false,
      configId,
    }));
  });

  it('"Chấm mọi đơn đủ điều kiện" is always enabled', async () => {
    const user = userEvent.setup();
    const bar = (count: number, allApplications = applications) => (
      <BulkScreeningBar jobId={jobId} applications={allApplications}
        selectedApplications={applications.slice(0, count)} aiProfiles={aiProfiles} />
    );
    const { rerender } = render(bar(0));
    for (const count of [0, 1, 50, 51]) {
      rerender(bar(count));
      expect(screen.getByRole('button', { name: 'Chấm mọi đơn đủ điều kiện' })).toBeEnabled();
    }
    rerender(bar(0, []));
    const autoButton = screen.getByRole('button', { name: 'Chấm mọi đơn đủ điều kiện' });
    expect(autoButton).toBeEnabled();
    await user.click(autoButton);
    expect(screen.getByRole('dialog')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Bắt đầu chấm' }));
    await waitFor(() => expect(mocks.bulk).toHaveBeenCalledExactlyOnceWith(jobId, {
      moveAppliedToScreening: false,
      configId,
    }));
    expect(mocks.bulk.mock.calls[0][1]).not.toHaveProperty('applicationIds');
  });
});
