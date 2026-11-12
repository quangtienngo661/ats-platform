import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportCsvButton } from './ExportCsvButton';

const mocks = vi.hoisted(() => ({
  exportCandidatesCsvAction: vi.fn(),
  downloadCsv: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/servers/applications/applications.action', () => ({
  exportCandidatesCsvAction: mocks.exportCandidatesCsvAction,
}));
vi.mock('@/lib/toast', () => ({ toast: { error: mocks.error } }));
vi.mock('@/lib/download-csv', () => ({ downloadCsv: mocks.downloadCsv }));

const jobId = '12345678-1234-4abc-8def-1234567890ab';

describe('ExportCsvButton', () => {
  beforeEach(() => {
    mocks.exportCandidatesCsvAction.mockReset();
    mocks.downloadCsv.mockReset();
    mocks.error.mockReset();
  });

  it('ExportCsvButton downloads what the action returns', async () => {
    const result = {
      success: true as const,
      filename: 'ung-vien-12345678-20261014.csv',
      csv: '"Tên ứng viên"\r\n"Nguyễn An"\r\n',
    };
    let resolveRequest!: (value: typeof result) => void;
    mocks.exportCandidatesCsvAction.mockReturnValueOnce(new Promise<typeof result>(resolve => {
      resolveRequest = resolve;
    }));
    const user = userEvent.setup();
    render(<ExportCsvButton jobId={jobId} />);
    const button = screen.getByRole('button', { name: 'Xuất CSV' });
    expect(button).toBeEnabled();

    await user.click(button);
    expect(mocks.exportCandidatesCsvAction).toHaveBeenCalledExactlyOnceWith(jobId);
    expect(button).toBeDisabled();
    expect(mocks.downloadCsv).not.toHaveBeenCalled();
    await user.click(button);
    expect(mocks.exportCandidatesCsvAction).toHaveBeenCalledTimes(1);

    await act(async () => { resolveRequest(result); });
    await waitFor(() => {
      expect(mocks.downloadCsv).toHaveBeenCalledExactlyOnceWith(result.filename, result.csv);
      expect(button).toBeEnabled();
    });
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("ExportCsvButton shows the action's message on failure", async () => {
    const message = 'Tin có quá nhiều đơn để xuất CSV (tối đa 5000)';
    mocks.exportCandidatesCsvAction.mockResolvedValueOnce({ success: false, message });
    const user = userEvent.setup();
    render(<ExportCsvButton jobId={jobId} />);
    const button = screen.getByRole('button', { name: 'Xuất CSV' });

    await user.click(button);

    await waitFor(() => expect(mocks.error).toHaveBeenCalledExactlyOnceWith('Lỗi', message));
    expect(mocks.exportCandidatesCsvAction).toHaveBeenCalledExactlyOnceWith(jobId);
    expect(mocks.downloadCsv).not.toHaveBeenCalled();
    expect(button).toBeEnabled();
  });
});
