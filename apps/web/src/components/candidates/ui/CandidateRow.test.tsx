import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import { CandidateRow } from './CandidateRow';
import { CandidatesFilters } from './CandidatesFilters';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const applications: IApplicationDto[] = Array.from({ length: 8 }, (_, index) => ({
  applicationId: `app-${index + 1}`,
  jobId: 'job-1',
  cvId: `cv-${index + 1}`,
  status: 'interview',
  appliedAt: '2026-10-14T02:00:00.000Z',
  candidate: {
    candidateId: `candidate-${index + 1}`,
    userId: `user-${index + 1}`,
    user: {
      fullName: `Nguyễn Văn ${index + 1}`,
      email: `candidate-${index + 1}@ats.test`,
      status: 'active',
      createdAt: '2026-10-01T02:00:00.000Z',
    },
  },
  screening: null,
}));

describe('CandidateRow', () => {
  it('CandidateRow keeps its checkbox enabled with any number of other rows selected (the limit belongs to CompareBar)', async () => {
    const user = userEvent.setup();
    const application = applications[0];
    const onToggle = vi.fn();
    const props = { application, jobId: 'job-1', selected: false, onToggle };
    const standalone = render(<table><tbody><CandidateRow {...props} /></tbody></table>);
    const checkbox = screen.getByRole('checkbox', { name: 'Chọn Nguyễn Văn 1' });
    expect(within(screen.getByRole('row')).getAllByRole('cell')[0]).toContainElement(checkbox);
    expect(checkbox).toBeEnabled();
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(onToggle).toHaveBeenCalledExactlyOnceWith('app-1');

    standalone.rerender(<table><tbody><CandidateRow {...props} selected /></tbody></table>);
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeEnabled();
    await user.click(checkbox);
    expect(onToggle).toHaveBeenNthCalledWith(2, 'app-1');
    standalone.unmount();

    // Exercise the real shared selection state with zero through seven other rows.
    render(<CandidatesFilters applications={applications} jobId="job-1" aiProfiles={[]} />);
    const target = screen.getByRole('checkbox', { name: 'Chọn Nguyễn Văn 1' });
    expect(target).toBeEnabled();
    for (const other of applications.slice(1)) {
      await user.click(screen.getByRole('checkbox', { name: `Chọn ${other.candidate?.user?.fullName}` }));
      expect(target).toBeEnabled();
      expect(target).not.toBeChecked();
    }
    await user.click(target);
    expect(target).toBeChecked();
    expect(target).toBeEnabled();
    expect(screen.getByRole('button', { name: 'So sánh' })).toBeDisabled();
    expect(screen.getByText('Chọn tối đa 4 ứng viên để so sánh')).toBeVisible();
    await user.click(target);
    expect(target).not.toBeChecked();
    expect(target).toBeEnabled();
  });
});
