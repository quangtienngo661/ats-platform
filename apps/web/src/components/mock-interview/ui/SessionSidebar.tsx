import Link from 'next/link';
import { BookOpen, BarChart3, Clock, ArrowRight, Zap, Flame } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { DifficultyLevel } from '@ats-platform/types';

const difficultyStyle: Record<string, { color: string; bg: string; label: string; icon: typeof Zap }> = {
    easy: { color: '#34C759', bg: '#F0FDF4', label: 'Dễ', icon: Zap },
    medium: { color: '#F59E0B', bg: '#FFFBEB', label: 'Trung bình', icon: BarChart3 },
    hard: { color: '#FF3B30', bg: '#FEF2F2', label: 'Khó', icon: Flame },
};

interface SessionSidebarProps {
    topicName: string;
    category: string;
    difficulty: DifficultyLevel;
    currentIndex: number;
    totalQuestions: number;
    isCompleted: boolean;
    sessionId: string;
    onAbandon?: () => void;
}

export function SessionSidebar({
    topicName,
    category,
    difficulty,
    currentIndex,
    totalQuestions,
    isCompleted,
    sessionId,
    onAbandon,
}: SessionSidebarProps) {
    const diffConfig = difficultyStyle[difficulty] || difficultyStyle.medium;
    const DiffIcon = diffConfig.icon;
    const progress = Math.min((currentIndex / totalQuestions) * 100, 100);

    return (
        <div className="w-[260px] border-l border-[#F2F2F7] bg-white h-full flex flex-col">
            {/* Session info */}
            <div className="p-4 border-b border-[#F2F2F7]">
                <p className="text-[10px] text-[#AEAEB2] uppercase tracking-[0.05em] mb-2" style={{ fontWeight: 600 }}>
                    Thông tin phiên
                </p>

                {/* Topic */}
                <div className="flex items-start gap-2.5 mb-3 p-2.5 bg-[#F5F5F7] rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-[#EBF3FD] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-[#0071E3]" />
                    </div>
                    <div>
                        <p className="text-[10px] text-[#AEAEB2]">Chủ đề</p>
                        <p className="text-[12px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 500 }}>
                            {topicName}
                        </p>
                        <p className="text-[10px] text-[#6E6E73]">{category}</p>
                    </div>
                </div>

                {/* Difficulty */}
                <div className="flex items-center gap-2.5 mb-3 p-2.5 bg-[#F5F5F7] rounded-xl">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: diffConfig.bg }}>
                        <DiffIcon className="w-3.5 h-3.5" style={{ color: diffConfig.color }} />
                    </div>
                    <div>
                        <p className="text-[10px] text-[#AEAEB2]">Mức độ</p>
                        <p className="text-[12px]" style={{ fontFamily: SF, fontWeight: 500, color: diffConfig.color }}>
                            {diffConfig.label}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="p-4 border-b border-[#F2F2F7]">
                <p className="text-[10px] text-[#AEAEB2] uppercase tracking-[0.05em] mb-3" style={{ fontWeight: 600 }}>
                    Tiến trình
                </p>

                <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
                        Câu {Math.min(currentIndex, totalQuestions)}/{totalQuestions}
                    </span>
                    <span className="text-[11px] text-[#0071E3]" style={{ fontWeight: 600 }}>
                        {Math.round(progress)}%
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-[#F2F2F7] rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progress}%`,
                            background: isCompleted ? '#34C759' : 'linear-gradient(90deg, #0071E3, #6366F1)',
                        }}
                    />
                </div>

                {/* Question dots */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {Array.from({ length: totalQuestions }, (_, i) => (
                        <div
                            key={i}
                            className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] transition-all duration-300"
                            style={{
                                background: i < currentIndex ? '#0071E3' : i === currentIndex - 1 ? '#0071E3' : '#F2F2F7',
                                color: i < currentIndex ? '#fff' : '#AEAEB2',
                                fontWeight: 600,
                            }}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto p-4">
                {!isCompleted && onAbandon && (
                    <button
                        onClick={onAbandon}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#FF3B30] rounded-xl text-[13px] transition-all"
                        style={{ fontWeight: 500 }}
                    >
                        Hủy phỏng vấn
                    </button>
                )}
            </div>
        </div>
    );
}
