'use client';

import { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, MoreHorizontal, Star, Clock, MapPin,
  SlidersHorizontal, Search, ExternalLink, Trash2, ArrowRight, ChevronRight,
} from 'lucide-react';

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";
const DRAG_TYPE = 'CARD';

// ── Types ────────────────────────────────────────────────────────────────────
interface Candidate {
  id: string; name: string; role: string; initials: string; avatarColor: string;
  rating: number; daysInStage: number; source: string; stage: Stage; score: number;
  location: string; tags: string[];
}
type Stage = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

const stages = [
  { id: 'applied', label: 'Ứng tuyển', color: '#64748B', light: '#F8FAFC', border: '#CBD5E1', text: '#475569' },
  { id: 'screening', label: 'Sàng lọc', color: '#3B82F6', light: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  { id: 'interview', label: 'Phỏng vấn', color: '#6366F1', light: '#F5F3FF', border: '#DDD6FE', text: '#4F46E5' },
  { id: 'offer', label: 'Offer', color: '#34C759', light: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  { id: 'rejected', label: 'Từ chối', color: '#EF4444', light: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
] as const;

const seedCandidates: Candidate[] = [
  { id: 'c1', name: 'Nguyễn Minh Tuấn', role: 'Senior Frontend Engineer', initials: 'NT', avatarColor: '#0071E3', rating: 5, daysInStage: 2, source: 'LinkedIn', stage: 'applied', score: 92, location: 'Hà Nội', tags: ['React', 'TypeScript'] },
  { id: 'c2', name: 'Trần Thị Lan', role: 'Product Manager', initials: 'TL', avatarColor: '#6366F1', rating: 4, daysInStage: 3, source: 'Referral', stage: 'applied', score: 87, location: 'TP.HCM', tags: ['Agile', 'B2B'] },
  { id: 'c3', name: 'Phạm Thu Hà', role: 'UX/UI Designer', initials: 'PH', avatarColor: '#0EA5E9', rating: 4, daysInStage: 1, source: 'Website', stage: 'applied', score: 80, location: 'Đà Nẵng', tags: ['Figma', 'Research'] },
  { id: 'c4', name: 'Lê Văn Hùng', role: 'Backend Engineer', initials: 'LH', avatarColor: '#34C759', rating: 5, daysInStage: 4, source: 'LinkedIn', stage: 'screening', score: 95, location: 'Hà Nội', tags: ['Node.js', 'AWS'] },
  { id: 'c5', name: 'Đỗ Quốc Bảo', role: 'Data Scientist', initials: 'DB', avatarColor: '#8B5CF6', rating: 4, daysInStage: 2, source: 'Indeed', stage: 'screening', score: 84, location: 'TP.HCM', tags: ['Python', 'ML'] },
  { id: 'c6', name: 'Hoàng Minh Nguyệt', role: 'DevOps Engineer', initials: 'HN', avatarColor: '#EC4899', rating: 3, daysInStage: 5, source: 'AngelList', stage: 'screening', score: 74, location: 'Hà Nội', tags: ['K8s', 'CI/CD'] },
  { id: 'c7', name: 'Vũ Thanh Tùng', role: 'Full Stack Engineer', initials: 'VT', avatarColor: '#F59E0B', rating: 4, daysInStage: 3, source: 'Referral', stage: 'interview', score: 88, location: 'TP.HCM', tags: ['React', 'Go'] },
  { id: 'c8', name: 'Bùi Thị Mai', role: 'Marketing Manager', initials: 'BM', avatarColor: '#14B8A6', rating: 5, daysInStage: 1, source: 'LinkedIn', stage: 'interview', score: 91, location: 'Hà Nội', tags: ['SEO', 'Growth'] },
  { id: 'c9', name: 'Ngô Đức Thắng', role: 'Security Engineer', initials: 'NĐ', avatarColor: '#0EA5E9', rating: 5, daysInStage: 2, source: 'Referral', stage: 'interview', score: 97, location: 'TP.HCM', tags: ['Pentest', 'Cloud'] },
  { id: 'c10', name: 'Trịnh Khánh Linh', role: 'iOS Engineer', initials: 'KL', avatarColor: '#6366F1', rating: 4, daysInStage: 3, source: 'LinkedIn', stage: 'interview', score: 89, location: 'Hà Nội', tags: ['Swift', 'UIKit'] },
  { id: 'c11', name: 'Đinh Tuấn Anh', role: 'Product Designer', initials: 'TA', avatarColor: '#34C759', rating: 5, daysInStage: 1, source: 'Referral', stage: 'offer', score: 94, location: 'TP.HCM', tags: ['Figma', 'Motion'] },
  { id: 'c12', name: 'Lý Thu Trang', role: 'Senior PM', initials: 'LT', avatarColor: '#EF4444', rating: 5, daysInStage: 2, source: 'LinkedIn', stage: 'rejected', score: 65, location: 'Hà Nội', tags: ['Strategy', 'OKR'] },
];

const sourceBadge: Record<string, { bg: string; text: string }> = {
  LinkedIn: { bg: '#EFF6FF', text: '#1D4ED8' },
  Referral: { bg: '#F5F3FF', text: '#6D28D9' },
  Website: { bg: '#ECFDF5', text: '#15803D' },
  Indeed: { bg: '#F0F9FF', text: '#0369A1' },
  AngelList: { bg: '#FDF4FF', text: '#9333EA' },
};

// ── Card ─────────────────────────────────────────────────────────────────────
function KanbanCard({ candidate, onMenu, onDrop }: {
  candidate: Candidate;
  onMenu: (id: string, x: number, y: number) => void;
  onDrop: (dragId: string, dropId: string) => void;
}) {
  const [{ isDragging }, drag] = useDrag({ type: DRAG_TYPE, item: { id: candidate.id }, collect: m => ({ isDragging: m.isDragging() }) });
  const [{ isOver }, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: { id: string }) => { if (item.id !== candidate.id) onDrop(item.id, candidate.id); },
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
          <div className="absolute -bottom-1.5 -right-1.5 w-[20px] h-[20px] rounded-full flex items-center justify-center border-2 border-white text-[9px]"
            style={{ background: candidate.score >= 90 ? '#34C759' : candidate.score >= 80 ? '#0071E3' : '#F59E0B', color: '#fff', fontFamily: SF, fontWeight: 700 }}>
            {candidate.score}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>{candidate.name}</p>
          <p className="text-[11px] text-[#AEAEB2] truncate mt-0.5">{candidate.role}</p>
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
          <Star key={i} className={`w-3 h-3 ${i < candidate.rating ? 'fill-[#0071E3] text-[#0071E3]' : 'text-[#E5E5EA]'}`} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#AEAEB2]">
            <MapPin className="w-2.5 h-2.5" />
            <span className="text-[10px]">{candidate.location}</span>
          </div>
          <div className="flex items-center gap-1 text-[#AEAEB2]">
            <Clock className="w-2.5 h-2.5" />
            <span className="text-[10px]">{candidate.daysInStage}d</span>
          </div>
        </div>
        <span className="text-[10px] rounded-full px-2 py-0.5" style={{ background: src.bg, color: src.text, fontWeight: 500 }}>
          {candidate.source}
        </span>
      </div>

      {/* Hover actions */}
      <div className="mt-3 pt-3 border-t border-[#F2F2F7] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex items-center gap-1 text-[10px] text-[#AEAEB2] hover:text-[#0071E3] transition-colors">
          <ExternalLink className="w-3 h-3" /><span>Hồ sơ</span>
        </button>
        <button className="flex items-center gap-1 text-[10px] text-[#AEAEB2] hover:text-[#0071E3] transition-colors">
          <span>Chuyển</span><ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────
function KanbanColumn({ stage, candidates, onDropToColumn, onReorder, onMenuOpen }: {
  stage: typeof stages[number]; candidates: Candidate[];
  onDropToColumn: (id: string, s: Stage) => void;
  onReorder: (dragId: string, dropId: string) => void;
  onMenuOpen: (id: string, x: number, y: number) => void;
}) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: { id: string }, monitor) => { if (!monitor.didDrop()) onDropToColumn(item.id, stage.id as Stage); },
    collect: m => ({ isOver: m.isOver({ shallow: true }), canDrop: m.canDrop() }),
  });

  return (
    <div className="flex flex-col flex-1 min-w-[240px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl mb-3"
        style={{ background: stage.light, border: `1px solid ${stage.border}` }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
        <span className="flex-1 text-[12px] tracking-[-0.01em] truncate" style={{ fontFamily: SF, fontWeight: 600, color: stage.text }}>
          {stage.label}
        </span>
        <span className="text-[10px] rounded-full px-2 py-0.5 text-white" style={{ background: stage.color, fontWeight: 600 }}>
          {candidates.length}
        </span>
        {candidates.length > 0 && (
          <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ background: 'rgba(0,0,0,0.06)', color: stage.text }}>
            avg {Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length)}
          </span>
        )}
        <button className="p-0.5 opacity-60 hover:opacity-100 transition-opacity" style={{ color: stage.text }}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Drop zone */}
      <div ref={drop as any} className={`flex-1 rounded-2xl transition-all min-h-[80px] ${isOver && canDrop ? 'ring-2 ring-[#0071E3] ring-offset-0 bg-[#EBF3FD]/50' : ''}`}>
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {candidates.map((c, idx) => (
              <motion.div key={c.id} layout
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <KanbanCard candidate={c} onMenu={onMenuOpen} onDrop={onReorder} />
              </motion.div>
            ))}
          </AnimatePresence>

          {candidates.length === 0 && (
            <div className={`flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-dashed transition-all ${isOver ? 'border-[#0071E3] bg-[#EBF3FD]' : 'border-[#E5E5EA]'}`}>
              <Plus className="w-5 h-5 text-[#AEAEB2] mb-1" />
              <p className="text-[11px] text-[#AEAEB2]">Thả vào đây</p>
            </div>
          )}

          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#AEAEB2] hover:bg-[#F5F5F7] hover:text-[#6E6E73] transition-all">
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[12px]">Thêm ứng viên</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KanbanPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(seedCandidates);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [query, setQuery] = useState('');

  const handleDropToColumn = (id: string, stage: Stage) =>
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage, daysInStage: 0 } : c));

  const handleReorder = (dragId: string, dropId: string) => {
    setCandidates(prev => {
      const arr = [...prev];
      const dragIdx = arr.findIndex(c => c.id === dragId);
      const dropIdx = arr.findIndex(c => c.id === dropId);
      if (dragIdx === -1 || dropIdx === -1) return prev;
      const targetStage = arr[dropIdx].stage;
      const [dragged] = arr.splice(dragIdx, 1);
      const newIdx = arr.findIndex(c => c.id === dropId);
      arr.splice(newIdx >= 0 ? newIdx : dropIdx, 0, { ...dragged, stage: targetStage, daysInStage: 0 });
      return arr;
    });
  };

  const filtered = query
    ? candidates.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.role.toLowerCase().includes(query.toLowerCase()))
    : candidates;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full" style={{ fontFamily: SFT }}>
        {/* Breadcrumb */}
        <div className="px-4 lg:px-6 pt-4 pb-2 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#AEAEB2]">HR Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#AEAEB2]" />
            <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Kanban ứng viên</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 lg:px-6 py-4 border-b border-[#F2F2F7] bg-white flex items-center gap-3 flex-wrap sticky top-0 z-10">
          <div>
            <h1 className="text-[15px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Kanban ứng viên</h1>
            <p className="text-[12px] text-[#AEAEB2]">Kéo thả để cập nhật giai đoạn tuyển dụng</p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-xl px-3 py-2 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#AEAEB2]" />
            <input type="text" placeholder="Tìm ứng viên..." value={query} onChange={e => setQuery(e.target.value)}
              className="bg-transparent text-[13px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none w-full" />
          </div>
          <button className="flex items-center gap-2 border border-[#E5E5EA] hover:border-[#D2D2D7] text-[#6E6E73] rounded-xl px-3 py-2 text-[13px] transition-all hover:bg-[#F5F5F7]">
            <SlidersHorizontal className="w-3.5 h-3.5" />Lọc
          </button>
          <button className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl px-3.5 py-2 text-[13px] transition-all shadow-sm">
            <Plus className="w-3.5 h-3.5" />Thêm ứng viên
          </button>
        </div>

        {/* Pipeline summary strip */}
        <div className="px-4 lg:px-6 py-3 border-b border-[#F2F2F7] bg-white flex items-center gap-2 overflow-x-auto sticky top-[73px] z-10">
          {stages.map(s => {
            const count = filtered.filter(c => c.stage === s.id).length;
            return (
              <div key={s.id} className="flex items-center gap-2 rounded-xl px-3 py-1.5 flex-shrink-0 border" style={{ background: s.light, borderColor: s.border + '80' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                <span className="text-[11px]" style={{ fontWeight: 500, color: s.color }}>{s.label}</span>
                <span className="text-[11px] rounded-full px-1.5 min-w-[18px] text-center text-white" style={{ background: s.color, fontWeight: 700 }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Context menu */}
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
            <div className="fixed z-50 bg-white rounded-2xl shadow-xl border border-[#E5E5EA] overflow-hidden w-[180px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}>
              {[
                { icon: ExternalLink, label: 'Xem hồ sơ', cls: 'text-[#1D1D1F]' },
                { icon: ArrowRight, label: 'Chuyển giai đoạn', cls: 'text-[#1D1D1F]' },
                { icon: Trash2, label: 'Xóa', cls: 'text-red-500' },
              ].map(({ icon: Icon, label, cls }) => (
                <button key={label} className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-[#F5F5F7] transition-colors ${cls}`}
                  onClick={() => setContextMenu(null)}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Kanban board */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 lg:p-6 w-full">
          <div className="flex gap-4 min-w-max h-full">
            {stages.map(stage => (
              <KanbanColumn key={stage.id} stage={stage}
                candidates={filtered.filter(c => c.stage === stage.id)}
                onDropToColumn={handleDropToColumn} onReorder={handleReorder}
                onMenuOpen={(id, x, y) => setContextMenu({ id, x, y })} />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
