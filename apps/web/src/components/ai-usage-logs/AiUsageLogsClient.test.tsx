// Component behaviour only: filtering is client-side over the page of logs the server sent.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IAiUsageLogDto } from '@/types/interfaces/ai-usage-log.interface';
import AiUsageLogsClient from './AiUsageLogsClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const log = (over: Partial<IAiUsageLogDto>): IAiUsageLogDto => ({
  logId: 'l1', actionType: 'job_parsing', referenceId: null, modelName: 'gemini-3.5-flash',
  promptTokens: 100, completionTokens: 20, durationMs: 800, status: 'success',
  createdAt: '2026-10-30T08:00:00.000Z', ...over,
});

const pagination = (total: number) => ({ page: 1, limit: 20, total, totalPages: 1 });

describe('AiUsageLogsClient', () => {
  it('shows the empty state when the server sent no logs', () => {
    render(<AiUsageLogsClient logs={[]} pagination={pagination(0)} />);
    expect(screen.getByRole('heading', { name: 'Chưa có nhật ký AI' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Xóa bộ lọc' })).not.toBeInTheDocument();
  });

  it('shows a no-match state under active filters and clears them', async () => {
    const user = userEvent.setup();
    render(<AiUsageLogsClient logs={[log({})]} pagination={pagination(1)} />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc trạng thái AI' }), 'failed');

    expect(screen.getByRole('heading', { name: 'Không có nhật ký khớp' })).toBeVisible();
    expect(screen.getByText('Hiển thị 0/1 bản ghi')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(screen.queryByRole('heading', { name: 'Không có nhật ký khớp' })).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Lọc trạng thái AI' })).toHaveValue('all');
  });

  it('summarises tokens, average time and success in the stats strip', () => {
    render(<AiUsageLogsClient logs={[log({}), log({ logId: 'l2', status: 'failed', durationMs: 1200 })]} pagination={pagination(2)} />);
    expect(screen.getByText('Tổng tokens').closest('div')).toHaveTextContent('240');
    expect(screen.getByText('Thời gian TB').closest('div')).toHaveTextContent('1.0s');
    expect(screen.getByText('Thành công (1/2)').closest('div')).toHaveTextContent('50%');
  });

  it('keeps the page controls when the filter matches nothing on this page', async () => {
    const user = userEvent.setup();
    render(<AiUsageLogsClient logs={[log({})]} pagination={{ page: 1, limit: 1, total: 3, totalPages: 3 }} />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc trạng thái AI' }), 'failed');
    expect(screen.getByRole('heading', { name: 'Không có nhật ký khớp' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Trang 2' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Tiếp' })).toBeEnabled();
  });

  it('says the page is empty, not that there are no logs, when the page is past the end', () => {
    render(<AiUsageLogsClient logs={[]} pagination={{ page: 5, limit: 20, total: 40, totalPages: 2 }} />);
    expect(screen.queryByRole('heading', { name: 'Chưa có nhật ký AI' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trang này không có nhật ký' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Trang 2' })).toBeVisible();
    // The range of a page that does not exist would read 81–40; only the total is true.
    expect(screen.getByText('40 bản ghi')).toBeVisible();
  });
});
