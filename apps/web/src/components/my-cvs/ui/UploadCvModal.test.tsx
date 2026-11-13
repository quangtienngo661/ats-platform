import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { CvStoreProvider } from '@/stores/useCvStore';
import { UploadCvModal } from './UploadCvModal';

vi.mock('@/servers/cvs/cvs.action', () => ({
  uploadCvAction: vi.fn(async () => ({ success: false, message: '' })),
}));
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
});

function setup() {
  render(
    <CvStoreProvider initialState={[]}>
      <UploadCvModal onClose={vi.fn()} />
    </CvStoreProvider>,
  );
  // Bypass the input's accept filter so the component's own check is what runs.
  return userEvent.setup({ applyAccept: false });
}

describe('UploadCvModal', () => {
  it('starts with the submit disabled and the limits shown', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Tải lên' })).toBeDisabled();
    expect(screen.getByText(/PDF, tối đa 5 MB/)).toBeInTheDocument();
  });

  it('rejects a file that is not a PDF and keeps the submit disabled', async () => {
    const user = setup();

    await user.upload(screen.getByLabelText('Chọn tệp CV'), new File(['x'], 'anh.png', { type: 'image/png' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Không tải được tệp. Chỉ nhận tệp PDF.');
    expect(screen.getByRole('button', { name: 'Tải lên' })).toBeDisabled();
    expect(screen.queryByText('anh.png')).toBeNull();
  });

  it('shows a valid PDF by name and enables the submit', async () => {
    const user = setup();

    await user.upload(
      screen.getByLabelText('Chọn tệp CV'),
      new File(['%PDF'], 'cv-backend.pdf', { type: 'application/pdf' }),
    );

    expect(screen.getByText('cv-backend.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Tải lên' })).toBeEnabled();
  });

  it('removes the selected file and disables the submit again', async () => {
    const user = setup();
    await user.upload(
      screen.getByLabelText('Chọn tệp CV'),
      new File(['%PDF'], 'cv-backend.pdf', { type: 'application/pdf' }),
    );

    await user.click(screen.getByRole('button', { name: 'Bỏ tệp đã chọn' }));

    expect(screen.queryByText('cv-backend.pdf')).toBeNull();
    expect(screen.getByRole('button', { name: 'Tải lên' })).toBeDisabled();
  });
});
