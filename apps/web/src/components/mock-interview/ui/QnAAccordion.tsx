'use client';

import { useId, useState, type ReactNode } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { IInterviewQnA } from '@/types/interfaces/interview.interface';
import { DIFFICULTY_OPTIONS } from './DifficultySelector';

interface QnAAccordionProps {
    qna: IInterviewQnA;
}

function Block({ label, labelClass = 'text-ink-3', children }: { label: string; labelClass?: string; children: ReactNode }) {
    return (
        <div className="min-w-0">
            <p className={cn('text-caption', labelClass)}>{label}</p>
            <div className="mt-1">{children}</div>
        </div>
    );
}

function Points({ label, items, icon: Icon, iconClass }: { label: string; items: string[]; icon: typeof Check; iconClass: string }) {
    return (
        <Block label={label}>
            <ul className="flex flex-col gap-1.5">
                {items.map((point, i) => (
                    <li key={i} className="flex gap-2 break-words text-body-sm text-ink-2">
                        <Icon aria-hidden="true" strokeWidth={1.75} className={cn('mt-0.5 size-4 shrink-0', iconClass)} />
                        <span className="min-w-0">{point}</span>
                    </li>
                ))}
            </ul>
        </Block>
    );
}

/** One question of the report: a disclosure button (question, difficulty, score) that reveals the answer and the AI's review. */
export function QnAAccordion({ qna }: QnAAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const panelId = useId();
    const difficulty = DIFFICULTY_OPTIONS.find((o) => o.value === qna.difficulty)?.label ?? 'Trung bình';
    const score = qna.correctnessScore;
    const covered = qna.coveredPoints ?? [];
    const missed = qna.missedPoints ?? [];
    const text = 'whitespace-pre-wrap break-words text-body-sm';

    return (
        <div>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
                onClick={() => setIsOpen((open) => !open)}
                className="flex w-full items-start gap-3 rounded-ctl px-3 py-3 text-left transition-colors duration-hover hover:bg-surface-2"
            >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="text-caption tabular-nums text-ink-3">Câu {qna.orderIndex}</span>
                        <Badge>{difficulty}</Badge>
                        {qna.hasFollowup && <Badge tone="accent">Câu hỏi bổ sung</Badge>}
                    </span>
                    <span className="break-words text-body-sm text-ink">{qna.questionText}</span>
                </span>
                <span className="mt-0.5 shrink-0 text-body-sm font-medium tabular-nums text-ink">
                    <span className="sr-only">Điểm </span>
                    {score === null ? '–' : Math.round(score)}
                </span>
                <ChevronDown
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className={cn(
                        'mt-0.5 size-4 shrink-0 text-ink-3 transition-transform duration-hover ease-out-expo',
                        isOpen && 'rotate-180',
                    )}
                />
            </button>

            {isOpen && (
                <div id={panelId} className="flex animate-rise flex-col gap-4 px-3 pb-4 pt-1">
                    <Block label="Câu trả lời của bạn">
                        <p className={cn(text, 'text-ink-2')}>{qna.answerText || 'Chưa trả lời.'}</p>
                    </Block>

                    {qna.hasFollowup && qna.followupQuestion && (
                        <Block label="Câu hỏi bổ sung">
                            <p className={cn(text, 'text-ink')}>{qna.followupQuestion}</p>
                            {qna.followupAnswer && <p className={cn(text, 'mt-2 text-ink-2')}>{qna.followupAnswer}</p>}
                        </Block>
                    )}

                    {qna.feedback && (
                        <div className="rounded-ctl bg-surface-2 p-3">
                            <Block label="Nhận xét AI" labelClass="text-accent-text">
                                <p className={cn(text, 'text-ink-2')}>{qna.feedback}</p>
                            </Block>
                        </div>
                    )}

                    {(covered.length > 0 || missed.length > 0) && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {covered.length > 0 && <Points label="Đã đề cập" items={covered} icon={Check} iconClass="text-success" />}
                            {missed.length > 0 && <Points label="Chưa đề cập" items={missed} icon={X} iconClass="text-danger" />}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
