'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { toast } from '@/lib/toast';
import {
  createNoteAction,
  deleteNoteAction,
  getNotesAction,
  updateNoteAction,
  type NoteActionState,
} from '@/servers/notes/notes.action';
import { SF, SFT } from '@/types/fonts/fonts';
import type { IApplicationNote } from '@/types/interfaces/evaluation.interface';

interface NotesPanelProps {
  applicationId: string;
  currentUserId: string;
}

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const textareaClass =
  'w-full border border-[#E5E5EA] rounded-xl p-3 text-[14px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3] disabled:bg-[#F5F5F7]';
const buttonClass =
  'min-h-11 px-4 py-2 text-[13px] rounded-xl transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]';

export function NotesPanel({ applicationId, currentUserId }: NotesPanelProps) {
  const formId = useId();
  const [notes, setNotes] = useState<IApplicationNote[]>([]);
  const [body, setBody] = useState('');
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const page = await getNotesAction(applicationId);
        const allNotes = [...page.items];
        for (let next = 2; next <= page.pagination.totalPages; next++) {
          const additional = await getNotesAction(applicationId, next);
          if (!active) return;
          allNotes.push(...additional.items);
        }
        if (active) setNotes(allNotes);
      } catch {
        if (active) setLoadError('Không thể tải ghi chú. Vui lòng thử lại.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [applicationId, reload]);

  async function write(
    action: () => Promise<NoteActionState>,
    onSuccess: () => void,
  ) {
    if (saving) return;
    setSaving(true);
    setWriteError(null);
    try {
      const result = await action();
      if (!result.success) {
        setWriteError(result.message);
        toast.error(result.message);
        return;
      }
      onSuccess();
      toast.success(result.message);
      setReload((value) => value + 1);
    } catch {
      const message = 'Không thể lưu thay đổi ghi chú. Vui lòng thử lại.';
      setWriteError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text || text.length > 2000 || loading) return;
    void write(
      () => createNoteAction(applicationId, text),
      () => setBody(''),
    );
  }

  function saveNote(event: FormEvent<HTMLFormElement>, note: IApplicationNote) {
    event.preventDefault();
    const text = editing?.body.trim();
    if (
      !text ||
      text.length > 2000 ||
      editing?.id !== note.id ||
      note.author.userId !== currentUserId
    )
      return;
    void write(
      () => updateNoteAction(note.id, text),
      () => setEditing(null),
    );
  }

  return (
    <section
      aria-label="Nội dung ghi chú"
      aria-busy={loading || saving}
      className="space-y-5"
      style={{ fontFamily: SFT }}
    >
      <h2
        className="text-[16px] text-[#1D1D1F]"
        style={{ fontFamily: SF, fontWeight: 600 }}
      >
        Ghi chú
      </h2>
      <form
        onSubmit={addNote}
        className="bg-white rounded-2xl border border-[#F2F2F7] p-6 space-y-3"
      >
        <label
          htmlFor={`${formId}-new`}
          className="block text-[13px] text-[#1D1D1F]"
          style={{ fontWeight: 500 }}
        >
          Ghi chú mới
        </label>
        <textarea
          id={`${formId}-new`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          rows={3}
          disabled={saving}
          aria-describedby={`${formId}-limit`}
          className={textareaClass}
        />
        <p id={`${formId}-limit`} className="text-[12px] text-[#6E6E73]">
          {body.length}/2000 ký tự
        </p>
        <button
          type="submit"
          disabled={
            saving || loading || !body.trim() || body.trim().length > 2000
          }
          className={`${buttonClass} bg-[#0071E3] text-white hover:bg-[#005BB5]`}
          style={{ fontWeight: 600 }}
        >
          Thêm ghi chú
        </button>
      </form>
      {saving && (
        <p role="status" className="text-[13px] text-[#6E6E73]">
          Đang lưu thay đổi...
        </p>
      )}
      {writeError && (
        <p role="alert" className="text-[13px] text-[#DC2626]">
          {writeError}
        </p>
      )}
      {loading ? (
        <p role="status" className="text-[14px] text-[#6E6E73]">
          Đang tải ghi chú...
        </p>
      ) : loadError ? (
        <div className="bg-white rounded-2xl border border-[#F2F2F7] p-6">
          <p role="alert" className="text-[13px] text-[#DC2626]">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className={`${buttonClass} mt-3 border border-[#E5E5EA] text-[#0071E3] hover:bg-[#F5F5F7]`}
          >
            Thử lại
          </button>
        </div>
      ) : notes.length === 0 ? (
        <p className="bg-white rounded-2xl border border-[#F2F2F7] p-6 text-[14px] text-[#6E6E73]">
          Chưa có ghi chú.
        </p>
      ) : (
        notes.map((note) => (
          <article
            key={note.id}
            className="bg-white rounded-2xl border border-[#F2F2F7] p-6 space-y-3"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p
                className="text-[14px] text-[#1D1D1F]"
                style={{ fontFamily: SF, fontWeight: 600 }}
              >
                {note.author.fullName}
              </p>
              <time
                dateTime={note.createdAt}
                className="text-[12px] text-[#6E6E73]"
              >
                {dateFormat.format(new Date(note.createdAt))}
              </time>
            </div>
            {editing?.id === note.id && note.author.userId === currentUserId ? (
              <form
                onSubmit={(event) => saveNote(event, note)}
                className="space-y-3"
              >
                <label
                  htmlFor={`${formId}-${note.id}`}
                  className="block text-[13px] text-[#1D1D1F]"
                >
                  Sửa ghi chú
                </label>
                <textarea
                  id={`${formId}-${note.id}`}
                  value={editing.body}
                  onChange={(event) =>
                    setEditing({ id: note.id, body: event.target.value })
                  }
                  rows={3}
                  maxLength={2000}
                  disabled={saving}
                  className={textareaClass}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !editing.body.trim() ||
                      editing.body.trim().length > 2000
                    }
                    className={`${buttonClass} bg-[#0071E3] text-white hover:bg-[#005BB5]`}
                  >
                    Lưu ghi chú
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditing(null)}
                    className={`${buttonClass} border border-[#E5E5EA] text-[#6E6E73] hover:bg-[#F5F5F7]`}
                  >
                    Huỷ
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-[14px] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap break-words">
                  {note.body}
                </p>
                {note.author.userId === currentUserId && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setEditing({ id: note.id, body: note.body });
                        setWriteError(null);
                      }}
                      className={`${buttonClass} border border-[#E5E5EA] text-[#0071E3] hover:bg-[#F5F5F7]`}
                    >
                      Sửa ghi chú
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        if (note.author.userId === currentUserId)
                          void write(
                            () => deleteNoteAction(note.id),
                            () => setEditing(null),
                          );
                      }}
                      className={`${buttonClass} border border-[#E5E5EA] text-[#DC2626] hover:bg-[#FEF2F2]`}
                    >
                      Xoá ghi chú
                    </button>
                  </div>
                )}
              </>
            )}
          </article>
        ))
      )}
    </section>
  );
}
