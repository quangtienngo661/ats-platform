'use client';

import { useDrag, useDrop } from 'react-dnd';
import { MoreHorizontal, Star, Clock, MapPin, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Candidate } from '@/types/interfaces/kanban.interface';
import { DRAG_TYPE, sourceBadge, SF, SFT } from '../../types/constants/kanban.constants';

interface KanbanCardProps {
  candidate: Candidate;
  jobId: string;
  onMenu: (id: string, x: number, y: number) => void;
  onDrop: (dragId: string, dropId: string) => void;
}

const LOCATION_LABELS: Record<string, string> = {
  onsite: 'Tại văn phòng',
  remote: 'Từ xa',
  hybrid: 'Hybrid',
};

export default function KanbanCard({ candidate, jobId, onMenu, onDrop }: KanbanCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { id: candidate.id },
    collect: m => ({ isDragging: m.isDragging() })
  });

  const [{ isOver }, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: { id: string }) => {
      if (item.id !== candidate.id) onDrop(item.id, candidate.id);
    },
    collect: m => ({ isOver: m.isOver() }),
  });

  const src = sourceBadge[candidate.source] || { bg: '#F5F5F7', text: '#6E6E73' };

  return (
    <div
      ref={(el: HTMLDivElement | null) => { drag(el as any); drop(el as any); }}
      className={`group bg-white rounded-2xl border border-[#F2F2F7] p-4 cursor-grab active:cursor-grabbing select-none transition-all duration-200 ${isDragging ? 'opacity-40 scale-[0.97] shadow-lg' : isOver ? 'border-[#0071E3] shadow-md scale-[1.01]' : 'hover:shadow-md hover:border-[#E5E5EA]'
        }`}
      style={{ fontFamily: SFT }}
    >
      {/* Avatar + name + menu */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-[12px]"
            style={{ background: candidate.avatarColor, fontFamily: SF, fontWeight: 600 }}>
            {candidate.initials}
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 min-w-[20px] px-1 h-[20px] rounded-full flex items-center justify-center border-2 border-white text-[9px]"
            style={{
              background: candidate.screeningStatus === 'pending' ? '#E5E5EA' : candidate.score >= 90 ? '#34C759' : candidate.score >= 80 ? '#0071E3' : '#F59E0B',
              color: candidate.screeningStatus === 'pending' ? '#6E6E73' : '#fff',
              fontFamily: SF, fontWeight: 700
            }}>
            {candidate.screeningStatus === 'pending' ? <Clock className="w-2.5 h-2.5" /> : candidate.score}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>{candidate.name}</p>
          <p className="text-[11px] text-[#AEAEB2] truncate mt-0.5">{candidate.role}</p>
          {(!candidate.screeningStatus || candidate.screeningStatus === 'pending') && candidate.stage === 'applied' && (
            <span className="inline-block mt-1 text-[9px] bg-[#F5F5F7] text-[#6E6E73] px-1.5 py-0.5 rounded-md border border-[#E5E5EA] font-medium">Chưa sàng lọc</span>
          )}
          {(!candidate.screeningStatus || candidate.screeningStatus === 'pending') && candidate.stage === 'screening' && (
            <span className="inline-block mt-1 text-[9px] bg-[#FEF2F2] text-red-600 px-1.5 py-0.5 rounded-md border border-red-500/20 font-medium">Chờ AI Sàng lọc</span>
          )}
          {candidate.screeningStatus === 'processing' && (
            <span className="inline-block mt-1 text-[9px] bg-[#FFFBEB] text-[#F59E0B] px-1.5 py-0.5 rounded-md border border-[#F59E0B]/20 font-medium">Đang AI Sàng lọc</span>
          )}
          {candidate.screeningStatus === 'completed' && (
            <span className="inline-block mt-1 text-[9px] bg-[#F0FDF4] text-[#34C759] px-1.5 py-0.5 rounded-md border border-[#34C759]/20 font-medium">Đã AI Sàng lọc</span>
          )}
          {candidate.screeningStatus === 'failed' && (
            <span className="inline-block mt-1 text-[9px] bg-[#FEF2F2] text-red-600 px-1.5 py-0.5 rounded-md border border-red-500/20 font-medium">Sàng lọc thất bại</span>
          )}
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[#AEAEB2] hover:text-[#6E6E73] hover:bg-[#F5F5F7] transition-all flex-shrink-0"
          onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); onMenu(candidate.id, r.left, r.bottom + 4); }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {candidate.tags.map(t => (
          <span key={t} className="text-[10px] bg-[#F5F5F7] text-[#6E6E73] rounded-md px-2 py-0.5 border border-[#F2F2F7]">{t}</span>
        ))}
      </div>

      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < candidate.rating ? 'fill-[#0071E3] text-[#0071E3]' : 'text-[#E5E5EA]'}`} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#AEAEB2]">
            <MapPin className="w-2.5 h-2.5" />
            <span className="text-[11px]">{LOCATION_LABELS[candidate.location]}</span>
          </div>
          <div className="flex items-center gap-1 text-[#AEAEB2]">
            <Clock className="w-2.5 h-2.5" />
            <span className="text-[11px]">{candidate.daysInStage}d</span>
          </div>
        </div>
      </div>

      {/* Hover actions */}
      <div className="mt-3 pt-3 border-t border-[#F2F2F7] flex items-center justify-between transition-opacity">
        <Link href={`/jobs/${jobId}/candidates/${candidate.id}`} className="flex items-center gap-1 text-[11px] text-[#AEAEB2] hover:text-[#0071E3] transition-colors">
          <ExternalLink className="w-3 h-3" /><span>Hồ sơ</span>
        </Link>
        {candidate.stage === 'screening' && candidate.screeningStatus === 'pending' ? (
          <button
            className="flex items-center gap-1 text-[11px] text-[#0071E3] hover:text-[#0056B3] transition-colors font-medium"
            onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); onMenu(candidate.id, r.left, r.bottom + 4); }}
          >
            <Star className="w-3 h-3" /><span>Sàng lọc</span>
          </button>
        ) : (
          <button
            className="flex items-center gap-1 text-[11px] text-[#AEAEB2] hover:text-[#0071E3] transition-colors"
            onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); onMenu(candidate.id, r.left, r.bottom + 4); }}
          >
            <MoreHorizontal className="w-3 h-3" /><span>Tùy chọn</span>
          </button>
        )}
      </div>
    </div>
  );
}
