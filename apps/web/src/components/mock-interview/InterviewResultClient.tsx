'use client';

import { RotateCcw } from 'lucide-react';
import { Breadcrumbs, ButtonLink, EmptyState, PageToolbar, Reveal, Surface } from '@/components/ui';
import { IInterviewResult } from '@/types/interfaces/interview.interface';
import { ScoreOverview } from './ui/ScoreOverview';
import { QnAAccordion } from './ui/QnAAccordion';
import { ActionPlanCard } from './ui/ActionPlanCard';

interface InterviewResultClientProps {
    result: IInterviewResult;
}

/**
 * The report after a session. The interview layout is the night shell (it also hosts the live chat), so the
 * report brings its own light canvas: it reads as a document to keep, not as part of the session.
 */
export default function InterviewResultClient({ result }: InterviewResultClientProps) {
    const session = result.session;
    if (!session) throw new Error("Thiếu dữ liệu phiên phỏng vấn");
    const qnas = session.qnas ?? [];

    return (
        <div className="min-h-dvh bg-canvas text-ink">
            <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
                <Reveal className="flex flex-col gap-3">
                    <Breadcrumbs items={[{ label: 'Phỏng vấn thử', href: '/mock-interview' }, { label: 'Kết quả' }]} />
                    <PageToolbar title="Kết quả phỏng vấn">
                        <ButtonLink href="/mock-interview">
                            <RotateCcw aria-hidden="true" strokeWidth={1.75} />
                            Làm phiên mới
                        </ButtonLink>
                    </PageToolbar>
                    <p className="-mt-1 break-words text-body-sm text-ink-3">
                        {session.topic.name} ·{' '}
                        <time dateTime={result.generatedAt}>
                            {new Date(result.generatedAt).toLocaleDateString('vi-VN')}
                        </time>
                    </p>
                </Reveal>

                <Reveal delay={0.05}>
                    <ScoreOverview
                        overallScore={result.overallScore}
                        strengths={result.strengths || []}
                        weaknesses={result.weaknesses || []}
                        questions={qnas}
                    />
                </Reveal>

                {result.actionPlan && (
                    <Reveal delay={0.1}>
                        <ActionPlanCard actionPlan={result.actionPlan} />
                    </Reveal>
                )}

                <Reveal as="section" delay={0.15}>
                    <h2 className="mb-3 text-title-sm text-ink">Chi tiết từng câu hỏi</h2>
                    <Surface className="p-1.5">
                        {qnas.length > 0 ? (
                            <ul className="divide-y divide-line">
                                {qnas.map((qna) => (
                                    <li key={qna.qnaId}>
                                        <QnAAccordion qna={qna} />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState
                                className="py-10"
                                title="Chưa có câu hỏi nào"
                                description="Phiên này không lưu câu hỏi nào để xem lại."
                            />
                        )}
                    </Surface>
                </Reveal>
            </div>
        </div>
    );
}
