'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Badge, Surface } from '@/components/ui';
import type { IApplicationHistoryItem } from '@/types/interfaces/application.interface';
import { buildTimeline } from './build-timeline';

interface ApplicationTimelineProps {
    history: IApplicationHistoryItem[];
    status: string;
    appliedAt?: string;
}

/** Times are written after mount: only the browser knows the candidate's timezone (R8). */
function useMounted(): boolean {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}

/** "01/10/2026 09:12" — vi-VN's own toLocaleString puts the time first. */
function formatMoment(value: string) {
    const date = new Date(value);
    const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${day} ${time}`;
}

function dotClasses(status: string, isCurrent: boolean) {
    if (!isCurrent) return 'bg-success-soft text-success';
    if (status === 'rejected') return 'bg-danger-solid text-surface';
    if (status === 'cancelled') return 'bg-ink-3 text-surface';
    return 'bg-accent text-surface';
}

export function ApplicationTimeline({ history, status, appliedAt }: ApplicationTimelineProps) {
    const mounted = useMounted();
    const steps = buildTimeline(history, { status, appliedAt });

    return (
        <Surface as="section" aria-labelledby="application-timeline-title" className="p-5">
            <h2 id="application-timeline-title" className="mb-4 text-title-sm font-semibold text-ink">
                Tiến trình
            </h2>
            <ol aria-label="Tiến trình đơn ứng tuyển" className="flex flex-col">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    return (
                        <li
                            key={step.key}
                            aria-current={step.isCurrent ? 'step' : undefined}
                            className="relative flex gap-3 pb-6 last:pb-0"
                        >
                            {!isLast && (
                                <span aria-hidden="true" className="absolute bottom-0 left-[9px] top-6 w-px bg-line" />
                            )}
                            <span
                                aria-hidden="true"
                                className={`relative mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full ${dotClasses(step.status, step.isCurrent)}`}
                            >
                                {step.isCurrent ? (
                                    <span className="size-1.5 rounded-full bg-surface" />
                                ) : (
                                    <Check size={12} strokeWidth={2} />
                                )}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className={`text-body ${step.isCurrent ? 'font-semibold text-ink' : 'font-medium text-ink-2'}`}>
                                        {step.label}
                                    </span>
                                    {step.isRevert && <Badge tone="warning">Được xem xét lại</Badge>}
                                    {step.isCurrent && <Badge tone="accent">Hiện tại</Badge>}
                                </div>
                                <time dateTime={step.at} className="mt-0.5 block text-caption tabular-nums text-ink-3">
                                    {mounted ? formatMoment(step.at) : ''}
                                </time>
                                {step.rejectionReason && (
                                    <div className="mt-2 rounded-ctl bg-danger-soft px-3 py-2">
                                        <p className="text-caption font-medium text-danger">Lý do từ chối</p>
                                        <p className="mt-0.5 break-words text-body-sm text-ink">{step.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </Surface>
    );
}
