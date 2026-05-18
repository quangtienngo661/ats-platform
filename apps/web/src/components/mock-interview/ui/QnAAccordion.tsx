'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IInterviewQnA } from '@/types/interfaces/interview.interface';

// Difficulty badge styles
const difficultyStyle: Record<string, { color: string; bg: string; label: string }> = {
    easy: { color: '#34C759', bg: '#F0FDF4', label: 'Dễ' },
    medium: { color: '#F59E0B', bg: '#FFFBEB', label: 'TB' },
    hard: { color: '#FF3B30', bg: '#FEF2F2', label: 'Khó' },
};

function getScoreColor(score: number) {
    if (score >= 75) return '#34C759';
    if (score >= 50) return '#F59E0B';
    return '#FF3B30';
}

interface QnAAccordionProps {
    qna: IInterviewQnA;
}

export function QnAAccordion({ qna }: QnAAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const score = qna.correctnessScore || 0;
    const scoreColor = getScoreColor(score);
    const diffConfig = difficultyStyle[qna.difficulty] || difficultyStyle.medium;

    return (
        <div className="bg-white rounded-xl border border-[#E5E5EA] overflow-hidden transition-shadow hover:shadow-sm">
            {/* Header — always visible */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F5F5F7]/50"
            >
                {/* Score badge */}
                <div
                    className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: `${scoreColor}10` }}
                >
                    <span className="text-[14px] leading-none" style={{ fontFamily: SF, fontWeight: 700, color: scoreColor }}>
                        {Math.round(score)}
                    </span>
                </div>

                {/* Question text */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
                            Câu {qna.orderIndex}
                        </span>
                        <span
                            className="text-[9px] rounded-full px-1.5 py-0.5"
                            style={{ background: diffConfig.bg, color: diffConfig.color, fontWeight: 600 }}
                        >
                            {diffConfig.label}
                        </span>
                        {qna.hasFollowup && (
                            <span className="text-[9px] rounded-full px-1.5 py-0.5 bg-[#F5F3FF] text-[#6366F1]" style={{ fontWeight: 500 }}>
                                Follow-up
                            </span>
                        )}
                    </div>
                    <p className="text-[12px] text-[#1D1D1F] truncate" style={{ fontFamily: SFT }}>
                        {qna.questionText}
                    </p>
                </div>

                {/* Expand icon */}
                <ChevronDown
                    className="w-4 h-4 text-[#AEAEB2] transition-transform duration-200 flex-shrink-0"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            {/* Expanded content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 border-t border-[#F2F2F7]">
                            {/* Answer */}
                            <div className="mt-3 mb-3">
                                <p className="text-[10px] text-[#AEAEB2] mb-1" style={{ fontWeight: 600 }}>Câu trả lời</p>
                                <div className="bg-[#EBF3FD] rounded-xl p-3">
                                    <p className="text-[12px] text-[#1D1D1F] leading-[1.6]" style={{ fontFamily: SFT }}>
                                        {qna.answerText || '(Chưa trả lời)'}
                                    </p>
                                </div>
                            </div>

                            {/* Follow-up */}
                            {qna.hasFollowup && qna.followupQuestion && (
                                <div className="mb-3">
                                    <p className="text-[10px] text-[#6366F1] mb-1 flex items-center gap-1" style={{ fontWeight: 600 }}>
                                        <MessageSquare className="w-3 h-3" />
                                        Câu hỏi bổ sung
                                    </p>
                                    <div className="bg-[#F5F3FF] rounded-xl p-3 mb-2">
                                        <p className="text-[12px] text-[#1D1D1F] leading-[1.6]">{qna.followupQuestion}</p>
                                    </div>
                                    {qna.followupAnswer && (
                                        <div className="bg-[#EBF3FD] rounded-xl p-3">
                                            <p className="text-[12px] text-[#1D1D1F] leading-[1.6]">{qna.followupAnswer}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Feedback */}
                            {qna.feedback && (
                                <div className="mb-3 p-3 bg-[#FFFBEB] rounded-xl border border-[#F59E0B]/20">
                                    <p className="text-[10px] text-[#F59E0B] mb-1" style={{ fontWeight: 600 }}>Nhận xét AI</p>
                                    <p className="text-[12px] text-[#1D1D1F] leading-[1.6]" style={{ fontFamily: SFT }}>
                                        {qna.feedback}
                                    </p>
                                </div>
                            )}

                            {/* Covered & Missed Points */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Covered */}
                                {qna.coveredPoints && qna.coveredPoints.length > 0 && (
                                    <div>
                                        <p className="text-[10px] text-[#34C759] mb-1.5 flex items-center gap-1" style={{ fontWeight: 600 }}>
                                            <CheckCircle2 className="w-3 h-3" />
                                            Đã đề cập
                                        </p>
                                        <ul className="space-y-1">
                                            {qna.coveredPoints.map((p, i) => (
                                                <li key={i} className="text-[11px] text-[#6E6E73] flex items-start gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-[#34C759] mt-1.5 flex-shrink-0" />
                                                    {p}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Missed */}
                                {qna.missedPoints && qna.missedPoints.length > 0 && (
                                    <div>
                                        <p className="text-[10px] text-[#FF3B30] mb-1.5 flex items-center gap-1" style={{ fontWeight: 600 }}>
                                            <XCircle className="w-3 h-3" />
                                            Chưa đề cập
                                        </p>
                                        <ul className="space-y-1">
                                            {qna.missedPoints.map((p, i) => (
                                                <li key={i} className="text-[11px] text-[#6E6E73] flex items-start gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-[#FF3B30] mt-1.5 flex-shrink-0" />
                                                    {p}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
