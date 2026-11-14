import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { compareApplicationsAction } from '@/servers/applications/applications.action';

vi.mock('@/servers/applications/applications.action', () => ({ compareApplicationsAction: vi.fn() }));

const compare = vi.mocked(compareApplicationsAction);
const ids = Array.from({ length: 5 }, (_, index) => `00000000-0000-4000-8000-00000000000${index + 1}`);

describe('ComparePage', () => {
  it('compare page shows the error and a back link for a bad ids list', async () => {
    const modulePath = './page';
    const { default: ComparePage } = await import(/* @vite-ignore */ modulePath);
    const invalidLists: Record<string, string>[] = [
      {},
      { ids: '' },
      { ids: ids[0] },
      { ids: [ids[0], ids[0]].join(',') },
      { ids: ids.join(',') },
      { ids: 'not-a-uuid,also-not-a-uuid' },
      { ids: `${ids[0]},${ids[1]},` },
    ];

    for (const searchParams of invalidLists) {
      compare.mockReset();
      compare.mockRejectedValue(new Error('Chỉ so sánh từ 2 đến 4 ứng viên khác nhau'));
      // Mirror the existing async server page tests: await the page, then render.
      const page = render(await ComparePage({
        params: Promise.resolve({ jobId: 'job-1' }),
        searchParams: Promise.resolve(searchParams),
      }));
      expect(screen.getByText(/không hợp lệ|không thể|lỗi|2.*4|trùng/i)).toBeVisible();
      expect(screen.getByRole('link', { name: 'Quay lại danh sách' }))
        .toHaveAttribute('href', '/jobs/job-1/candidates');
      page.unmount();
    }

    // A valid pair still renders the action's failure with a way back.
    const message = 'Không thể tải dữ liệu. Vui lòng thử lại.';
    compare.mockReset();
    compare.mockRejectedValueOnce(new Error(message));
    render(await ComparePage({
      params: Promise.resolve({ jobId: 'job-1' }),
      searchParams: Promise.resolve({ ids: ids.slice(0, 2).join(',') }),
    }));
    expect(compare).toHaveBeenCalledExactlyOnceWith('job-1', ids.slice(0, 2));
    expect(screen.getByText(message)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Quay lại danh sách' }))
      .toHaveAttribute('href', '/jobs/job-1/candidates');
  });
});
