'use client';

import { useEffect, useId, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { ArrowRightLeft, ChevronRight, Clock, Cpu, ExternalLink, MapPin, MoreHorizontal, Star } from 'lucide-react';
import Link from 'next/link';
import { ScreeningStatus } from '@ats-platform/types';
import { Candidate, Stage } from '@/types/interfaces/kanban.interface';
import { DRAG_TYPE, stages } from '../../types/constants/kanban.constants';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/work-types';
import { statusTone, type Tone } from '@/lib/status-tones';
import {
  Avatar,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  IconButton,
  Surface,
} from '@/components/ui';
import { cn } from '@/components/ui/cn';

/**
 * A request from the board to put focus on this card's "Tùy chọn" button:
 * - `now`: after a move from the menu (the card may have just mounted in its new column);
 * - `if-lost`: after the screening dialog closed, only when its opener is gone and focus fell to `<body>`.
 */
export type MenuFocusRequest = 'now' | 'if-lost';

interface KanbanCardProps {
  candidate: Candidate;
  jobId: string;
  onDrop: (dragId: string, dropId: string) => void;
  /** Same path as a drop on a column: every guard of the board applies. */
  onMoveToStage: (id: string, stage: Stage) => void;
  onRequestScreening: (id: string) => void;
  focusMenuTrigger?: MenuFocusRequest;
  /** Called once a focus request has been handled, so the board can drop it. */
  onMenuTriggerFocused?: () => void;
}

type ScreeningLabel = { text: string; tone: Tone };

/** The card's own wording (recruiters rely on it); only the tone comes from the shared table. */
function screeningLabels(candidate: Candidate): ScreeningLabel[] {
  const { screeningStatus: status, stage } = candidate;
  const tone = (value: string) => statusTone('screening', value).tone;
  const labels: ScreeningLabel[] = [];
  const notScreened = !status || status === ScreeningStatus.pending;
  if (notScreened && stage === 'applied') labels.push({ text: 'Chưa sàng lọc', tone: tone(ScreeningStatus.pending) });
  if (notScreened && stage === 'screening') labels.push({ text: 'Chờ AI Sàng lọc', tone: tone(ScreeningStatus.pending) });
  if (status === ScreeningStatus.processing) labels.push({ text: 'Đang AI Sàng lọc', tone: tone(ScreeningStatus.processing) });
  if (status === ScreeningStatus.completed) labels.push({ text: 'Đã AI Sàng lọc', tone: tone(ScreeningStatus.completed) });
  if (candidate.reviewed) labels.push({ text: 'Đã duyệt', tone: 'accent' });
  if (status === ScreeningStatus.failed) labels.push({ text: 'Sàng lọc thất bại', tone: tone(ScreeningStatus.failed) });
  return labels;
}

export default function KanbanCard({
  candidate,
  jobId,
  onDrop,
  onMoveToStage,
  onRequestScreening,
  focusMenuTrigger,
  onMenuTriggerFocused,
}: KanbanCardProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: DRAG_TYPE,
    item: { id: candidate.id },
    collect: m => ({ isDragging: m.isDragging() })
  });

  // No native ghost: KanbanDragLayer draws the lifted card under the pointer.
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const [{ isOver }, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: { id: string }) => {
      if (item.id !== candidate.id) onDrop(item.id, candidate.id);
    },
    collect: m => ({ isOver: m.isOver() }),
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  /** Runs once the menu has closed and focus is back on its trigger, so a dialog it opens returns focus there. */
  const afterClose = useRef<(() => void) | null>(null);
  const hintId = useId();

  useEffect(() => {
    if (!focusMenuTrigger) return;
    if (focusMenuTrigger === 'now') {
      triggerRef.current?.focus();
      onMenuTriggerFocused?.();
      return;
    }
    // A closing dialog returns focus to its opener in a 0 ms timeout; run after it and step in only if that
    // opener was gone (the quick "Sàng lọc" button disappears once screening starts) and focus fell to <body>.
    const timer = window.setTimeout(() => {
      if (!document.activeElement || document.activeElement === document.body) triggerRef.current?.focus();
      onMenuTriggerFocused?.();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focusMenuTrigger, onMenuTriggerFocused]);

  const profileHref = `/jobs/${jobId}/candidates/${candidate.id}`;
  const canScreen = candidate.stage === 'screening' && candidate.screeningStatus !== ScreeningStatus.completed;
  const screeningHint = candidate.stage !== 'screening'
    ? 'Chỉ áp dụng ở bước Sàng lọc'
    : candidate.screeningStatus === ScreeningStatus.completed ? 'Ứng viên này đã được sàng lọc' : undefined;
  const moveTargets = stages.filter(s => s.id !== candidate.stage && s.id !== 'cancelled');
  const labels = screeningLabels(candidate);
  const location = WORK_TYPE_LABELS[candidate.location as WorkType];

  return (
    <div
      ref={(el: HTMLDivElement | null) => { drag(el); drop(el); }}
      className={cn(
        'group relative cursor-grab select-none rounded-card transition-[opacity,transform] duration-hover ease-out-expo active:cursor-grabbing',
        // While dragging, the copy under the pointer is the lifted one; the card left in place only fades.
        isDragging ? 'opacity-40' : 'motion-safe:hover:-translate-y-0.5',
        isOver && !isDragging && 'ring-2 ring-accent',
      )}
    >
      <Surface className="p-3 transition-shadow duration-hover hover:shadow-e3">
        {/* Avatar + name + menu */}
        <div className="flex items-start gap-2.5">
          <Avatar name={candidate.name} size={32} />
          <div className="min-w-0 flex-1">
            <Link
              href={profileHref}
              draggable={false}
              title={candidate.name}
              className="block truncate rounded-ctl text-body-sm font-medium text-ink hover:underline"
            >
              {candidate.name}
            </Link>
            <p className="truncate text-caption text-ink-3" title={candidate.role}>{candidate.role}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton
                ref={triggerRef}
                size="sm"
                aria-label="Tùy chọn"
                className="-mr-1 -mt-1 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)_and_(min-width:1024px)]:opacity-0"
              >
                <MoreHorizontal aria-hidden="true" strokeWidth={1.75} />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onCloseAutoFocus={e => {
                const run = afterClose.current;
                afterClose.current = null;
                if (!run) return;
                e.preventDefault();
                triggerRef.current?.focus();
                run();
              }}
            >
              <DropdownMenuItem asChild>
                <Link href={profileHref}>
                  <ExternalLink aria-hidden="true" strokeWidth={1.75} className="size-4" />
                  Xem hồ sơ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canScreen}
                aria-describedby={screeningHint ? hintId : undefined}
                onSelect={() => { afterClose.current = () => onRequestScreening(candidate.id); }}
              >
                <Cpu aria-hidden="true" strokeWidth={1.75} className="size-4" />
                AI Sàng lọc CV
              </DropdownMenuItem>
              {screeningHint && (
                // role="none": a menu may only own menu items; the text stays visible and serves as the item's description.
                <p id={hintId} role="none" className="pb-1.5 pl-8 pr-2 text-caption text-ink-3">{screeningHint}</p>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft aria-hidden="true" strokeWidth={1.75} className="size-4" />
                    Chuyển sang vòng…
                  </span>
                  <ChevronRight aria-hidden="true" strokeWidth={1.75} className="size-4 text-ink-3" />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {moveTargets.map(s => (
                    <DropdownMenuItem key={s.id} onSelect={() => { afterClose.current = () => onMoveToStage(candidate.id, s.id); }}>
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {labels.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {labels.map(l => <Badge key={l.text} tone={l.tone}>{l.text}</Badge>)}
          </div>
        )}

        {candidate.tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Thẻ">
            {candidate.tags.map(t => (
              <li key={t} className="rounded-ctl bg-surface-2 px-1.5 py-0.5 text-micro text-ink-2">{t}</li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-caption text-ink-3">
          <div className="flex min-w-0 items-center gap-3">
            {location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin aria-hidden="true" strokeWidth={1.75} className="size-3.5 shrink-0" />
                <span className="truncate">{location}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
              {candidate.daysInStage}d
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {candidate.stage === 'screening' && candidate.screeningStatus === ScreeningStatus.pending && (
              <button
                type="button"
                onClick={() => onRequestScreening(candidate.id)}
                className="inline-flex h-6 items-center rounded-ctl px-1 font-medium text-accent-text hover:underline"
              >
                Sàng lọc
              </button>
            )}
            <span className="flex items-center gap-px" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  strokeWidth={1.75}
                  className={cn('size-3', i < candidate.rating ? 'fill-accent stroke-accent' : 'text-line-strong')}
                />
              ))}
            </span>
            {candidate.screeningStatus === ScreeningStatus.pending ? (
              <Clock role="img" aria-label="Chưa có điểm" strokeWidth={1.75} className="size-3.5" />
            ) : (
              <span className="font-medium tabular-nums text-ink" title={candidate.reviewed ? 'Điểm đã duyệt' : 'Điểm AI'}>{candidate.score}</span>
            )}
          </div>
        </div>
      </Surface>
    </div>
  );
}
