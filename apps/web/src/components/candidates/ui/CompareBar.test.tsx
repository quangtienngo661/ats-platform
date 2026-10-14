import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));

describe('CompareBar', () => {
  it('CompareBar enables at 2 to 4 selections, and at 5 it is disabled with the note "Chọn tối đa 4 ứng viên để so sánh"', async () => {
    // Import inside the case so a missing implementation reports this test's name.
    const modulePath = './CompareBar';
    const { CompareBar } = await import(/* @vite-ignore */ modulePath);
    const user = userEvent.setup();
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const note = 'Chọn tối đa 4 ứng viên để so sánh';
    const bar = render(<CompareBar jobId="job-1" selectedIds={[]} />);

    for (const count of [0, 1, 2, 3, 4, 5]) {
      bar.rerender(<CompareBar jobId="job-1" selectedIds={ids.slice(0, count)} />);
      const compare = screen.getByRole('button', { name: 'So sánh' });
      if (count >= 2 && count <= 4) expect(compare).toBeEnabled();
      else expect(compare).toBeDisabled();

      if (count === 5) expect(screen.getByText(note)).toBeVisible();
      else expect(screen.queryByText(note)).not.toBeInTheDocument();

      if (count === 2) {
        const link = screen.queryByRole('link', { name: 'So sánh' });
        if (link) expect(link).toHaveAttribute('href', '/jobs/job-1/compare?ids=a,b');
        else {
          await user.click(compare);
          expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/jobs/job-1/compare?ids=a,b');
        }
      }
    }
  });
});
