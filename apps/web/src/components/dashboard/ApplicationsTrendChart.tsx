'use client';

import { useSyncExternalStore } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Surface } from '@/components/ui';

interface ApplicationsTrendChartProps {
    data: { month: string; value: number }[];
}

const REDUCED = '(prefers-reduced-motion: reduce)';

function subscribeReduced(cb: () => void) {
    const mq = window.matchMedia(REDUCED);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
}

function usePrefersReducedMotion() {
    return useSyncExternalStore(
        subscribeReduced,
        () => window.matchMedia(REDUCED).matches,
        () => false,
    );
}

const TICK = { fill: 'rgb(var(--ink-3))', fontSize: 12 };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value?: number | string }[]; label?: string | number }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-ctl bg-surface px-3 py-2 shadow-e4">
            <p className="text-caption text-ink-3">{label}</p>
            <p className="text-body-sm font-medium tabular-nums text-ink">{payload[0].value} ứng viên</p>
        </div>
    );
}

export default function ApplicationsTrendChart({ data }: ApplicationsTrendChartProps) {
    const reduced = usePrefersReducedMotion();
    return (
        <Surface className="h-full p-5">
            <h2 className="text-title-sm text-ink">Ứng tuyển theo thời gian</h2>
            <p className="mt-0.5 text-caption text-ink-3">6 tháng gần nhất</p>
            {data.length > 0 ? (
                <div className="mt-4">
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="dashboard-trend-fill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.16} />
                                    <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                            <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
                            <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgb(var(--line-strong))' }} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="rgb(var(--accent))"
                                strokeWidth={2}
                                fill="url(#dashboard-trend-fill)"
                                dot={false}
                                activeDot={{ r: 4, fill: 'rgb(var(--accent))', stroke: 'rgb(var(--surface))', strokeWidth: 2 }}
                                isAnimationActive={!reduced}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="flex h-[220px] items-center justify-center text-body-sm text-ink-3">Chưa có dữ liệu ứng tuyển</p>
            )}
        </Surface>
    );
}
