'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Target, MessageSquare, Briefcase, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, IconButton, TBody, TD, TH, THead, TR, Table } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { IAiUsageLogDto } from '@/types/interfaces/ai-usage-log.interface';
import { IPaginationMeta } from '@ats-platform/types';

interface AiUsageLogsTableProps {
    logs: IAiUsageLogDto[];
    pagination: IPaginationMeta;
}

// ── Action type config ─────────────────────────────────────────────────────
const ACTION_CONFIG: Record<IAiUsageLogDto['actionType'], { label: string; icon: typeof FileText }> = {
    cv_parsing: { label: 'CV Parsing', icon: FileText },
    cv_scoring: { label: 'CV Scoring', icon: Target },
    mock_interview: { label: 'Mock Interview', icon: MessageSquare },
    job_parsing: { label: 'Job Parsing', icon: Briefcase },
    embedding: { label: 'Embedding', icon: Layers },
};

// ── Format helpers ───────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

/** Page numbers around the current one, with "…" where a run is skipped. */
function pageItems(current: number, total: number): (number | '...')[] {
    return Array.from({ length: total }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === total || Math.abs(p - current) <= 1)
        .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);
}

// ── Table Row ────────────────────────────────────────────────────────────────
function LogRow({ log }: { log: IAiUsageLogDto }) {
    const config = ACTION_CONFIG[log.actionType];
    const Icon = config.icon;
    const totalTokens = log.promptTokens + log.completionTokens;
    const reference = log.referenceId || '—';

    return (
        <TR>
            <TD>
                <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-ctl bg-surface-2 text-ink-2">
                        <Icon aria-hidden="true" strokeWidth={1.75} className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="font-medium text-ink">{config.label}</p>
                        <p className="max-w-40 truncate font-mono text-micro text-ink-3 sm:max-w-56" title={reference}>
                            {reference}
                        </p>
                    </div>
                </div>
            </TD>

            <TD>
                <span
                    className="block max-w-40 truncate font-mono text-caption text-ink-2 sm:max-w-56"
                    title={log.modelName}
                >
                    {log.modelName}
                </span>
            </TD>

            <TD numeric>
                <span className="font-mono tabular-nums text-ink">{totalTokens.toLocaleString()}</span>
                <div className="mt-0.5 flex justify-end gap-2 font-mono text-micro tabular-nums text-ink-3">
                    <span>↑ {log.promptTokens.toLocaleString()}</span>
                    <span>↓ {log.completionTokens.toLocaleString()}</span>
                </div>
            </TD>

            <TD numeric>
                <span className="font-mono tabular-nums text-ink">{formatDuration(log.durationMs)}</span>
            </TD>

            <TD>
                <Badge tone={log.status === 'success' ? 'success' : 'danger'}>
                    {log.status === 'success' ? 'Thành công' : 'Thất bại'}
                </Badge>
            </TD>

            <TD numeric>
                <p className="font-mono text-caption tabular-nums text-ink">{formatTime(log.createdAt)}</p>
                <p className="font-mono text-micro tabular-nums text-ink-3">{formatDate(log.createdAt)}</p>
            </TD>
        </TR>
    );
}

// ── Table ────────────────────────────────────────────────────────────────────
/** The caller shows the empty and no-match states, so `logs` is never empty here. */
export function AiUsageLogsTable({ logs, pagination }: AiUsageLogsTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { page, limit, total, totalPages } = pagination;
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    const goToPage = (targetPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(targetPage));
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="space-y-3">
            <Table className="min-w-[720px]">
                <THead>
                    <tr className="border-b border-line">
                        <TH>Hành động</TH>
                        <TH>Model</TH>
                        <TH numeric>Tokens</TH>
                        <TH numeric>Thời gian</TH>
                        <TH>Trạng thái</TH>
                        <TH numeric>Thời điểm</TH>
                    </tr>
                </THead>
                <TBody>
                    {logs.map((log) => (
                        <LogRow key={log.logId} log={log} />
                    ))}
                </TBody>
            </Table>

            {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-caption tabular-nums text-ink-3">
                        {startItem}–{endItem} / {total} bản ghi
                    </p>
                    <nav aria-label="Phân trang nhật ký AI" className="flex items-center gap-1">
                        <IconButton size="sm" aria-label="Trước" disabled={page === 1} onClick={() => goToPage(page - 1)}>
                            <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
                        </IconButton>
                        {pageItems(page, totalPages).map((p, i) =>
                            p === '...' ? (
                                <span key={`ellipsis-${i}`} aria-hidden="true" className="px-1 text-caption text-ink-3">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    type="button"
                                    aria-label={`Trang ${p}`}
                                    aria-current={page === p ? 'page' : undefined}
                                    onClick={() => goToPage(p)}
                                    className={cn(
                                        'inline-flex size-8 items-center justify-center rounded-ctl text-caption tabular-nums',
                                        'transition duration-press ease-out-expo active:scale-[.97]',
                                        page === p ? 'bg-ink text-surface' : 'text-ink-2 hover:bg-ink/5 hover:text-ink',
                                    )}
                                >
                                    {p}
                                </button>
                            ),
                        )}
                        <IconButton size="sm" aria-label="Tiếp" disabled={page === totalPages} onClick={() => goToPage(page + 1)}>
                            <ChevronRight aria-hidden="true" strokeWidth={1.75} />
                        </IconButton>
                    </nav>
                </div>
            )}
        </div>
    );
}
