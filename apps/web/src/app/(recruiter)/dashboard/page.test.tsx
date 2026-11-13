import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDashboardStatsAction } from '@/servers/applications/dashboard.action';
import HRDashboard from './page';

vi.mock('@/lib/ui-variant', () => ({ getUiVariant: async () => 'modern' }));
vi.mock('@/servers/applications/dashboard.action', () => ({ getDashboardStatsAction: vi.fn() }));
vi.mock('@/components/dashboard/ApplicationsTrendChart', () => ({ default: () => <div>chart</div> }));

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: true,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HRDashboard page', () => {
  it('has a visible title, no breadcrumb and shows the stats', async () => {
    vi.mocked(getDashboardStatsAction).mockResolvedValue({
      totalApplications: 42,
      openJobs: 5,
      recentApplications: [],
      jobPostings: [],
    });
    render(await HRDashboard());
    expect(screen.getByRole('heading', { level: 1, name: 'Bảng điều khiển' })).toBeVisible();
    expect(screen.queryByText('HR Portal')).not.toBeInTheDocument();
    expect(screen.getByText('Tổng ứng viên').parentElement).toHaveTextContent('42');
    expect(screen.getByRole('link', { name: /Quản lý tuyển dụng/ })).toHaveAttribute('href', '/jobs');
    expect(screen.getByText('Chưa có tin đang tuyển')).toBeInTheDocument();
    expect(screen.getByText('Chưa có ứng viên mới')).toBeInTheDocument();
  });
});
