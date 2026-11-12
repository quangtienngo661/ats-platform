import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScreeningSkipReason, UserStatus } from '@ats-platform/types';
import type { IBulkScreeningResult } from '@ats-platform/types';
import type { BulkScreeningActionState } from '@/servers/applications/applications.action';
import { SCREENING_SKIP_REASON_LABELS } from '@/types/constants/screening-skip-reasons';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { BulkScreeningDialog } from './BulkScreeningDialog';

const mocks = vi.hoisted(() => ({ bulk: vi.fn() }));
vi.mock('@/servers/applications/applications.action', () => ({
  bulkScreenApplicationsAction: mocks.bulk,
}));

const jobId = '10000000-0000-4000-8000-000000000001';
const chosenConfigId = '20000000-0000-4000-8000-000000000001';
const defaultConfigId = '20000000-0000-4000-8000-000000000002';
// Put the default second so selecting the first profile cannot accidentally pass.
const aiProfiles: ConfigProfile[] = [
  {
    configId: chosenConfigId,
    name: 'Ưu tiên kỹ năng',
    isDefault: false,
    skillsWeight: 60,
    experienceWeight: 30,
    educationWeight: 10,
    minimumScoreThreshold: 70,
  },
  {
    configId: defaultConfigId,
    name: 'Cấu hình mặc định',
    isDefault: true,
    skillsWeight: 40,
    experienceWeight: 40,
    educationWeight: 20,
    minimumScoreThreshold: 60,
  },
];
const applications: IApplicationDto[] = [
  { name: 'Nguyễn An', status: 'applied' },
  { name: 'Trần Bình', status: 'applied' },
  { name: 'Lê Chi', status: 'screening' },
  { name: 'Nguyễn Dũng', status: 'applied' },
].map(({ name, status }, index) => ({
  applicationId: `30000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  jobId,
  cvId: `cv-${index + 1}`,
  status,
  appliedAt: '2026-10-13T08:00:00.000Z',
  candidate: {
    candidateId: `candidate-${index + 1}`,
    userId: `user-${index + 1}`,
    currentTitle: 'Frontend Engineer',
    yearsOfExperience: 3,
    user: {
      fullName: name,
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
const selectedApplications = applications.slice(0, 3);
const selectedMode = { kind: 'selected' as const, applications: selectedApplications };
const moveLabel = "Chuyển các đơn ở 'Mới' sang 'Sàng lọc' trước khi chấm";
const success: BulkScreeningActionState = {
  success: true,
  message: 'Đã gửi yêu cầu',
  data: { queued: [], skipped: [], remaining: 0 },
};

describe('BulkScreeningDialog', () => {
  beforeEach(() => {
    mocks.bulk.mockReset().mockResolvedValue(success);
  });

  it('the dialog leaves the move box unticked and sends moveAppliedToScreening false', async () => {
    const user = userEvent.setup();
    render(<BulkScreeningDialog jobId={jobId} mode={selectedMode}
      applications={applications} aiProfiles={aiProfiles} onClose={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: moveLabel })).not.toBeChecked();
    expect(screen.getByRole('combobox')).toHaveValue(defaultConfigId);

    await user.click(screen.getByRole('button', { name: 'Bắt đầu chấm' }));
    await waitFor(() => expect(mocks.bulk).toHaveBeenCalledExactlyOnceWith(jobId, {
      applicationIds: selectedApplications.map(app => app.applicationId),
      moveAppliedToScreening: false,
      configId: defaultConfigId,
    }));
  });

  it('counts the applied applications in the selection', () => {
    render(<BulkScreeningDialog jobId={jobId} mode={selectedMode}
      applications={applications} aiProfiles={aiProfiles} onClose={vi.fn()} />);
    expect(screen.getByText("2 đơn đang ở 'Mới'")).toBeVisible();
    expect(screen.queryByText("3 đơn đang ở 'Mới'")).not.toBeInTheDocument();
  });

  it('sends the chosen config and the selected ids', async () => {
    const user = userEvent.setup();
    render(<BulkScreeningDialog jobId={jobId} mode={selectedMode}
      applications={applications} aiProfiles={aiProfiles} onClose={vi.fn()} />);
    await user.selectOptions(screen.getByRole('combobox'), chosenConfigId);
    await user.click(screen.getByRole('checkbox', { name: moveLabel }));
    await user.click(screen.getByRole('button', { name: 'Bắt đầu chấm' }));

    await waitFor(() => expect(mocks.bulk).toHaveBeenCalledExactlyOnceWith(jobId, {
      applicationIds: selectedApplications.map(app => app.applicationId),
      moveAppliedToScreening: true,
      configId: chosenConfigId,
    }));
  });

  it('sends no ids in auto mode', async () => {
    const user = userEvent.setup();
    render(<BulkScreeningDialog jobId={jobId} mode={{ kind: 'auto' }}
      applications={applications} aiProfiles={aiProfiles} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Bắt đầu chấm' }));

    await waitFor(() => expect(mocks.bulk).toHaveBeenCalledExactlyOnceWith(jobId, {
      moveAppliedToScreening: false,
      configId: defaultConfigId,
    }));
    expect(mocks.bulk.mock.calls[0][1]).not.toHaveProperty('applicationIds');
  });

  it('a second click while the request runs sends nothing', async () => {
    let resolveRequest!: (result: BulkScreeningActionState) => void;
    const pendingRequest = new Promise<BulkScreeningActionState>(resolve => {
      resolveRequest = resolve;
    });
    mocks.bulk.mockReturnValueOnce(pendingRequest);
    const user = userEvent.setup();
    render(<BulkScreeningDialog jobId={jobId} mode={selectedMode}
      applications={applications} aiProfiles={aiProfiles} onClose={vi.fn()} />);
    const start = screen.getByRole('button', { name: 'Bắt đầu chấm' });

    await user.click(start);
    expect(start).toBeDisabled();
    await user.click(start);
    // Resolve only after both clicks and the single-call assertion.
    expect(mocks.bulk).toHaveBeenCalledTimes(1);
    await act(async () => { resolveRequest(success); });
  });

  it('shows queued, skipped with Vietnamese labels, and remaining', async () => {
    const data: IBulkScreeningResult = {
      queued: [
        { applicationId: applications[1].applicationId, movedToScreening: true },
        { applicationId: applications[2].applicationId, movedToScreening: false },
      ],
      skipped: Object.values(ScreeningSkipReason).map((reason, index) => ({
        applicationId: reason === ScreeningSkipReason.APPLIED_NOT_MOVED
          ? applications[0].applicationId
          : `f000000${index}-0000-4000-8000-000000000001`,
        reason,
        movedToScreening: reason === ScreeningSkipReason.ENQUEUE_FAILED,
      })),
      remaining: 7,
    };
    mocks.bulk.mockResolvedValueOnce({ ...success, data });
    const user = userEvent.setup();
    render(<BulkScreeningDialog jobId={jobId} mode={{ kind: 'auto' }}
      applications={applications} aiProfiles={aiProfiles} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Bắt đầu chấm' }));

    expect(await screen.findByText('Đã đưa 2 đơn vào hàng đợi')).toBeVisible();
    expect(screen.getByText('Bỏ qua 8 đơn')).toBeVisible();
    const dialog = screen.getByRole('dialog');
    for (const item of data.skipped) {
      const name = applications.find(app => app.applicationId === item.applicationId)
        ?.candidate?.user?.fullName || `Mã đơn ${item.applicationId.slice(0, 8)}`;
      expect(dialog).toHaveTextContent(`${name}: ${SCREENING_SKIP_REASON_LABELS[item.reason]}`);
    }
    expect(screen.getByText('Còn 7 đơn đủ điều kiện chưa chấm, bấm lại để chấm tiếp')).toBeVisible();
  });

  it('says "Không có đơn nào cần chấm" for an empty auto run', async () => {
    const user = userEvent.setup();
    render(<BulkScreeningDialog jobId={jobId} mode={{ kind: 'auto' }}
      applications={applications} aiProfiles={aiProfiles} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Bắt đầu chấm' }));

    expect(await screen.findByText('Không có đơn nào cần chấm')).toBeVisible();
  });

  it("shows the action's error and stays open", async () => {
    const message = 'Không tìm thấy cấu hình AI';
    mocks.bulk.mockResolvedValueOnce({ success: false, message });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<BulkScreeningDialog jobId={jobId} mode={selectedMode}
      applications={applications} aiProfiles={aiProfiles} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Bắt đầu chấm' }));

    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Bắt đầu chấm' })).toBeEnabled();
  });
});
