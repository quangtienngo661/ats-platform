import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { IAiCostSummary, IRecruitmentAnalytics } from '@/types/interfaces/analytics.interface';
import { RecruitmentFunnel, TimeInStage, formatPercent } from './RecruitmentFunnel';
import { AiCostPanel, formatUsd } from './AiCostPanel';

const funnel: IRecruitmentAnalytics['funnel'] = [
  { stage: 'applied', reached: 5, conversion: null },
  { stage: 'screening', reached: 4, conversion: 0.8 },
  { stage: 'interview', reached: 3, conversion: 0.75 },
  { stage: 'offer', reached: 2, conversion: 0.6667 },
  { stage: 'hired', reached: 1, conversion: 0.5 },
];

describe('RecruitmentFunnel (C18)', () => {
  it('lists every stage with how many applications reached it and the rate from the stage before', () => {
    render(<RecruitmentFunnel funnel={funnel} outcomes={{ rejected: 2, cancelled: 1 }} />);

    const steps = within(screen.getByRole('region', { name: 'Phễu tuyển dụng' })).getAllByRole('listitem');
    expect(steps.map((s) => s.getAttribute('aria-label'))).toEqual([
      'Ứng tuyển: 5 đơn',
      'Sàng lọc: 4 đơn',
      'Phỏng vấn: 3 đơn',
      'Offer: 2 đơn',
      'Đã tuyển: 1 đơn',
    ]);
    expect(steps[3]).toHaveTextContent('66,7% so với bước trước');
    expect(steps[0]).not.toHaveTextContent('so với bước trước');
    expect(screen.getByText(/Từ chối:/)).toHaveTextContent('Từ chối: 2 · Ứng viên rút đơn: 1');
  });

  it('shows a dash, not 0%, when there was nothing to convert from', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(0)).toBe('0%');
  });
});

describe('TimeInStage (C18)', () => {
  it('shows the mean days and the number of stays, a dash where there are none', () => {
    render(
      <TimeInStage
        timeInStage={[
          { stage: 'applied', averageDays: 1.5, samples: 4 },
          { stage: 'screening', averageDays: null, samples: 0 },
          { stage: 'interview', averageDays: 3, samples: 1 },
          { stage: 'offer', averageDays: null, samples: 0 },
        ]}
      />,
    );

    const row = (name: string) => screen.getByRole('row', { name: new RegExp(`^${name}`) });
    expect(within(row('Ứng tuyển')).getAllByRole('cell').map((c) => c.textContent)).toEqual(['1,5', '4']);
    expect(within(row('Sàng lọc')).getAllByRole('cell').map((c) => c.textContent)).toEqual(['—', '0']);
  });
});

const cost = (overrides: Partial<IAiCostSummary> = {}): IAiCostSummary => ({
  range: { from: '2026-10-21T00:00:00.000Z', to: '2026-11-20T00:00:00.000Z' },
  organizationId: 'org-1',
  items: [
    { month: '2026-11', actionType: 'cv_scoring', calls: 4, failedCalls: 1, promptTokens: 1_000_000, completionTokens: 250_000, estimatedCostUsd: 4 },
  ],
  totals: { calls: 4, promptTokens: 1_000_000, completionTokens: 250_000, estimatedCostUsd: 4 },
  modelsWithoutPrice: [],
  ...overrides,
});

describe('AiCostPanel (C18)', () => {
  it('shows each month and task with its tokens and estimated cost', () => {
    render(<AiCostPanel cost={cost()} />);

    const table = screen.getByRole('table', { name: 'Chi phí AI theo tháng và tác vụ' });
    const [, dataRow] = within(table).getAllByRole('row');
    expect(within(dataRow).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      '2026-11', 'Chấm CV', '4 (1 lỗi)', '1.000.000', '250.000', '$4.00',
    ]);
    expect(screen.getByText(/^Tổng:/)).toHaveTextContent('Tổng: $4.00 · 4 lượt gọi');
  });

  it('says which models have no price instead of showing a cost that leaves them out', () => {
    render(
      <AiCostPanel
        cost={cost({
          items: [{ ...cost().items[0], estimatedCostUsd: null }],
          totals: { ...cost().totals, estimatedCostUsd: null },
          modelsWithoutPrice: ['gpt-x'],
        })}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Chưa có giá cho: gpt-x. Tổng chi phí chưa tính được.');
    expect(screen.getByText(/^Tổng:/)).toHaveTextContent('Tổng: Chưa có giá');
  });

  it('an empty period says so', () => {
    render(<AiCostPanel cost={cost({ items: [], totals: { calls: 0, promptTokens: 0, completionTokens: 0, estimatedCostUsd: 0 } })} />);

    expect(screen.getByText('Chưa có lượt gọi AI nào trong kỳ')).toBeInTheDocument();
  });

  it('formats small costs without rounding them to zero', () => {
    expect(formatUsd(0.000123)).toBe('$0.000123');
    expect(formatUsd(12.5)).toBe('$12.50');
  });
});
