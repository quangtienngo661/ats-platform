import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IApplicationNote, IPaginatedApplicationNotes } from '@/types/interfaces/evaluation.interface';
import { NotesPanel } from './NotesPanel';

const mocks = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }));
vi.mock('@/servers/notes/notes.action', () => ({
  getNotesAction: mocks.get,
  createNoteAction: mocks.create,
  updateNoteAction: mocks.update,
  deleteNoteAction: mocks.remove,
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const applicationId = 'app-1';
const currentUserId = 'user-1';
const mine: IApplicationNote = {
  id: 'note-mine',
  applicationId,
  body: 'Cần hỏi thêm về kinh nghiệm làm việc nhóm.',
  createdAt: '2026-10-13T02:00:00.000Z',
  updatedAt: '2026-10-13T02:00:00.000Z',
  author: { userId: currentUserId, fullName: 'Trần Thị B' },
};
const theirs: IApplicationNote = {
  id: 'note-theirs',
  applicationId,
  body: 'Ứng viên có thể bắt đầu vào tháng sau.',
  createdAt: '2026-10-14T02:00:00.000Z',
  updatedAt: '2026-10-14T02:00:00.000Z',
  author: { userId: 'user-2', fullName: 'Lê Văn C' },
};

function notesPage(items: IApplicationNote[]): IPaginatedApplicationNotes {
  return { items, pagination: { page: 1, limit: 20, total: items.length, totalPages: 1 } };
}

beforeEach(() => {
  mocks.get.mockReset();
  mocks.create.mockReset();
  mocks.update.mockReset();
  mocks.remove.mockReset();
  mocks.get.mockResolvedValue(notesPage([theirs, mine]));
});

describe('NotesPanel', () => {
  it('NotesPanel shows edit and delete only on my own notes', async () => {
    render(<NotesPanel applicationId={applicationId} currentUserId={currentUserId} />);
    expect(await screen.findByText(mine.body)).toBeVisible();
    expect(screen.getByText(theirs.body)).toBeVisible();
    expect(mocks.get).toHaveBeenCalledWith(applicationId);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent(theirs.body);
    expect(cards[1]).toHaveTextContent(mine.body);
    const otherNote = within(cards[0]);
    const myNote = within(cards[1]);
    expect(otherNote.getByText(theirs.author.fullName)).toBeVisible();
    expect(myNote.getByText(mine.author.fullName)).toBeVisible();
    expect(otherNote.getByText(/14\/10\/2026/)).toBeVisible();
    expect(myNote.getByText(/13\/10\/2026/)).toBeVisible();
    expect(myNote.getByRole('button', { name: /Sửa|Chỉnh sửa/i })).toBeEnabled();
    expect(myNote.getByRole('button', { name: /Xoá|Xóa/i })).toBeEnabled();
    expect(otherNote.queryByRole('button', { name: /Sửa|Chỉnh sửa/i })).not.toBeInTheDocument();
    expect(otherNote.queryByRole('button', { name: /Xoá|Xóa/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Sửa|Chỉnh sửa/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /Xoá|Xóa/i })).toHaveLength(1);
  });

  it('NotesPanel adds a note and clears the box', async () => {
    const user = userEvent.setup();
    const body = 'Đã xác nhận thời gian nhận việc với ứng viên.';
    const added: IApplicationNote = {
      ...mine,
      id: 'note-new',
      body,
      createdAt: '2026-10-14T03:00:00.000Z',
      updatedAt: '2026-10-14T03:00:00.000Z',
    };
    mocks.get.mockResolvedValueOnce(notesPage([theirs, mine]))
      .mockResolvedValue(notesPage([added, theirs, mine]));
    mocks.create.mockResolvedValue({ success: true, message: 'Đã thêm ghi chú', data: added });
    render(<NotesPanel applicationId={applicationId} currentUserId={currentUserId} />);
    expect(await screen.findByText(mine.body)).toBeVisible();
    const box = screen.getByRole('textbox', { name: /Ghi chú/i });
    await user.type(box, body);
    await user.click(screen.getByRole('button', { name: 'Thêm ghi chú' }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledExactlyOnceWith(applicationId, body));
    await waitFor(() => expect(box).toHaveValue(''));
    expect(await screen.findByText(body)).toBeVisible();
    expect(screen.getAllByRole('article')[0]).toHaveTextContent(body);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
