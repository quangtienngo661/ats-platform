import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import JobPostingsClient from './JobPostingsClient';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/servers/job-postings/job-postings.action', () => ({ deleteJobPostingAction: vi.fn() }));
vi.mock('./ui/MutateJobPostingModal', () => ({ MutateJobPostingModal: () => <div>modal</div> }));

const job = (jobId: string, title: string, status: string) =>
  ({ jobId, title, status, locationType: 'remote', recruiter: { recruiterId: 'r1' }, applications: [] }) as unknown as IJobPostingDto;

const render_ = (jobs: IJobPostingDto[]) =>
  render(
    <JobPostingsClient jobs={jobs} skillsDb={[]} categories={[]} currentRecruiter={null} userRole="admin" />,
  );

describe('JobPostingsClient', () => {
  it('invites the first posting when there are none', () => {
    render_([]);
    expect(screen.getByText('Chưa có tin tuyển dụng')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tạo tin tuyển dụng' }).length).toBeGreaterThan(0);
  });

  it('filters the list by the chosen status', async () => {
    const user = userEvent.setup();
    render_([job('1', 'Dev Alpha', 'active'), job('2', 'Dev Beta', 'draft'), job('3', 'Dev Gamma', 'closed')]);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);

    const tabs = screen.getByRole('radiogroup', { name: 'Lọc theo trạng thái' });
    await user.click(within(tabs).getByRole('radio', { name: /Bản nháp/ }));
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Dev Beta');
  });

  it('says so when no posting matches the filter', async () => {
    const user = userEvent.setup();
    render_([job('1', 'Dev Alpha', 'active')]);
    await user.click(within(screen.getByRole('radiogroup', { name: 'Lọc theo trạng thái' })).getByRole('radio', { name: /Đã đóng/ }));
    expect(screen.getByText('Không có tin phù hợp')).toBeInTheDocument();
  });
});
