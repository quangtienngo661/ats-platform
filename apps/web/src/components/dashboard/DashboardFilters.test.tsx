import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardFilters } from './DashboardFilters';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const jobs = [
  { jobId: 'job-1', title: 'Backend Engineer' },
  { jobId: 'job-2', title: 'QA Engineer' },
];

describe('DashboardFilters (C18)', () => {
  it('shows the current period and job', () => {
    render(<DashboardFilters days={7} jobId="job-2" jobs={jobs} />);

    expect(screen.getByRole('combobox', { name: 'Khoảng thời gian' })).toHaveValue('7');
    expect(screen.getByRole('combobox', { name: 'Tin tuyển dụng' })).toHaveValue('job-2');
  });

  it('changing the period keeps the job in the address', async () => {
    const user = userEvent.setup();
    render(<DashboardFilters days={30} jobId="job-1" jobs={jobs} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), '90');

    expect(push).toHaveBeenLastCalledWith('/dashboard?days=90&jobId=job-1');
  });

  it('choosing all jobs drops the job from the address', async () => {
    const user = userEvent.setup();
    render(<DashboardFilters days={30} jobId="job-1" jobs={jobs} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Tin tuyển dụng' }), '');

    expect(push).toHaveBeenLastCalledWith('/dashboard?days=30');
  });
});
