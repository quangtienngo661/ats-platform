'use client';

import { useId } from 'react';
import { useDrop } from 'react-dnd';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import KanbanCard from './KanbanCard';
import { Candidate, Stage, StageConfig } from '@/types/interfaces/kanban.interface';
import { DRAG_TYPE } from '../../types/constants/kanban.constants';
import { statusTone, type Tone } from '@/lib/status-tones';
import { duration, ease, exitDuration } from '@/lib/motion';
import { cn } from '@/components/ui/cn';

const DOT: Record<Tone, string> = {
  neutral: 'bg-ink-4',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

interface KanbanColumnProps {
  stage: StageConfig;
  candidates: Candidate[];
  jobId: string;
  onDropToColumn: (id: string, s: Stage) => void;
  onReorder: (dragId: string, dropId: string) => void;
  onMoveToStage: (id: string, stage: Stage) => void;
  onRequestScreening: (id: string) => void;
}

export default function KanbanColumn({
  stage,
  candidates,
  jobId,
  onDropToColumn,
  onReorder,
  onMoveToStage,
  onRequestScreening,
}: KanbanColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: { id: string }, monitor) => {
      if (!monitor.didDrop()) onDropToColumn(item.id, stage.id as Stage);
    },
    collect: monitor => ({ isOver: monitor.isOver({ shallow: true }), canDrop: monitor.canDrop() }),
  });

  const headingId = useId();
  const tone = statusTone('application', stage.id).tone;
  const average = candidates.length > 0 ? Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length) : 0;
  const highlighted = isOver && canDrop;

  return (
    <section aria-labelledby={headingId} className="flex w-72 shrink-0 flex-col">
      <div className="flex items-center gap-2 px-1 pb-2.5">
        <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', DOT[tone])} />
        <h2 id={headingId} className="min-w-0 truncate text-body-sm font-medium text-ink">{stage.label}</h2>
        <span className="text-caption tabular-nums text-ink-3">{candidates.length}</span>
        <span className="ml-auto shrink-0 text-caption tabular-nums text-ink-3" title="Điểm trung bình">
          avg {average}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={(element) => { drop(element); }}
        className={cn(
          'flex min-h-24 flex-1 flex-col gap-2 rounded-card p-1.5 transition-colors duration-hover',
          highlighted ? 'bg-accent-soft' : 'bg-surface-2',
        )}
      >
        <AnimatePresence initial={false}>
          {candidates.map((c) => (
            <m.div key={c.id} layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: exitDuration(duration.base), ease: ease.in } }}
              transition={{ duration: duration.base, ease: ease.out }}>
              <KanbanCard
                candidate={c}
                jobId={jobId}
                onDrop={onReorder}
                onMoveToStage={onMoveToStage}
                onRequestScreening={onRequestScreening}
              />
            </m.div>
          ))}
        </AnimatePresence>

        {candidates.length === 0 && (
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-card border border-dashed py-8',
              highlighted ? 'border-accent' : 'border-line-strong',
            )}
          >
            <p className="text-caption text-ink-3">Kéo thả ứng viên vào đây</p>
          </div>
        )}
      </div>
    </section>
  );
}
