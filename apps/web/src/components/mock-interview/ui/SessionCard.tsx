import Link from 'next/link';
import { Clock, ChevronRight, Trophy, Ban, LoaderCircle } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { ISessionSummary } from '@/types/interfaces/interview.interface';

// Color config theo score range
function getScoreConfig(score: number) {
    if (score >= 80) return { color: '#34C759', bg: '#F0FDF4', label: 'Xuất sắc' };
    if (score >= 60) return { color: '#F59E0B', bg: '#FFFBEB', label: 'Khá' };
    return { color: '#FF3B30', bg: '#FEF2F2', label: 'Cần cải thiện' };
}

// Color config theo difficulty
const difficultyStyle: Record<string, { color: string; bg: string; label: string }> = {
    easy: { color: '#34C759', bg: '#F0FDF4', label: 'Dễ' },
    medium: { color: '#F59E0B', bg: '#FFFBEB', label: 'Trung bình' },
    hard: { color: '#FF3B30', bg: '#FEF2F2', label: 'Khó' },
};

interface SessionCardProps {
    session: ISessionSummary;
}

export function SessionCard({ session }: SessionCardProps) {
    const score = session.result?.overallScore;
    const scoreConfig = score !== undefined ? getScoreConfig(score) : null;
    const diffConfig = difficultyStyle[session.difficultyLevel] || difficultyStyle.medium;

    // Format ngày giờ
    const date = new Date(session.startedAt);
    const formattedDate = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const isAbandoned = session.status === 'abandon';
    const isPending = session.status === 'pending_result';
    const isGenerating = session.status === 'generating';
    const CardWrapper = isAbandoned ? 'div' : Link;
    const href = isAbandoned
        ? undefined
        : session.status === 'completed' || isPending
        ? `/mock-interview/${session.sessionId}/result`
        : `/mock-interview/${session.sessionId}`;

    return (
        <CardWrapper
            href={href as any}
            className={`group flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E5E5EA] transition-all duration-200 ${
                isAbandoned ? 'opacity-60 grayscale' : 'hover:border-[#AEAEB2] hover:shadow-sm cursor-pointer'
            }`}
        >
            {/* Icon / Score circle */}
            <div className="flex-shrink-0">
                {session.status === 'in_progress' ? (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#EBF3FD]">
                        <Clock className="w-5 h-5 text-[#0071E3]" />
                    </div>
                ) : isGenerating ? (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#EBF3FD]">
                        <LoaderCircle className="w-5 h-5 text-[#0071E3] animate-spin" />
                    </div>
                ) : isPending ? (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#EBF3FD]">
                        <LoaderCircle className="w-5 h-5 text-[#0071E3] animate-spin" />
                    </div>
                ) : session.status === 'abandon' ? (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#FEF2F2]">
                        <Ban className="w-5 h-5 text-[#FF3B30]" />
                    </div>
                ) : scoreConfig && score !== undefined ? (
                    <div
                        className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center"
                        style={{ background: scoreConfig.bg }}
                    >
                        <span className="text-[15px] leading-none" style={{ fontFamily: SF, fontWeight: 700, color: scoreConfig.color }}>
                            {Math.round(score)}
                        </span>
                        <span className="text-[8px] mt-0.5" style={{ color: scoreConfig.color, fontWeight: 500 }}>
                            /100
                        </span>
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-[#AEAEB2]" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] text-[#1D1D1F] truncate" style={{ fontFamily: SF, fontWeight: 600 }}>
                        {session.topic.name}
                    </p>
                    <span
                        className="text-[10px] rounded-full px-2 py-0.5 flex-shrink-0"
                        style={{ background: diffConfig.bg, color: diffConfig.color, fontWeight: 500 }}
                    >
                        {diffConfig.label}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#AEAEB2] flex items-center gap-1" style={{ fontFamily: SFT }}>
                        <Clock className="w-3 h-3" />
                        {formattedDate} · {formattedTime}
                    </span>
                    {session.status === 'in_progress' && (
                        <span className="text-[10px]" style={{ color: '#0071E3', fontWeight: 500 }}>
                            Đang diễn ra...
                        </span>
                    )}
                    {isGenerating && (
                        <span className="text-[10px]" style={{ color: '#0071E3', fontWeight: 500 }}>
                            Đang tạo câu hỏi...
                        </span>
                    )}
                    {isPending && (
                        <span className="text-[10px]" style={{ color: '#0071E3', fontWeight: 500 }}>
                            Đang chấm điểm...
                        </span>
                    )}
                    {session.status === 'abandon' && (
                        <span className="text-[10px]" style={{ color: '#FF3B30', fontWeight: 500 }}>
                            Đã hủy
                        </span>
                    )}
                    {session.status === 'completed' && scoreConfig && (
                        <span className="text-[10px]" style={{ color: scoreConfig.color, fontWeight: 500 }}>
                            {scoreConfig.label}
                        </span>
                    )}
                </div>
            </div>

            {/* Arrow */}
            {!isAbandoned && (
                <ChevronRight className="w-4 h-4 text-[#AEAEB2] group-hover:text-[#0071E3] transition-colors flex-shrink-0" />
            )}
        </CardWrapper>
    );
}
