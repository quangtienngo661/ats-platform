import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jobPosting } from '@/test/fixtures/job-posting';

const { applyForJobAction, getMyCvsAction } = vi.hoisted(() => ({
  applyForJobAction: vi.fn(),
  getMyCvsAction: vi.fn(),
}));

vi.mock('@/servers/applications/applications.action', () => ({ applyForJobAction }));
vi.mock('@/servers/cvs/cvs.action', () => ({ getMyCvsAction }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ApplyButton } from './ApplyButton';

const cv = (cvId: string, fileName: string, confirmed = true) => ({
  cvId,
  fileName,
  uploadedAt: '2026-01-02T00:00:00Z',
  parsedData: { isConfirmed: confirmed },
});

describe('ApplyButton — the apply sheet', () => {
  beforeEach(() => {
    applyForJobAction.mockReset().mockResolvedValue({ success: false, message: '' });
    getMyCvsAction.mockReset().mockResolvedValue([cv('cv-1', 'first.pdf'), cv('cv-2', 'second.pdf'), cv('cv-3', 'draft.pdf', false)]);
  });

  it('opens a sheet listing the confirmed CVs as radios with the first checked', async () => {
    const user = userEvent.setup();
    render(<ApplyButton job={jobPosting()} isLoggedIn available />);

    await user.click(screen.getByRole('button', { name: 'Ứng tuyển ngay' }));

    expect(await screen.findByRole('dialog', { name: 'Ứng tuyển' })).toBeInTheDocument();
    expect(await screen.findByRole('radiogroup')).toBeInTheDocument();
    const radios = await screen.findAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(screen.getByRole('radio', { name: /first\.pdf/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /second\.pdf/ })).not.toBeChecked();
    expect(screen.queryByText('draft.pdf')).toBeNull();
  });

  it('submits the selected CV id to the apply action', async () => {
    const user = userEvent.setup();
    render(<ApplyButton job={jobPosting()} isLoggedIn available />);

    await user.click(screen.getByRole('button', { name: 'Ứng tuyển ngay' }));
    await user.click(await screen.findByRole('radio', { name: /second\.pdf/ }));
    await user.click(screen.getByRole('button', { name: 'Nộp đơn ứng tuyển' }));

    await waitFor(() => expect(applyForJobAction).toHaveBeenCalledTimes(1));
    const formData = applyForJobAction.mock.calls[0][1] as FormData;
    expect(formData.get('cvId')).toBe('cv-2');
    expect(formData.get('jobId')).toBe('job-1');
  });

  it('links a visitor to sign-in instead of opening the sheet', () => {
    render(<ApplyButton job={jobPosting()} isLoggedIn={false} available />);

    expect(screen.getByRole('link', { name: /Đăng nhập để ứng tuyển/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/sign-in?'),
    );
  });

  it('offers a retry when the CVs cannot be loaded', async () => {
    getMyCvsAction.mockRejectedValueOnce(new Error('x'));
    const user = userEvent.setup();
    render(<ApplyButton job={jobPosting()} isLoggedIn available />);

    await user.click(screen.getByRole('button', { name: 'Ứng tuyển ngay' }));
    await user.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByRole('radio', { name: /first\.pdf/ })).toBeChecked();
  });
});
