'use client';

import { useEffect, useState } from 'react';
import { SF } from '@/types/fonts/fonts';
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

function dotColor(status: string, isCurrent: boolean) {
    if (!isCurrent) return '#AEAEB2';
    if (status === 'rejected') return '#DC2626';
    if (status === 'cancelled') return '#6E6E73';
    return '#0071E3';
}

export function ApplicationTimeline({ history, status, appliedAt }: ApplicationTimelineProps) {
    const mounted = useMounted();
    const steps = buildTimeline(history, { status, appliedAt });

    return (
        <section aria-labelledby="application-timeline-title" className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
            <h2
                id="application-timeline-title"
                className="text-[13px] text-[#6E6E73] uppercase tracking-[0.04em] mb-4"
                style={{ fontFamily: SF, fontWeight: 600 }}
            >
                Tiến trình
            </h2>
            <ol aria-label="Tiến trình đơn ứng tuyển" className="flex flex-col">
                {steps.map((step, index) => {
                    const color = dotColor(step.status, step.isCurrent);
                    const isLast = index === steps.length - 1;
                    return (
                        <li
                            key={step.key}
                            aria-current={step.isCurrent ? 'step' : undefined}
                            className="relative flex gap-3 pb-5 last:pb-0"
                        >
                            {!isLast && (
                                <span aria-hidden="true" className="absolute left-[7px] top-4 bottom-0 w-px bg-[#E5E5EA]" />
                            )}
                            <span
                                aria-hidden="true"
                                className="relative mt-0.5 h-[15px] w-[15px] flex-shrink-0 rounded-full border-2 bg-white"
                                style={{ borderColor: color, boxShadow: step.isCurrent ? `0 0 0 3px ${color}22` : undefined }}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span
                                        className="text-[13px] text-[#1D1D1F]"
                                        style={{ fontWeight: step.isCurrent ? 700 : 500 }}
                                    >
                                        {step.label}
                                    </span>
                                    {step.isRevert && (
                                        <span className="text-[11px] rounded-md px-1.5 py-0.5 bg-[#FFF7ED] text-[#D97706]" style={{ fontWeight: 500 }}>
                                            Được xem xét lại
                                        </span>
                                    )}
                                    {step.isCurrent && (
                                        <span
                                            className="text-[10px] rounded-full px-2 py-0.5"
                                            style={{ background: `${color}14`, color, fontWeight: 600 }}
                                        >
                                            Hiện tại
                                        </span>
                                    )}
                                </div>
                                <time dateTime={step.at} className="mt-0.5 block text-[12px] text-[#6E6E73]">
                                    {mounted ? formatMoment(step.at) : ''}
                                </time>
                                {step.rejectionReason && (
                                    <div className="mt-2 rounded-xl border border-[#FDE2E2] bg-[#FEF2F2] px-3 py-2">
                                        <p className="text-[11px] text-[#DC2626]" style={{ fontWeight: 600 }}>
                                            Lý do từ chối
                                        </p>
                                        <p className="mt-0.5 text-[13px] text-[#1D1D1F] break-words">{step.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
