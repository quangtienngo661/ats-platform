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

/**
 * No delay between events, and no pointer-events check: jsdom loads no stylesheet here, so that check can never find
 * `pointer-events: none` and only costs a computed-style walk up the tree on every click (about 0.1 s per click on
 * this list, which put the test past the 5 s timeout).
 */
const fastUser = () => userEvent.setup({ delay: null, pointerEventsCheck: 0 });

// Measured 13/11/2026, each file alone, 3 runs: 1.2–3.5 s per test after removing the user-event overhead (was 2.5–6 s).
// What remains is real work (52-row tables rendered twice, a cold first render), so the suite's two parallel workers
// can still push a test past the 5 s default. 10 s keeps the gate reliable without hiding a hang.
describe('CandidateRow', { timeout: 10_000 }, () => {
  it('CandidateRow keeps its checkbox enabled with any number of other rows selected (the limit belongs to CompareBar)', async () => {
    const user = fastUser();
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
    // Rows are keyed by application, so these nodes survive every re-render: query once, reuse.
    const [target, ...others] = applications.map(app =>
      screen.getByRole('checkbox', { name: `Chọn ${app.candidate?.user?.fullName}` }));
    const compare = screen.getByRole('button', { name: 'So sánh' });
    expect(target).toBeEnabled();
    for (const other of others) {
      await user.click(other);
      expect(other).toBeChecked();
      expect(target).toBeEnabled();
      expect(target).not.toBeChecked();
    }
    await user.click(target);
    expect(target).toBeChecked();
    expect(target).toBeEnabled();
    expect(compare).toBeDisabled();
    expect(screen.getByText('Chọn tối đa 4 ứng viên để so sánh')).toBeVisible();
    await user.click(target);
    expect(target).not.toBeChecked();
    expect(target).toBeEnabled();
  });
});
