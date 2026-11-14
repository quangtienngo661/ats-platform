// Component behaviour: the steps a candidate reads, with times in the browser's
// timezone (Vietnam here).
import { render, screen, within } from '@testing-library/react';
import { afterAll, describe, expect, it } from 'vitest';
import type { IApplicationHistoryItem } from '@/types/interfaces/application.interface';
import { ApplicationTimeline } from './ApplicationTimeline';

const originalTz = process.env.TZ;
process.env.TZ = 'Asia/Ho_Chi_Minh';

afterAll(() => {
  process.env.TZ = originalTz;
});

const APPLIED_AT = '2026-10-01T02:12:00.000Z';
const steps = () => within(screen.getByRole('list', { name: 'Tiến trình đơn ứng tuyển' })).getAllByRole('listitem');

function renderTimeline(history: IApplicationHistoryItem[], status: string) {
  return render(<ApplicationTimeline history={history} status={status} appliedAt={APPLIED_AT} />);
}

describe('ApplicationTimeline (C8)', () => {
  it('lists the steps oldest first and marks the current one', () => {
    renderTimeline([
      { id: 'h2', fromStatus: 'applied', toStatus: 'screening', changedAt: '2026-10-02T02:00:00.000Z' },
      { id: 'h1', fromStatus: null, toStatus: 'applied', changedAt: APPLIED_AT },
    ], 'screening');

    const items = steps();
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Đã nộp đơn')).toBeInTheDocument();
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(within(items[1]).getByText('Đang sàng lọc')).toBeInTheDocument();
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(within(items[1]).getByText('Hiện tại')).toBeInTheDocument();
  });

  it('shows each time in the browser timezone', () => {
    renderTimeline([{ id: 'h1', fromStatus: null, toStatus: 'applied', changedAt: APPLIED_AT }], 'applied');

    expect(within(steps()[0]).getByText('01/10/2026 09:12')).toBeInTheDocument();
  });

  it('shows the reason under a rejection that has one', () => {
    renderTimeline([
      { id: 'h1', fromStatus: null, toStatus: 'applied', changedAt: APPLIED_AT },
      { id: 'h2', fromStatus: 'applied', toStatus: 'rejected', changedAt: '2026-10-04T03:30:00.000Z', rejectionReason: 'Chưa đủ kinh nghiệm NestJS' },
    ], 'rejected');

    const rejection = steps()[1];
    expect(within(rejection).getByText('Bị từ chối')).toBeInTheDocument();
    expect(within(rejection).getByText('Lý do từ chối')).toBeInTheDocument();
    expect(within(rejection).getByText('Chưa đủ kinh nghiệm NestJS')).toBeInTheDocument();
  });

  it('shows no reason box for a rejection without a reason (E12)', () => {
    renderTimeline([
      { id: 'h1', fromStatus: null, toStatus: 'applied', changedAt: APPLIED_AT },
      { id: 'h2', fromStatus: 'applied', toStatus: 'rejected', changedAt: '2026-10-04T03:30:00.000Z' },
    ], 'rejected');

    expect(within(steps()[1]).getByText('Bị từ chối')).toBeInTheDocument();
    expect(screen.queryByText('Lý do từ chối')).toBeNull();
  });

  it('labels a step back as reconsidered (E4)', () => {
    renderTimeline([
      { id: 'h1', fromStatus: null, toStatus: 'applied', changedAt: APPLIED_AT },
      { id: 'h2', fromStatus: 'applied', toStatus: 'rejected', changedAt: '2026-10-03T02:00:00.000Z' },
      { id: 'h3', fromStatus: 'rejected', toStatus: 'applied', changedAt: '2026-10-04T02:00:00.000Z' },
    ], 'applied');

    expect(within(steps()[2]).getByText('Được xem xét lại')).toBeInTheDocument();
    expect(within(steps()[1]).queryByText('Được xem xét lại')).toBeNull();
  });
});
