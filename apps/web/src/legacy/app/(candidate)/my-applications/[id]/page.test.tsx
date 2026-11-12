// The candidate's application page (D9): one request, the job it is for, and its timeline.
import { render, screen, within } from '@testing-library/react';
import { afterAll, describe, expect, it, vi } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import { getApplicationByIdAction } from '@/servers/applications/applications.action';
import ApplicationPage from './page';

vi.mock('@/servers/applications/applications.action', () => ({ getApplicationByIdAction: vi.fn() }));

const originalTz = process.env.TZ;
process.env.TZ = 'Asia/Ho_Chi_Minh';

afterAll(() => {
  process.env.TZ = originalTz;
});

const fetchApplication = vi.mocked(getApplicationByIdAction);

const application = {
  applicationId: 'app-1',
  jobId: 'job-1',
  cvId: 'cv-1',
  status: 'rejected',
  appliedAt: '2026-10-01T02:12:00.000Z',
  jobPosting: { title: 'Backend Engineer', departmentId: 'dep-1', department: { name: 'Kỹ thuật' } },
  history: [
    { id: 'h1', fromStatus: null, toStatus: 'applied', changedAt: '2026-10-01T02:12:00.000Z' },
    { id: 'h2', fromStatus: 'applied', toStatus: 'rejected', changedAt: '2026-10-04T03:30:00.000Z', rejectionReason: 'Thiếu NestJS' },
  ],
} as unknown as IApplicationDto;

async function renderPage(id = 'app-1') {
  render(await ApplicationPage({ params: Promise.resolve({ id }) }));
}

describe('ApplicationPage (C8, D9)', () => {
  it('shows the job, its status and the timeline of the application', async () => {
    fetchApplication.mockResolvedValueOnce(application);

    await renderPage();

    expect(fetchApplication).toHaveBeenCalledWith('app-1');
    expect(screen.getByRole('heading', { level: 1, name: 'Backend Engineer' })).toBeInTheDocument();
    expect(screen.getByText('Kỹ thuật')).toBeInTheDocument();
    expect(screen.getByText('Từ chối')).toBeInTheDocument();
    expect(screen.getByText('Nộp ngày 01/10/2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đơn ứng tuyển' })).toHaveAttribute('href', '/my-applications');
    const steps = within(screen.getByRole('list', { name: 'Tiến trình đơn ứng tuyển' })).getAllByRole('listitem');
    expect(steps).toHaveLength(2);
    expect(within(steps[1]).getByText('Thiếu NestJS')).toBeInTheDocument();
  });

  it('hands the browser only what the page shows, not the AI screening or CV details', async () => {
    fetchApplication.mockResolvedValueOnce({
      ...application,
      screening: { aiReasoning: 'Lý giải nội bộ của AI về ứng viên', aiScore: 72 },
      cv: { fileName: 'cv-noi-bo.pdf' },
      candidate: { user: { email: 'ung-vien@ats.test' } },
    } as unknown as IApplicationDto);

    const element = await ApplicationPage({ params: Promise.resolve({ id: 'app-1' }) });
    const sentToBrowser = JSON.stringify(element.props);

    expect(sentToBrowser).toContain('Backend Engineer');
    expect(sentToBrowser).toContain('Thiếu NestJS');
    expect(sentToBrowser).not.toContain('Lý giải nội bộ của AI');
    expect(sentToBrowser).not.toContain('cv-noi-bo.pdf');
    expect(sentToBrowser).not.toContain('ung-vien@ats.test');
  });

  it("leaves another candidate's application to the error boundary (403)", async () => {
    fetchApplication.mockRejectedValueOnce(new Error('Không thể tải dữ liệu. Vui lòng thử lại.'));

    await expect(ApplicationPage({ params: Promise.resolve({ id: 'someone-else' }) })).rejects.toThrow('Không thể tải dữ liệu');
  });
});
