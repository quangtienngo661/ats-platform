import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { IApplicationCard } from '@/types/interfaces/application.interface';
import MyApplicationsClient from './MyApplicationsClient';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/stores/useSocketStore', () => ({
  useSocketStore: () => ({ status: 'disconnected', onEvent: vi.fn(), offEvent: vi.fn() }),
}));
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
});

vi.mock('./ui/WithdrawApplicationForm', () => ({ WithdrawApplicationForm: () => null }));

function app(id: string, status: string, jobTitle: string) {
  return { applicationId: id, status, jobTitle, departmentName: 'Kỹ thuật', appliedAt: '2026-09-20T02:00:00.000Z' } as IApplicationCard;
}

describe('MyApplicationsClient', () => {
  it('shows an empty state that leads to the job search when there are no applications', () => {
    render(<MyApplicationsClient applications={[]} />);

    expect(screen.getByRole('heading', { name: 'Chưa có đơn ứng tuyển' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tìm việc' })).toHaveAttribute('href', '/job-postings');
  });

  it('shows the next step of an application that is still in progress', () => {
    render(<MyApplicationsClient applications={[app('a1', 'applied', 'Backend Engineer')]} />);

    expect(screen.getByText('Bước tiếp theo: Đang sàng lọc')).toBeInTheDocument();
  });

  it('shows no next step for a finished application', () => {
    render(<MyApplicationsClient applications={[app('a1', 'rejected', 'Backend Engineer')]} />);

    expect(screen.queryByText(/Bước tiếp theo/)).toBeNull();
  });

  it('filters applications by in-progress and finished', async () => {
    render(
      <MyApplicationsClient
        applications={[app('a1', 'applied', 'Việc đang xử lý'), app('a2', 'rejected', 'Việc đã kết thúc')]}
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: 'Đã kết thúc' }));
    expect(screen.queryByText('Việc đang xử lý')).toBeNull();
    expect(screen.getByText('Việc đã kết thúc')).toBeInTheDocument();
  });
});
