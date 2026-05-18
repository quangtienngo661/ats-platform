'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Sparkles, History, ArrowRight, AlertTriangle } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IInterviewTopic, ISessionSummary } from '@/types/interfaces/interview.interface';
import { TopicSelector } from './ui/TopicSelector';
import { DifficultySelector } from './ui/DifficultySelector';
import { SessionCard } from './ui/SessionCard';
import { DifficultyLevel } from '@ats-platform/database';
import { startInterviewSessionAction, abandonInterviewSessionAction } from '@/servers/interviews/interviews.action';
import { useSocketStore } from '@/stores/useSocketStore';

// Simple Modal Component
function ConfirmModal({ isOpen, title, description, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy', isConfirming = false }: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] overflow-hidden"
            >
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-[#FFFBEB] flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
                    </div>
                    <h3 className="text-[18px] text-[#1D1D1F] mb-2" style={{ fontFamily: SF, fontWeight: 700 }}>
                        {title}
                    </h3>
                    <p className="text-[14px] text-[#6E6E73] mb-6 leading-relaxed">
                        {description}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isConfirming}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E5EA] text-[#1D1D1F] text-[14px] hover:bg-[#F5F5F7] transition-colors disabled:opacity-50"
                            style={{ fontWeight: 600 }}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isConfirming}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF3B30] text-white text-[14px] hover:bg-[#D70015] transition-colors flex items-center justify-center disabled:opacity-50"
                            style={{ fontWeight: 600 }}
                        >
                            {isConfirming ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

interface MockInterviewClientProps {
    topics: IInterviewTopic[];
    history: ISessionSummary[];
}

export default function MockInterviewClient({ topics, history }: MockInterviewClientProps) {
    const router = useRouter();
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isAbandoning, setIsAbandoning] = useState(false);

    const activeSession = history.find(s => s.status === 'in_progress');
    const canStart = selectedTopic && selectedDifficulty && !isStarting && !isAbandoning;

    const createNewSession = async () => {
        setIsStarting(true);
        const result = await startInterviewSessionAction(selectedTopic!, selectedDifficulty!);
        if (result.success) {
            const sessionId = result.sessionId;
            router.push(`/mock-interview/${sessionId}`);
        } else {
            setIsStarting(false);
        }
    };

    const handleStart = async () => {
        if (!canStart) return;

        if (activeSession) {
            setShowConfirmModal(true);
            return;
        }

        await createNewSession();
    };

    const handleConfirmAbandon = async () => {
        if (!activeSession) return;
        setIsAbandoning(true);
        const success = await abandonInterviewSessionAction(activeSession.sessionId);
        if (success) {
            setShowConfirmModal(false);
            await createNewSession();
        } else {
            setIsAbandoning(false);
            // Có thể thêm toast thông báo lỗi ở đây
        }
    };

    return (
        <div className="max-w-[900px] mx-auto px-6 py-8" style={{ fontFamily: SFT }}>

            {/* ─── Header ─────────────────────────────────────────────────── */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center shadow-lg shadow-[#0071E3]/20">
                        <Cpu className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-[20px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                            Phỏng vấn AI
                        </h1>
                        <p className="text-[13px] text-[#6E6E73]">
                            Luyện tập phỏng vấn kỹ thuật với AI — nhận phản hồi chi tiết ngay lập tức
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Setup Section ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="w-4 h-4 text-[#0071E3]" />
                    <span className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                        Thiết lập phiên phỏng vấn
                    </span>
                </div>

                {/* Step 1: Chọn chủ đề */}
                <div className="mb-6">
                    <p className="text-[12px] text-[#6E6E73] mb-3 uppercase tracking-[0.05em]" style={{ fontWeight: 600 }}>
                        1. Chọn chủ đề
                    </p>
                    <TopicSelector
                        topics={topics}
                        selectedId={selectedTopic}
                        onSelect={setSelectedTopic}
                    />
                </div>

                {/* Step 2: Chọn mức độ */}
                <AnimatePresence>
                    {selectedTopic && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="mb-6"
                        >
                            <p className="text-[12px] text-[#6E6E73] mb-3 uppercase tracking-[0.05em]" style={{ fontWeight: 600 }}>
                                2. Chọn mức độ
                            </p>
                            <DifficultySelector
                                selected={selectedDifficulty}
                                onSelect={setSelectedDifficulty}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Start Button */}
                <AnimatePresence>
                    {selectedDifficulty && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <button
                                onClick={handleStart}
                                disabled={!canStart}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#0071E3] to-[#0077ED] hover:from-[#0077ED] hover:to-[#0060C0] text-white"
                                style={{ fontWeight: 600 }}
                            >
                                {isStarting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        AI đang chuẩn bị đề...
                                    </>
                                ) : (
                                    <>
                                        Bắt đầu phỏng vấn
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── History Section ────────────────────────────────────────── */}
            {history.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <History className="w-4 h-4 text-[#6E6E73]" />
                        <span className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                            Lịch sử phỏng vấn
                        </span>
                        <span className="text-[12px] text-[#AEAEB2] ml-1">({history.length})</span>
                    </div>
                    <div className="flex flex-col gap-3">
                        {history.map((session, index) => (
                            <motion.div
                                key={session.sessionId}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                            >
                                <SessionCard session={session} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <ConfirmModal
                        isOpen={showConfirmModal}
                        title="Bạn có một bài phỏng vấn đang dở"
                        description={`Bài phỏng vấn chủ đề "${activeSession?.topic.name}" vẫn đang diễn ra. Việc bắt đầu phiên mới sẽ hủy bỏ hoàn toàn kết quả của phiên phỏng vấn trước đó.`}
                        cancelText="Quay lại"
                        confirmText="Hủy bài cũ & Tạo mới"
                        onCancel={() => setShowConfirmModal(false)}
                        onConfirm={handleConfirmAbandon}
                        isConfirming={isAbandoning || isStarting}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
