// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { IApplicationHistoryItem } from '@/types/interfaces/application.interface';
import { buildTimeline } from './build-timeline';

const APPLIED_AT = '2026-10-01T02:12:00.000Z';

function step(id: string, fromStatus: string | null, toStatus: string, changedAt: string, rejectionReason?: string): IApplicationHistoryItem {
  return { id, fromStatus, toStatus, changedAt, ...(rejectionReason ? { rejectionReason } : {}) };
}

const labels = (history: IApplicationHistoryItem[], status: string) =>
  buildTimeline(history, { status, appliedAt: APPLIED_AT }).map((item) => item.label);

describe('buildTimeline (C8)', () => {
  it('lists the steps oldest first whatever order they arrive in', () => {
    const history = [
      step('h3', 'screening', 'interview', '2026-10-03T02:00:00.000Z'),
      step('h1', null, 'applied', APPLIED_AT),
      step('h2', 'applied', 'screening', '2026-10-02T02:00:00.000Z'),
    ];

    expect(labels(history, 'interview')).toEqual(['Đã nộp đơn', 'Đang sàng lọc', 'Vòng phỏng vấn']);
  });

  it('keeps the API order for steps stamped at the same instant', () => {
    const history = [
      step('h1', null, 'applied', APPLIED_AT),
      step('h2', 'applied', 'screening', APPLIED_AT),
    ];

    expect(buildTimeline(history, { status: 'screening', appliedAt: APPLIED_AT }).map((item) => item.key)).toEqual(['h1', 'h2']);
  });

  it('shows a lone "Đã nộp đơn" step, current, when an older application has no history (E13)', () => {
    expect(buildTimeline([], { status: 'applied', appliedAt: APPLIED_AT })).toEqual([
      { key: 'applied', status: 'applied', label: 'Đã nộp đơn', at: APPLIED_AT, isCurrent: true, isRevert: false },
    ]);
  });

  it('adds the "Đã nộp đơn" step from appliedAt when its row is missing (E13)', () => {
    const timeline = buildTimeline([step('h2', 'applied', 'screening', '2026-10-02T02:00:00.000Z')], {
      status: 'screening',
      appliedAt: APPLIED_AT,
    });

    expect(timeline.map((item) => [item.label, item.at])).toEqual([
      ['Đã nộp đơn', APPLIED_AT],
      ['Đang sàng lọc', '2026-10-02T02:00:00.000Z'],
    ]);
  });

  it('keeps a step back and marks it as a revert (E4)', () => {
    const timeline = buildTimeline([
      step('h1', null, 'applied', APPLIED_AT),
      step('h2', 'applied', 'screening', '2026-10-02T02:00:00.000Z'),
      step('h3', 'screening', 'rejected', '2026-10-03T02:00:00.000Z'),
      step('h4', 'rejected', 'screening', '2026-10-04T02:00:00.000Z'),
      step('h5', 'screening', 'interview', '2026-10-05T02:00:00.000Z'),
      step('h6', 'interview', 'screening', '2026-10-06T02:00:00.000Z'),
    ], { status: 'screening', appliedAt: APPLIED_AT });

    expect(timeline.map((item) => [item.label, item.isRevert])).toEqual([
      ['Đã nộp đơn', false],
      ['Đang sàng lọc', false],
      ['Bị từ chối', false],
      ['Đang sàng lọc', true],
      ['Vòng phỏng vấn', false],
      ['Đang sàng lọc', true],
    ]);
  });

  it('ends a withdrawn application on "Đã rút đơn" (E5)', () => {
    const timeline = buildTimeline([
      step('h1', null, 'applied', APPLIED_AT),
      step('h2', 'applied', 'cancelled', '2026-10-02T02:00:00.000Z'),
    ], { status: 'cancelled', appliedAt: APPLIED_AT });

    expect(timeline.at(-1)).toMatchObject({ label: 'Đã rút đơn', isCurrent: true });
    expect(timeline.filter((item) => item.isCurrent)).toHaveLength(1);
  });

  it('carries the rejection reason the API sent', () => {
    const [, rejection] = buildTimeline([
      step('h1', null, 'applied', APPLIED_AT),
      step('h2', 'applied', 'rejected', '2026-10-04T03:30:00.000Z', 'Thiếu NestJS'),
    ], { status: 'rejected', appliedAt: APPLIED_AT });

    expect(rejection).toMatchObject({ label: 'Bị từ chối', rejectionReason: 'Thiếu NestJS', isCurrent: true });
  });
});
