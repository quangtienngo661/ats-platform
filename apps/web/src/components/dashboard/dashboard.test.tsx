import { cloneElement, type ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import ApplicationsTrendChart from './ApplicationsTrendChart';
import DashboardKpiCards from './DashboardKpiCards';
import RecruitmentPipeline from './RecruitmentPipeline';
import OpenJobsList from './OpenJobsList';
import RecentCandidates from './RecentCandidates';

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactElement<{ width?: number; height?: number }> }) =>
    cloneElement(children, { width: 600, height: 220 }),
}));

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

describe('DashboardKpiCards', () => {
  it('shows each label with its exact value', () => {
    render(<DashboardKpiCards totalApplications={1526} openJobs={7} hiredThisMonth={3} />);
    expect(screen.getByText('Tổng ứng viên').parentElement).toHaveTextContent('1.526');
    expect(screen.getByText('Vị trí mở').parentElement).toHaveTextContent('7');
    expect(screen.getByText('Đã tuyển tháng này').parentElement).toHaveTextContent('3');
  });
});

describe('RecruitmentPipeline', () => {
  const data = [
    { stage: 'Ứng tuyển', count: 12, color: '#000' },
    { stage: 'Sàng lọc', count: 8, color: '#000' },
    { stage: 'Phỏng vấn', count: 5, color: '#000' },
    { stage: 'Offer', count: 2, color: '#000' },
    { stage: 'Đã tuyển', count: 1, color: '#000' },
  ];

  it('lists every stage with its exact count', () => {
    render(<RecruitmentPipeline data={data} maxCount={12} />);
    const items = within(screen.getByRole('list', { name: 'Ứng viên theo giai đoạn' })).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringMatching(/^Ứng tuyển.*12$/),
      expect.stringMatching(/^Sàng lọc.*8$/),
      expect.stringMatching(/^Phỏng vấn.*5$/),
      expect.stringMatching(/^Offer.*2$/),
      expect.stringMatching(/^Đã tuyển.*1$/),
    ]);
  });

  it('scales each bar to count over max', () => {
    render(<RecruitmentPipeline data={data} maxCount={12} />);
    const bars = screen.getAllByTestId('pipeline-bar');
    expect(bars[0]).toHaveStyle({ transform: 'scaleX(1)' });
    expect(bars[1].style.transform).toBe(`scaleX(${8 / 12})`);
  });

  it('shows an empty state when no stage has candidates', () => {
    render(<RecruitmentPipeline data={data.map((d) => ({ ...d, count: 0 }))} maxCount={1} />);
    expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument();
  });
});

describe('lists', () => {
  it('shows the open jobs empty state', () => {
    render(<OpenJobsList jobs={[]} />);
    expect(screen.getByText('Chưa có tin đang tuyển')).toBeInTheDocument();
  });

  it('shows the recent candidates empty state', () => {
    render(<RecentCandidates applications={[]} />);
    expect(screen.getByText('Chưa có ứng viên mới')).toBeInTheDocument();
  });

  it('links a recent candidate row to its application with a status chip', () => {
    const app = {
      applicationId: 'a1',
      jobId: 'j1',
      status: 'interview',
      appliedAt: '2026-11-01T00:00:00.000Z',
      candidate: { user: { fullName: 'Nguyễn Văn An' } },
      jobPosting: { title: 'Backend Engineer' },
    } as unknown as IApplicationDto;
    render(<RecentCandidates applications={[app]} />);
    const link = screen.getByRole('link', { name: /Nguyễn Văn An/ });
    expect(link).toHaveAttribute('href', '/jobs/j1/candidates/a1');
    expect(link).toHaveTextContent('Phỏng vấn');
  });
});

describe('ApplicationsTrendChart', () => {
  it('colours the gradient through style, not an SVG attribute holding var()', () => {
    const { container } = render(
      <ApplicationsTrendChart data={[{ month: 'T10', value: 2 }, { month: 'T11', value: 5 }]} />,
    );
    const stops = container.querySelector('linearGradient')?.querySelectorAll('stop') ?? [];
    expect(stops).toHaveLength(2);
    stops.forEach((stop) => {
      expect(stop.getAttribute('style')).toContain('var(--accent)');
      expect(stop.hasAttribute('stop-color')).toBe(false);
    });
  });

  it('colours the line and the fill area per curve, not through a shared style', () => {
    const { container } = render(
      <ApplicationsTrendChart data={[{ month: 'T10', value: 2 }, { month: 'T11', value: 5 }]} />,
    );
    const line = container.querySelector('.recharts-area-curve');
    const area = container.querySelector('.recharts-area-area');
    expect([line, area]).not.toContain(null);
    expect(line?.getAttribute('stroke')).toBe('rgb(var(--accent))');
    expect(line?.getAttribute('style') ?? '').not.toContain('fill:');
    expect(area?.getAttribute('style') ?? '').not.toContain('stroke:');
  });

  it('gives each chart its own gradient id and fills its area from that gradient', () => {
    const data = [{ month: 'T10', value: 2 }, { month: 'T11', value: 5 }];
    const { container } = render(
      <>
        <ApplicationsTrendChart data={data} />
        <ApplicationsTrendChart data={data} />
      </>,
    );
    const gradients = [...container.querySelectorAll('linearGradient')];
    const areas = [...container.querySelectorAll('.recharts-area-area')];
    expect(gradients).toHaveLength(2);
    expect(areas).toHaveLength(2);
    const ids = gradients.map((g) => g.id);
    expect(new Set(ids).size).toBe(2);
    // A colon (React's useId) or any other CSS-special character would break url(#…).
    for (const id of ids) expect(id).toMatch(/^[A-Za-z][\w-]*$/);
    expect(areas.map((a) => a.getAttribute('fill'))).toEqual(ids.map((id) => `url(#${id})`));
  });
});
