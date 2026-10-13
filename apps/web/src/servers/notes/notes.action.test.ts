// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNoteAction, deleteNoteAction, getNotesAction, updateNoteAction } from './notes.action';

const mocks = vi.hoisted(() => ({
  post: vi.fn(), patch: vi.fn(), delete: vi.fn(), get: vi.fn(), revalidate: vi.fn(), rethrow: vi.fn(),
}));
vi.mock('@/lib/http', () => ({
  default: { post: mocks.post, patch: mocks.patch, delete: mocks.delete, get: mocks.get },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/navigation', () => ({ unstable_rethrow: mocks.rethrow }));

const apiNote = {
  id: 'note-1',
  applicationId: 'app-1',
  body: 'hello',
  createdAt: '2026-10-14T02:00:00.000Z',
  updatedAt: '2026-10-14T02:00:00.000Z',
  author: { userId: 'user-2', fullName: 'Nguyễn An' },
};

describe('note actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.post.mockResolvedValue({ data: apiNote });
    mocks.patch.mockResolvedValue({ data: apiNote });
    mocks.delete.mockResolvedValue({ data: { id: 'note-1' } });
  });

  it('createNoteAction trims and refuses an empty body before calling the API', async () => {
    const refused = { success: false, message: 'Ghi chú không được để trống' };
    expect(await createNoteAction('app-1', ' \n\t ')).toEqual(refused);
    expect(await updateNoteAction('note-1', ' \n\t ')).toEqual(refused);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.patch).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();

    const result = await createNoteAction('app-1', '  hello  ');

    expect(mocks.post).toHaveBeenCalledExactlyOnceWith('/applications/app-1/notes', { body: 'hello' });
    expect(result).toMatchObject({ success: true, data: apiNote });
    expect(mocks.revalidate).toHaveBeenCalled();
  });

  it('refuses a body over 2000 characters before calling the API', async () => {
    const refused = { success: false, message: 'Ghi chú không được vượt quá 2000 ký tự' };
    expect(await createNoteAction('app-1', 'x'.repeat(2001))).toEqual(refused);
    expect(await updateNoteAction('note-1', 'x'.repeat(2001))).toEqual(refused);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.patch).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();

    const body = 'x'.repeat(2000);
    mocks.post.mockResolvedValueOnce({ data: { ...apiNote, body } });
    mocks.patch.mockResolvedValueOnce({ data: { ...apiNote, body } });
    expect(await createNoteAction('app-1', `  ${body}  `)).toMatchObject({ success: true });
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith('/applications/app-1/notes', { body });
    expect(mocks.revalidate).toHaveBeenCalled();
    mocks.revalidate.mockClear();
    expect(await updateNoteAction('note-1', `  ${body}  `)).toMatchObject({ success: true });
    expect(mocks.patch).toHaveBeenCalledExactlyOnceWith('/application-notes/note-1', { body });
    expect(mocks.revalidate).toHaveBeenCalled();
  });

  it('updateNoteAction and deleteNoteAction call the note endpoints', async () => {
    const updated = { ...apiNote, body: 'updated', updatedAt: '2026-10-14T03:00:00.000Z' };
    mocks.patch.mockResolvedValueOnce({ data: updated });

    const result = await updateNoteAction('note-1', '  updated  ');

    expect(mocks.patch).toHaveBeenCalledExactlyOnceWith('/application-notes/note-1', { body: 'updated' });
    expect(result).toMatchObject({ success: true, data: updated });
    expect(mocks.revalidate).toHaveBeenCalled();
    mocks.revalidate.mockClear();

    expect(await deleteNoteAction('note-1')).toMatchObject({ success: true });
    expect(mocks.delete).toHaveBeenCalledExactlyOnceWith('/application-notes/note-1');
    expect(mocks.revalidate).toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('getNotesAction passes the page', async () => {
    const page = { items: [apiNote], pagination: { page: 2, limit: 20, total: 21, totalPages: 2 } };
    mocks.get.mockResolvedValueOnce({ data: page });

    await expect(getNotesAction('app-1', 2)).resolves.toEqual(page);
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith('/applications/app-1/notes', { params: { page: 2 } });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('read actions rethrow with the standard message', async () => {
    const error = new Error('offline');
    mocks.get.mockRejectedValueOnce(error);
    const result = getNotesAction('app-1');

    await expect(result).rejects.toThrow('Không thể tải dữ liệu. Vui lòng thử lại.');
    await expect(result).rejects.toMatchObject({ cause: error });
    expect(mocks.rethrow).toHaveBeenCalledWith(error);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('shows the API Vietnamese message when a write is refused', async () => {
    const message = 'Chỉ tác giả được sửa hoặc xoá ghi chú';
    const error = { response: { status: 403, data: { message } } };
    mocks.post.mockRejectedValueOnce(error);
    mocks.patch.mockRejectedValueOnce(error);
    mocks.delete.mockRejectedValueOnce(error);

    expect(await createNoteAction('app-1', 'hello')).toEqual({ success: false, message });
    expect(mocks.rethrow).toHaveBeenCalledWith(error);
    mocks.rethrow.mockClear();
    expect(await updateNoteAction('note-1', 'hello')).toEqual({ success: false, message });
    expect(mocks.rethrow).toHaveBeenCalledWith(error);
    mocks.rethrow.mockClear();
    expect(await deleteNoteAction('note-1')).toEqual({ success: false, message });
    expect(mocks.rethrow).toHaveBeenCalledWith(error);
    expect(mocks.revalidate).not.toHaveBeenCalled();

    const redirect = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;replace;/sign-in;307;' });
    mocks.post.mockRejectedValueOnce(redirect);
    mocks.rethrow.mockImplementationOnce(() => { throw redirect; });
    await expect(createNoteAction('app-1', 'hello')).rejects.toBe(redirect);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
