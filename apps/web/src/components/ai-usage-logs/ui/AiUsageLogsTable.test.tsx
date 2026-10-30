import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IAiUsageLogDto } from '@/types/interfaces/ai-usage-log.interface';
import { AiUsageLogsTable } from './AiUsageLogsTable';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const pagination = { page: 1, limit: 20, total: 2, totalPages: 1 };

const buildLog = (overrides: Partial<IAiUsageLogDto>): IAiUsageLogDto => ({
  logId: 'log-1',
  actionType: 'job_parsing',
  referenceId: null,
  modelName: 'gemini-3.5-flash',
  promptTokens: 100,
  completionTokens: 20,
  durationMs: 800,
  status: 'success',
  createdAt: '2026-10-30T08:00:00.000Z',
  ...overrides,
});

describe('AiUsageLogsTable — embedding calls (P0-C10)', () => {
  it('table renders an embedding row with the label "Embedding"', () => {
    render(
      <AiUsageLogsTable
        logs={[
          buildLog({
            logId: 'log-embedding',
            actionType: 'embedding',
            modelName: 'text-embedding-3-small',
            promptTokens: 42,
            completionTokens: 0,
          }),
          buildLog({ logId: 'log-job' }),
        ]}
        pagination={pagination}
      />,
    );

    expect(screen.getByText('Embedding')).toBeVisible();
    expect(screen.getByText('text-embedding-3-small')).toBeVisible();
    // Control: a row with an existing action type renders through the same table.
    expect(screen.getByText('Job Parsing')).toBeVisible();
  });
});
