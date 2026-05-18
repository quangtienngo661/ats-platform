'use client';

import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { SF, SFT } from '@/types/fonts/fonts';
import { IInterviewResult } from '@/types/interfaces/interview.interface';
import { ScoreOverview } from './ui/ScoreOverview';
import { QnAAccordion } from './ui/QnAAccordion';
import { ActionPlanCard } from './ui/ActionPlanCard';

interface InterviewResultClientProps {
    result: IInterviewResult;
}

export default function InterviewResultClient({ result }: InterviewResultClientProps) {
    const session = result.session!;

    return (
        // Layout cha có overflow-hidden (cần thiết cho trang chat)
        // Nên trang result cần tự tạo scroll container riêng
        <div className="h-full overflow-y-auto">
            <div className="max-w-[900px] mx-auto px-6 py-8" style={{ fontFamily: SFT }}>
            {/* ─── Header ─────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
            >
                <div className="flex items-center gap-3">
                    <Link
                        href="/mock-interview"
                        className="p-2 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#6E6E73] transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-[18px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                            Kết quả phỏng vấn
                        </h1>
                        <p className="text-[12px] text-[#6E6E73]">
                            {session.topic.name} · {new Date(result.generatedAt).toLocaleDateString('vi-VN')}
                        </p>
                    </div>
                </div>

                <Link
                    href="/mock-interview"
                    className="flex items-center gap-2 px-3.5 py-2 bg-[#EBF3FD] hover:bg-[#D6E9FA] text-[#0071E3] rounded-xl text-[12px] transition-all"
                    style={{ fontWeight: 500 }}
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Làm lại
                </Link>
            </motion.div>

            {/* ─── Score Overview ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <ScoreOverview
                    overallScore={result.overallScore}
                    strengths={result.strengths || []}
                    weaknesses={result.weaknesses || []}
                />
            </motion.div>

            {/* ─── Action Plan ─────────────────────────────────────────── */}
            {result.actionPlan && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-5"
                >
                    <ActionPlanCard actionPlan={result.actionPlan} />
                </motion.div>
            )}

            {/* ─── QnA Detail ─────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
            >
                <h2 className="text-[14px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>
                    Chi tiết từng câu hỏi
                </h2>
                <div className="flex flex-col gap-3">
                    {session.qnas?.map((qna, index) => (
                        <motion.div
                            key={qna.qnaId}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                        >
                            <QnAAccordion qna={qna} />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
        </div>
    );
}
