import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ICvDto } from '@/types/interfaces/cv.interface';
import { CvStoreProvider } from '@/stores/useCvStore';
import { deleteCvAction } from '@/servers/cvs/cvs.action';
import MyCvsClient from './MyCvsClient';

vi.mock('@/stores/useSocketStore', () => ({
  useSocketStore: () => ({ status: 'disconnected', onEvent: vi.fn(), offEvent: vi.fn() }),
}));
vi.mock('@/servers/cvs/cvs.action', () => ({
  deleteCvAction: vi.fn(),
  uploadCvAction: vi.fn(),
  confirmCvAction: vi.fn(),
}));
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
});

function cv(id: string, fileName: string, parsingStatus: ICvDto['parsingStatus']) {
  return { cvId: id, fileName, parsingStatus, uploadedAt: '2026-09-20T02:00:00.000Z', parsedData: null } as unknown as ICvDto;
}

function renderPage(cvs: ICvDto[]) {
  return render(
    <CvStoreProvider initialState={cvs}>
      <MyCvsClient />
    </CvStoreProvider>,
  );
}

describe('MyCvsClient', () => {
  it('shows an empty state with an upload action when there are no CVs', () => {
    renderPage([]);

    expect(screen.getByRole('heading', { name: 'Chưa có CV nào' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tải CV lên' })).toHaveLength(2);
  });

  it('lists each CV with its parse status', () => {
    renderPage([cv('1', 'cv-backend.pdf', 'processing'), cv('2', 'cv-old.pdf', 'failed')]);

    expect(screen.getByText('cv-backend.pdf')).toBeInTheDocument();
    expect(screen.getByText('Đang phân tích')).toBeInTheDocument();
    expect(screen.getByText('Lỗi phân tích')).toBeInTheDocument();
  });

  it('opens the upload dialog from the toolbar button', async () => {
    renderPage([cv('1', 'cv-backend.pdf', 'completed')]);

    await userEvent.click(screen.getByRole('button', { name: 'Tải CV lên' }));

    expect(screen.getByRole('dialog', { name: 'Tải CV lên' })).toBeInTheDocument();
  });

  describe('deleting a CV', () => {
    async function openDeleteDialog() {
      renderPage([cv('1', 'cv-backend.pdf', 'completed')]);
      await userEvent.click(screen.getByRole('button', { name: 'Tùy chọn cho cv-backend.pdf' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Xóa' }));
    }

    it('asks for confirmation and does not delete until "Xóa CV" is clicked', async () => {
      vi.mocked(deleteCvAction).mockClear();
      vi.mocked(deleteCvAction).mockResolvedValue({ success: true, message: 'Đã xóa' } as never);
      await openDeleteDialog();

      expect(screen.getByRole('dialog', { name: 'Xóa CV?' })).toBeInTheDocument();
      expect(screen.getByText('CV "cv-backend.pdf" sẽ bị xóa khỏi hồ sơ của bạn.')).toBeInTheDocument();
      expect(deleteCvAction).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: 'Xóa CV' }));

      await waitFor(() => expect(deleteCvAction).toHaveBeenCalledWith('1'));
      await waitFor(() => expect(screen.queryByText('cv-backend.pdf')).toBeNull());
    });

    it('closes without deleting when "Giữ lại" is clicked', async () => {
      vi.mocked(deleteCvAction).mockClear();
      await openDeleteDialog();

      await userEvent.click(screen.getByRole('button', { name: 'Giữ lại' }));

      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Xóa CV?' })).toBeNull());
      expect(deleteCvAction).not.toHaveBeenCalled();
      expect(screen.getByText('cv-backend.pdf')).toBeInTheDocument();
    });
  });
});
