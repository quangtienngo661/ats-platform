'use client';

import { useState, useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  ExternalLink, Trash2, Cpu, X, ArchiveX, Clock,
} from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import ScreeningConfigModal from './ScreeningConfigModal';
import { Candidate, Stage } from '@/types/interfaces/kanban.interface';
import { stages, SF, SFT } from '../../types/constants/kanban.constants';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { updateApplicationStatusAction } from '@/servers/applications/applications.action';
import { toast } from '@/lib/toast';
import { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { useKanBanStore } from '@/stores/useKanbanStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { ScreeningStatus } from '@ats-platform/database';

// ── Helper: convert API ApplicationDto to UI Candidate card ─────────────────
function mapApplicationToCandidate(app: IApplicationDto, stage: Stage): Candidate {
  const name = app.candidate?.user?.fullName || 'N/A';
  const initials = name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
  const score = app.screening?.overallScore ?? 0;
  const hasScore = app.screening?.overallScore !== undefined && app.screening?.overallScore !== null;
  const screeningStatus = app.screening?.status ?? undefined;

  return {
    id: app.applicationId,
    name,
    role: app.jobPosting?.title || '',
    initials,
    avatarColor: '#0071E3',
    rating: score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score === 0 ? 0 : 2,
    daysInStage: app.appliedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(app.appliedAt).getTime()) / 86400000))
      : 0,
    source: 'Website',
    stage,
    score,
    location: app.jobPosting?.locationType || '',
    tags: [],
    screeningStatus,
  };
}

function boardToCandidates(board: Record<string, IApplicationDto[]>): Candidate[] {
  const result: Candidate[] = [];
  for (const [status, applications] of Object.entries(board)) {
    for (const app of applications) {
      result.push(mapApplicationToCandidate(app, status as Stage));
    }
  }
  return result;
}

// ── Component ───────────────────────────────────────────────────────────────
interface KanbanClientProps {
  jobId: string;
  initialCancelledApplications?: IApplicationDto[];
  aiProfiles?: ConfigProfile[];
}



export default function KanbanClient({
  jobId,
  aiProfiles = [],
}: KanbanClientProps) {
  const kanbanBoard = useKanBanStore(s => s.kanbanBoard);
  const initialCancelledApplications = useKanBanStore(s => s.initialCancelledApplications);

  const [cancelledApplications, setCancelledApplications] = useState<IApplicationDto[]>(initialCancelledApplications);
  const [candidates, setCandidates] = useState<Candidate[]>(() => boardToCandidates(kanbanBoard));
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number; stage: Stage; screeningStatus?: ScreeningStatus } | null>(null);
  const [query, setQuery] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [showScreeningModal, setShowScreeningModal] = useState<string | null>(null);
  const socket = useSocketStore();

  const updateKanbanBoard = useKanBanStore(s => s.updateKanbanBoard);
  const addNewApplicationToKanban = useKanBanStore(s => s.addNewApplicationToKanban);

  const pendingDrops = useRef<Record<string, NodeJS.Timeout>>({});

  const handleDropToColumn = (id: string, stage: Stage) => {
    const prevCandidate = candidates.find(c => c.id === id);
    if (!prevCandidate) return;
    if (prevCandidate.stage === stage) return; // Nếu thả đúng cột cũ thì không làm gì

    const prevStageIndex = stages.findIndex(s => s.id === prevCandidate.stage);
    const newStageIndex = stages.findIndex(s => s.id === stage);

    // Không cho phép kéo lùi vòng (Backward movement)
    if (newStageIndex < prevStageIndex) {
      toast.error('Thao tác không hợp lệ', 'Hệ thống không cho phép kéo ứng viên lùi lại vòng trước.');
      return;
    }

    if (newStageIndex >= prevStageIndex + 2) {
      if (stages[newStageIndex].id !== "rejected") {
        toast.error('Thao tác không hợp lệ', 'Hệ thống không cho phép kéo ứng viên vượt qua 2 vòng cùng lúc.');
        return;
      }
    }

    // Yêu cầu sàng lọc trước khi đi tiếp
    if (prevCandidate.stage === 'screening' && prevCandidate.screeningStatus === 'pending' && newStageIndex > prevStageIndex) {
      toast.error('Vui lòng thực hiện AI sàng lọc trước khi chuyển sang vòng tiếp theo.');
      return;
    }

    if (prevCandidate.stage === 'hired' && stage === 'rejected') {
      toast.error('Thao tác không hợp lệ', 'Ứng viên đã được tuyển dụng, không thể chuyển sang vòng Từ chối.');
      return;
    }

    const prevStage = prevCandidate.stage;
    const prevDaysInStage = prevCandidate.daysInStage;

    // Hủy timeout cũ nếu user kéo thẻ này liên tục nhiều lần
    if (pendingDrops.current[id]) {
      clearTimeout(pendingDrops.current[id]);
    }

    // 1. Optimistic UI: Cập nhật giao diện lập tức
    setCandidates(prev => prev.map(c => c.id === id ? {
      ...c,
      stage,
      daysInStage: 0,
      screeningStatus: stage === 'screening' && !c.score ? 'pending' : c.screeningStatus
    } : c));

    // Mở modal nếu vào cột screening
    if (stage === 'screening') {
      setShowScreeningModal(id);
    }

    // 2. Gọi API thật ngay lập tức
    updateApplicationStatusAction(id, stage).then(result => {
      if (!result.success) {
        toast.error("Lỗi", "Cập nhật thất bại, vui lòng thử lại");
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: prevStage, daysInStage: prevDaysInStage } : c));
      } else if (result.data) {
        updateKanbanBoard(result.data);
      }
    }).catch(() => {
      toast.error("Lỗi", "Cập nhật thất bại, vui lòng thử lại");
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: prevStage, daysInStage: prevDaysInStage } : c));
    });

    // 3. Hiện Toast cho phép Hoàn tác
    toast.success("Thành công", 'Cập nhật trạng thái thành công', {
      action: {
        label: 'Hoàn tác',
        onClick: () => {
          setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: prevStage, daysInStage: prevDaysInStage } : c));
          updateApplicationStatusAction(id, prevStage, true)
            .then(result => {
              // Sử dụng callback của setState để lấy giá trị mới nhất, tránh lỗi Stale Closure
              setShowScreeningModal(prev => prev === id ? null : prev);
              if (!result.success) {
                toast.error("Lỗi", result.message);
              }
            })
            .catch(() => {
              toast.error("Lỗi", "Hoàn tác thất bại");
            });
        }
      },
      actionButtonStyle: {
        backgroundColor: '#0071E3',
        color: '#ffffff',
        fontWeight: 500,
        borderRadius: '8px'
      }
    });
  };

  useEffect(() => {
    if (socket.status !== 'connected') return;

    const handleUpdateKanban = (updatedApplication: IApplicationDto | null) => {
      if (!updatedApplication) {
        toast.error('AI screening failed', 'Please try again later.');
        return;
      }
      if (updatedApplication.jobId !== jobId) return;
      updateKanbanBoard(updatedApplication)
    }

    const handleAddApplication = (newApplication: IApplicationDto) => {
      if (newApplication.jobId !== jobId) return;
      addNewApplicationToKanban(newApplication)
    }

    const handleWithdrawnApplication = (withdrawnApplication: IApplicationDto) => {
      if (withdrawnApplication.jobId !== jobId) return;
      updateKanbanBoard(withdrawnApplication)
    }

    socket.onEvent("cv-screening:completed", handleUpdateKanban);
    socket.onEvent("application:application_created", handleAddApplication);
    socket.onEvent("application:application_withdrawn", handleWithdrawnApplication)
    return () => {
      socket.offEvent("cv-screening:completed", handleUpdateKanban);
      socket.offEvent("application:application_created", handleAddApplication);
      socket.offEvent("application:application_withdrawn", handleWithdrawnApplication)
    }
  }, [updateKanbanBoard, addNewApplicationToKanban, socket, jobId])

  useEffect(() => {
    setCandidates(boardToCandidates(kanbanBoard))
  }, [kanbanBoard])

  useEffect(() => {
    setCancelledApplications(initialCancelledApplications)
  }, [initialCancelledApplications])

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
      <div className="flex py-2 flex-col flex-1" style={{ fontFamily: SFT }}>

        {/* ── Cancelled slide-over backdrop & panel ─────────────────────── */}
        <AnimatePresence>
          {showCancelled && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setShowCancelled(false)}
              />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.3 }}
                className="fixed right-0 top-0 h-full w-[360px] bg-white shadow-2xl z-50 flex flex-col"
                style={{ fontFamily: SFT }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
                  <div>
                    <h2 className="text-[15px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>Đã hủy / Rút đơn</h2>
                    <p className="text-[12px] text-[#AEAEB2]">{cancelledApplications.length} ứng viên</p>
                  </div>
                  <button onClick={() => setShowCancelled(false)} className="p-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors">
                    <X className="w-4 h-4 text-[#070708]" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {cancelledApplications.length === 0 && (
                    <p className="text-[13px] text-[#AEAEB2] text-center py-8">Không có ứng viên nào.</p>
                  )}
                  {cancelledApplications.map(app => {
                    const name = app.candidate?.user?.fullName || 'N/A';
                    const initials = name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
                    const days = app.appliedAt
                      ? Math.max(0, Math.floor((Date.now() - new Date(app.appliedAt).getTime()) / 86400000))
                      : 0;
                    return (
                      <div key={`${app.applicationId}`} className="flex items-center gap-3 p-3 rounded-xl border border-[#F2F2F7] hover:bg-[#F5F5F7] transition-colors">
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-[11px] flex-shrink-0"
                          style={{ background: '#94A3B8', fontFamily: SF, fontWeight: 600 }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>{name}</p>
                          <p className="text-[11px] text-[#AEAEB2] truncate">{app.jobPosting?.title || ''}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[#AEAEB2] flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px]">{days}d</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Trigger button — nằm trên cùng, trước kanban board ─────────── */}
        <div className="px-4 mr-3 lg:px-6 pb-2 flex items-center justify-end">
          <button
            onClick={() => setShowCancelled(true)}
            className="flex items-center gap-1.5 border border-[#E5E5EA] hover:border-[#D2D2D7] text-[#6E6E73] rounded-xl px-3 py-1.5 text-[12px] transition-all hover:bg-[#F5F5F7]"
          >
            <ArchiveX className="w-3.5 h-3.5" />
            Đã hủy / Rút đơn
            <span className="bg-[#E5E5EA] text-[#1D1D1F] text-[10px] rounded-full px-1.5 py-0.5" style={{ fontWeight: 600 }}>
              {cancelledApplications.length}
            </span>
          </button>
        </div>

        {/* ── Context menu ──────────────────────────────────────────────── */}
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
            <div className="fixed z-50 bg-white rounded-2xl shadow-xl border border-[#E5E5EA] overflow-hidden w-[200px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}>
              <Link href={`/jobs/${jobId}/candidates/${contextMenu.id}`} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                onClick={() => setContextMenu(null)}>
                <ExternalLink className="w-3.5 h-3.5" />Xem hồ sơ
              </Link>
              <button
                disabled={contextMenu.stage !== 'screening' || contextMenu.screeningStatus === ScreeningStatus.completed}
                title={contextMenu.stage !== 'screening' ? 'Chỉ áp dụng ở bước Sàng lọc' : contextMenu.screeningStatus === 'completed' ? 'Ứng viên này đã được sàng lọc' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${contextMenu.stage === 'screening' && contextMenu.screeningStatus !== 'completed'
                  ? 'text-[#0071E3] hover:bg-[#EBF3FD]'
                  : 'text-[#AEAEB2] cursor-not-allowed'
                  }`}
                onClick={() => {
                  if (contextMenu.stage === 'screening') {
                    setShowScreeningModal(contextMenu.id);
                  }
                  setContextMenu(null);
                }}
              >
                <Cpu className="w-3.5 h-3.5" />AI Sàng lọc CV
              </button>
            </div>
          </>
        )}

        {/* ── Kanban board ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 lg:p-6 w-full">
          <div className="flex gap-4 min-w-full h-full">
            {stages.map(stage => (
              <KanbanColumn key={stage.id} stage={stage}
                jobId={jobId}
                candidates={filtered.filter(c => c.stage === stage.id)}
                onDropToColumn={handleDropToColumn} onReorder={handleReorder}
                onMenuOpen={(id, x, y) => {
                  const c = candidates.find(c => c.id === id);
                  if (c) setContextMenu({ id, x, y, stage: c.stage, screeningStatus: c.screeningStatus });
                }} />
            ))}
          </div>
        </div>

        {/* ── Screening Config Modal ────────────────────────────────────── */}
        {showScreeningModal && (
          <ScreeningConfigModal
            applicationId={showScreeningModal}
            candidateName={candidates.find(c => c.id === showScreeningModal)?.name || ''}
            roleName={candidates.find(c => c.id === showScreeningModal)?.role || ''}
            aiProfiles={aiProfiles}
            onClose={() => setShowScreeningModal(null)}
            onSuccess={() => {
              // Cập nhật UI ngay lập tức — server sẽ xử lý bất đồng bộ qua BullMQ
              setCandidates(prev => prev.map(c =>
                c.id === showScreeningModal ? { ...c, screeningStatus: 'processing' } : c
              ));
              toast.success('Đã gửi yêu cầu sàng lọc AI', 'Kết quả sẽ cập nhật khi AI hoàn tất phân tích.');
            }}
          />
        )}
      </div>
    </DndProvider>
  );
}
