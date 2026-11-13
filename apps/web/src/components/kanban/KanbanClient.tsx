'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ArchiveX, Clock } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import type { MenuFocusRequest } from './KanbanCard';
import ScreeningConfigModal from './ScreeningConfigModal';
import { Candidate, Stage } from '@/types/interfaces/kanban.interface';
import { stages } from '../../types/constants/kanban.constants';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { updateApplicationStatusAction } from '@/servers/applications/applications.action';
import { toast } from '@/lib/toast';
import { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { useKanBanStore } from '@/stores/useKanbanStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { boardToCandidates } from './kanban-mappers';
import { Avatar, Button, EmptyState, Sheet } from '@/components/ui';

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
  const [query, ] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [showScreeningModal, setShowScreeningModal] = useState<string | null>(null);
  // Which card's "Tùy chọn" button takes focus next (WCAG 2.4.3): a card moved from its menu remounts in its new
  // column, and a dialog's opener can disappear, so focus would otherwise fall to <body>.
  const [focusRequest, setFocusRequest] = useState<{ id: string; when: MenuFocusRequest } | null>(null);
  const clearFocusRequest = useCallback(() => setFocusRequest(null), []);
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
        backgroundColor: 'rgb(var(--ink))',
        color: 'rgb(var(--surface))',
        fontWeight: 500,
        borderRadius: '6px'
      }
    });
  };

  /** A move chosen in a card's menu: the same path as a drop, then focus follows the card (or stays, if refused). */
  const moveFromMenu = (id: string, stage: Stage) => {
    setFocusRequest({ id, when: 'now' });
    handleDropToColumn(id, stage);
  };

  const closeScreeningModal = () => {
    const id = showScreeningModal;
    setShowScreeningModal(null);
    if (id) setFocusRequest({ id, when: 'if-lost' });
  };

  // A move into "Sàng lọc" opens the dialog; hold it until the moved card has focus, so that card is its opener.
  const screeningModalId =
    showScreeningModal && !(focusRequest?.when === 'now' && focusRequest.id === showScreeningModal)
      ? showScreeningModal
      : null;

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
    // Same payload shape: a reviewed screening arrives as the refreshed application.
    socket.onEvent("cv-screening:reviewed", handleUpdateKanban);
    socket.onEvent("application:application_created", handleAddApplication);
    socket.onEvent("application:application_withdrawn", handleWithdrawnApplication)
    return () => {
      socket.offEvent("cv-screening:completed", handleUpdateKanban);
      socket.offEvent("cv-screening:reviewed", handleUpdateKanban);
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
      <div className="flex min-h-0 flex-1 flex-col">
        {/* ── Trigger for the cancelled list, above the board ───────────── */}
        <div className="flex items-center justify-end px-4 pt-4 lg:px-6">
          <Button variant="secondary" size="sm" onClick={() => setShowCancelled(true)}>
            <ArchiveX aria-hidden="true" strokeWidth={1.75} />
            Đã hủy / Rút đơn
            <span className="rounded-ctl bg-surface-2 px-1.5 text-micro tabular-nums text-ink-2">
              {cancelledApplications.length}
            </span>
          </Button>
        </div>

        {/* ── Kanban board: scrolls on its own so the horizontal scrollbar stays in view ── */}
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="flex min-h-full w-max gap-3 px-4 pb-4 pt-3 lg:px-6 lg:pb-6">
            {stages.map(stage => (
              <KanbanColumn key={stage.id} stage={stage}
                jobId={jobId}
                candidates={filtered.filter(c => c.stage === stage.id)}
                onDropToColumn={handleDropToColumn} onReorder={handleReorder}
                onMoveToStage={moveFromMenu}
                onRequestScreening={setShowScreeningModal}
                focusRequest={focusRequest}
                onFocusHandled={clearFocusRequest} />
            ))}
          </div>
        </div>

        {/* ── Cancelled / withdrawn applications ─────────────────────────── */}
        <Sheet open={showCancelled} onOpenChange={setShowCancelled} title="Đã hủy / Rút đơn">
          <p className="-mt-2 mb-3 text-caption tabular-nums text-ink-3">{cancelledApplications.length} ứng viên</p>
          {cancelledApplications.length === 0 ? (
            <EmptyState icon={ArchiveX} title="Không có ứng viên nào" />
          ) : (
            <ul className="space-y-1">
              {cancelledApplications.map(app => {
                const name = app.candidate?.user?.fullName || 'N/A';
                const days = app.appliedAt
                  ? Math.max(0, Math.floor((Date.now() - new Date(app.appliedAt).getTime()) / 86400000))
                  : 0;
                return (
                  <li key={`${app.applicationId}`} className="flex items-center gap-3 px-2 py-2.5">
                    <Avatar name={name} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm font-medium text-ink" title={name}>{name}</p>
                      <p className="truncate text-caption text-ink-3" title={app.jobPosting?.title}>{app.jobPosting?.title || ''}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-caption tabular-nums text-ink-3">
                      <Clock aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
                      {days}d
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Sheet>

        {/* ── Screening Config Modal ────────────────────────────────────── */}
        {screeningModalId && (
          <ScreeningConfigModal
            applicationId={screeningModalId}
            candidateName={candidates.find(c => c.id === screeningModalId)?.name || ''}
            roleName={candidates.find(c => c.id === screeningModalId)?.role || ''}
            aiProfiles={aiProfiles}
            onClose={closeScreeningModal}
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
