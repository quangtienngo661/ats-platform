'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from '@/lib/toast';
import {
  createNoteAction,
  deleteNoteAction,
  getNotesAction,
  updateNoteAction,
  type NoteActionState,
} from '@/servers/notes/notes.action';
import { StickyNote } from 'lucide-react';
import { Button, EmptyState, Field, Skeleton, Surface, Textarea } from '@/components/ui';
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
export function NotesPanel({ applicationId, currentUserId }: NotesPanelProps) {
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
      className="space-y-4"
    >
      <h2 className="text-title-sm text-ink">Ghi chú</h2>
      <form onSubmit={addNote} className="space-y-3 rounded-card bg-surface p-4 shadow-e1">
        <Field label="Ghi chú mới" hint={`${body.length}/2000 ký tự`}>
          {(control) => (
            <Textarea
              {...control}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={2000}
              rows={3}
              disabled={saving}
            />
          )}
        </Field>
        <Button
          type="submit"
          disabled={saving || loading || !body.trim() || body.trim().length > 2000}
        >
          Thêm ghi chú
        </Button>
      </form>
      {saving && (
        <p role="status" className="text-body-sm text-ink-3">
          Đang lưu thay đổi…
        </p>
      )}
      {writeError && (
        <p role="alert" className="text-body-sm text-danger">
          {writeError}
        </p>
      )}
      {loading ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">Đang tải ghi chú…</span>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : loadError ? (
        <Surface className="p-4">
          <p role="alert" className="text-body-sm text-danger">
            {loadError}
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => setReload((value) => value + 1)}
          >
            Thử lại
          </Button>
        </Surface>
      ) : notes.length === 0 ? (
        <Surface>
          <EmptyState
            icon={StickyNote}
            title="Chưa có ghi chú."
            description="Ghi lại nhận định để cả nhóm cùng xem."
          />
        </Surface>
      ) : (
        notes.map((note) => (
          <Surface as="article" key={note.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-sm font-medium text-ink">
                {note.author.fullName}
              </p>
              <time dateTime={note.createdAt} className="text-caption text-ink-3">
                {dateFormat.format(new Date(note.createdAt))}
              </time>
            </div>
            {editing?.id === note.id && note.author.userId === currentUserId ? (
              <form onSubmit={(event) => saveNote(event, note)} className="space-y-3">
                <Field label="Sửa ghi chú">
                  {(control) => (
                    <Textarea
                      {...control}
                      value={editing.body}
                      onChange={(event) =>
                        setEditing({ id: note.id, body: event.target.value })
                      }
                      rows={3}
                      maxLength={2000}
                      disabled={saving}
                    />
                  )}
                </Field>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={
                      saving ||
                      !editing.body.trim() ||
                      editing.body.trim().length > 2000
                    }
                  >
                    Lưu ghi chú
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={saving}
                    onClick={() => setEditing(null)}
                  >
                    Huỷ
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words text-body text-ink-2">
                  {note.body}
                </p>
                {note.author.userId === currentUserId && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={saving}
                      onClick={() => {
                        setEditing({ id: note.id, body: note.body });
                        setWriteError(null);
                      }}
                    >
                      Sửa ghi chú
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger"
                      disabled={saving}
                      onClick={() => {
                        if (note.author.userId === currentUserId)
                          void write(
                            () => deleteNoteAction(note.id),
                            () => setEditing(null),
                          );
                      }}
                    >
                      Xoá ghi chú
                    </Button>
                  </div>
                )}
              </>
            )}
          </Surface>
        ))
      )}
    </section>
  );
}
