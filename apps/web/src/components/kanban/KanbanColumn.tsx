'use client';

import { useDrop } from 'react-dnd';
import { motion, AnimatePresence } from 'motion/react';
import KanbanCard from './KanbanCard';
import { Candidate, Stage, StageConfig } from '@/types/interfaces/kanban.interface';
import { DRAG_TYPE, SF } from '../../types/constants/kanban.constants';

interface KanbanColumnProps {
  stage: StageConfig;
  candidates: Candidate[];
  jobId: string;
  onDropToColumn: (id: string, s: Stage) => void;
  onReorder: (dragId: string, dropId: string) => void;
  onMenuOpen: (id: string, x: number, y: number) => void;
}

export default function KanbanColumn({
  stage,
  candidates,
  jobId,
  onDropToColumn,
  onReorder,
  onMenuOpen,
}: KanbanColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: { id: string }, monitor) => {
      if (!monitor.didDrop()) onDropToColumn(item.id, stage.id as Stage);
    },
    collect: m => ({ isOver: m.isOver({ shallow: true }), canDrop: m.canDrop() }),
  });

  return (
    <div className="flex flex-col flex-1 min-w-[280px]">
      {/* Header — width cố định theo column, không bao giờ giãn ra */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl mb-3 overflow-hidden"
        style={{ background: stage.light, border: `1px solid ${stage.border}` }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
        <span className="flex-1 min-w-0 text-[12px] tracking-[-0.01em] truncate" style={{ fontFamily: SF, fontWeight: 600, color: stage.text }}>
          {stage.label}
        </span>
        <span className="flex-shrink-0 text-[10px] rounded-full px-2 py-0.5 text-white" style={{ background: stage.color, fontWeight: 600 }}>
          {candidates.length}
        </span>
        <span className="flex-shrink-0 text-[10px] rounded-full px-1.5 py-0.5 whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.06)', color: stage.text }}>
          avg {candidates.length > 0 ? Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length) : 0}
        </span>
      </div>

      {/* Drop zone */}
      <div ref={drop as any} className={`flex-1 rounded-2xl transition-all min-h-[80px] ${isOver && canDrop ? 'ring-2 ring-[#0071E3] ring-offset-0 bg-[#EBF3FD]/50' : ''}`}>
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {candidates.map((c) => (
              <motion.div key={c.id} layout
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <KanbanCard candidate={c} jobId={jobId} onMenu={onMenuOpen} onDrop={onReorder} />
              </motion.div>
            ))}
          </AnimatePresence>

          {candidates.length === 0 && (
            <div className={`flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-dashed transition-all ${isOver ? 'border-[#0071E3] bg-[#EBF3FD]' : 'border-[#E5E5EA]'}`}>
              <p className="text-[11px] text-[#AEAEB2]">Kéo thả ứng viên vào đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
