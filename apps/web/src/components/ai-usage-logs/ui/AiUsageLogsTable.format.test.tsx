// Component behaviour only: pins how tokens and duration are formatted in a row.
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IAiUsageLogDto } from '@/types/interfaces/ai-usage-log.interface';
import { AiUsageLogsTable } from './AiUsageLogsTable';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const log: IAiUsageLogDto = {
  logId: 'l1', actionType: 'cv_scoring', referenceId: 'ref-123', modelName: 'gemini-3.5-flash',
  promptTokens: 100, completionTokens: 20, durationMs: 2300, status: 'failed',
  createdAt: '2026-10-30T08:00:00.000Z',
};
const one = { page: 1, limit: 20, total: 1, totalPages: 1 };

describe('AiUsageLogsTable — numbers', () => {
  it('shows total, prompt and completion tokens and the duration as formatted today', () => {
    render(<AiUsageLogsTable logs={[log, { ...log, logId: 'l2', durationMs: 800, status: 'success' }]} pagination={{ ...one, total: 2 }} />);
    expect(screen.getAllByText('120')).toHaveLength(2);
    expect(screen.getAllByText('↑ 100')).toHaveLength(2);
    expect(screen.getAllByText('↓ 20')).toHaveLength(2);
    expect(screen.getByText('2.3s')).toBeVisible();
    expect(screen.getByText('800ms')).toBeVisible();
    expect(screen.getByText('Thất bại')).toBeVisible();
    expect(screen.getByText('Thành công')).toBeVisible();
  });

  it('puts mono tabular figures on the token and duration cells and titles the long ids', () => {
    render(<AiUsageLogsTable logs={[log]} pagination={one} />);
    expect(screen.getByText('120')).toHaveClass('font-mono', 'tabular-nums');
    expect(screen.getByText('2.3s')).toHaveClass('font-mono', 'tabular-nums');
    expect(screen.getByText('gemini-3.5-flash')).toHaveAttribute('title', 'gemini-3.5-flash');
    expect(screen.getByText('ref-123')).toHaveAttribute('title', 'ref-123');
  });
});
