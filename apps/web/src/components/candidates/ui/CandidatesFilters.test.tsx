import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserStatus } from '@ats-platform/types';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { CandidateRow } from './CandidateRow';
import { CandidatesFilters } from './CandidatesFilters';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/servers/applications/applications.action', () => ({
  bulkScreenApplicationsAction: vi.fn(),
  exportCandidatesCsvAction: vi.fn(),
}));

const jobId = '10000000-0000-4000-8000-000000000001';
const aiProfiles: ConfigProfile[] = [{
  configId: '20000000-0000-4000-8000-000000000001',
  name: 'Cấu hình mặc định',
  isDefault: true,
  skillsWeight: 40,
  experienceWeight: 40,
  educationWeight: 20,
  minimumScoreThreshold: 60,
}];

function application(
  index: number,
  name = `Ứng viên ${index}`,
  status = 'screening',
  title = 'Frontend Engineer',
): IApplicationDto {
  return {
    applicationId: `30000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    jobId,
    cvId: `cv-${index}`,
    candidateId: `candidate-${index}`,
    status,
    appliedAt: '2026-10-13T08:00:00.000Z',
    candidate: {
      candidateId: `candidate-${index}`,
      userId: `user-${index}`,
      currentTitle: title,
      yearsOfExperience: 3,
      user: {
        fullName: name,
        email: `candidate-${index}@ats.test`,
        status: UserStatus.active,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    },
    jobPosting: {
      title,
      departmentId: 'department-1',
      department: { name: 'Kỹ thuật' },
    },
    screening: null,
  };
}

describe('candidate selection', () => {
  it('CandidateRow keeps its checkbox enabled with any number of other rows selected', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const applications = Array.from({ length: 52 }, (_, index) => application(index + 1));
    const target = applications[51];
    // The count lives in the parent; the row only receives selected/onToggle.
    const table = (otherSelectedCount: number, targetSelected = false) => (
      <table><tbody>
        {applications.map((app, index) => {
          const props = {
            application: app,
            jobId,
            selected: index === 51 ? targetSelected : index < otherSelectedCount,
            onToggle,
          };
          return <CandidateRow key={app.applicationId} {...props} />;
        })}
      </tbody></table>
    );
    const { rerender } = render(table(0));

    for (const otherSelectedCount of [0, 4, 50, 51]) {
      rerender(table(otherSelectedCount));
      const checkbox = screen.getByRole('checkbox', { name: 'Chọn Ứng viên 52' });
      expect(checkbox).toBeEnabled();
      expect(checkbox).not.toBeChecked();
      expect(screen.getAllByRole('checkbox').filter(input => (input as HTMLInputElement).checked))
        .toHaveLength(otherSelectedCount);

      await user.click(checkbox);
      expect(onToggle).toHaveBeenLastCalledWith(target.applicationId);
      rerender(table(otherSelectedCount, true));
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeEnabled();
    }
  });

  it('"Chọn tất cả" selects every visible row and clears them again', async () => {
    const user = userEvent.setup();
    const applications = [
      application(1, 'Nguyễn An', 'applied'),
      application(2, 'Trần Bình', 'applied'),
      application(3, 'Lê Chi', 'screening'),
      application(4, 'Nguyễn Dũng', 'applied', 'Backend Engineer'),
    ];
    const props = { applications, jobId, aiProfiles };
    render(<CandidatesFilters {...props} />);
    const search = screen.getByRole('textbox', { name: 'Tìm ứng viên' });
    await user.click(screen.getByRole('button', { name: /^Mới/ }));
    await user.type(search, 'Frontend');
    expect(screen.getByText('Nguyễn An')).toBeVisible();
    expect(screen.getByText('Trần Bình')).toBeVisible();
    expect(screen.queryByText('Lê Chi')).not.toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Dũng')).not.toBeInTheDocument();

    const selectAll = screen.getByRole('checkbox', { name: 'Chọn tất cả' });
    await user.click(selectAll);
    expect(selectAll).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Chọn Nguyễn An' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Chọn Trần Bình' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Chấm AI (2 đã chọn)' })).toBeEnabled();

    // Reveal excluded rows to prove neither search nor status exclusions were selected.
    await user.clear(search);
    await user.click(screen.getByRole('button', { name: /^Tất cả/ }));
    expect(screen.getByRole('checkbox', { name: 'Chọn Lê Chi' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Chọn Nguyễn Dũng' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Chọn Nguyễn An' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Chọn Trần Bình' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: /^Mới/ }));
    await user.type(search, 'Frontend');
    await user.click(selectAll);
    expect(selectAll).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Chọn Nguyễn An' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Chọn Trần Bình' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Chấm AI (0 đã chọn)' })).toBeDisabled();
  });
});
