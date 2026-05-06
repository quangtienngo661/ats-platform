'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Target, MessageSquare, Briefcase, Clock, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IAiUsageLogDto } from '@/types/interfaces/ai-usage-log.interface';
import { IAiUsageLogPagination } from '@/servers/ai-usage-logs/ai-usage-logs.action';

interface AiUsageLogsTableProps {
    logs: IAiUsageLogDto[];
    pagination: IAiUsageLogPagination;
}

// ── Action type config ─────────────────────────────────────────────────────
const ACTION_CONFIG: Record<IAiUsageLogDto['actionType'], {
    label: string;
    icon: typeof FileText;
    color: string;
    bg: string;
}> = {
    cv_parsing: { label: 'CV Parsing', icon: FileText, color: '#0071E3', bg: '#EBF3FD' },
    cv_scoring: { label: 'CV Scoring', icon: Target, color: '#6366F1', bg: '#F5F3FF' },
    mock_interview: { label: 'Mock Interview', icon: MessageSquare, color: '#EC4899', bg: '#FDF2F8' },
    job_parsing: { label: 'Job Parsing', icon: Briefcase, color: '#F59E0B', bg: '#FFFBEB' },
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

// ── Table Row ────────────────────────────────────────────────────────────────
function LogRow({ log }: { log: IAiUsageLogDto }) {
    const config = ACTION_CONFIG[log.actionType];
    const Icon = config.icon;
    const totalTokens = log.promptTokens + log.completionTokens;

    return (
        <tr className="border-b border-[#F2F2F7] hover:bg-[#F5F5F7]/50 transition-colors">
            {/* Action Type */}
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: config.bg }}
                    >
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div>
                        <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                            {config.label}
                        </p>
                        <p className="text-[11px] text-[#AEAEB2] font-mono">{log.referenceId || '—'}</p>
                    </div>
                </div>
            </td>

            {/* Model */}
            <td className="px-5 py-4">
                <span className="text-[12px] text-[#6E6E73] bg-[#F5F5F7] rounded-md px-2 py-1 font-mono">
                    {log.modelName}
                </span>
            </td>

            {/* Tokens */}
            <td className="px-5 py-4">
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#0EA5E9]" />
                    <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                        {totalTokens.toLocaleString()}
                    </span>
                </div>
                <div className="flex gap-2 mt-1">
                    <span className="text-[10px] text-[#AEAEB2]">
                        ↑ {log.promptTokens.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#AEAEB2]">
                        ↓ {log.completionTokens.toLocaleString()}
                    </span>
                </div>
            </td>

            {/* Duration */}
            <td className="px-5 py-4">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#F59E0B]" />
                    <span className="text-[13px] text-[#1D1D1F]">{formatDuration(log.durationMs)}</span>
                </div>
            </td>

            {/* Status */}
            <td className="px-5 py-4">
                <span
                    className="text-[11px] rounded-full px-2.5 py-1 inline-flex items-center gap-1"
                    style={{
                        background: log.status === 'success' ? '#E8F5E9' : '#FEF2F2',
                        color: log.status === 'success' ? '#16A34A' : '#DC2626',
                        fontWeight: 600,
                    }}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`} />
                    {log.status === 'success' ? 'Thành công' : 'Thất bại'}
                </span>
            </td>

            {/* Time */}
            <td className="px-5 py-4 text-right">
                <p className="text-[12px] text-[#1D1D1F]">{formatTime(log.createdAt)}</p>
                <p className="text-[11px] text-[#AEAEB2]">{formatDate(log.createdAt)}</p>
            </td>
        </tr>
    );
}

// ── Table ────────────────────────────────────────────────────────────────────
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
        <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[#F2F2F7] bg-[#FAFAFA]">
                            {['Hành động', 'Model', 'Tokens', 'Thời gian', 'Trạng thái', 'Thời điểm'].map((h, i) => (
                                <th
                                    key={h}
                                    className={`px-5 py-3 text-[11px] text-[#AEAEB2] uppercase tracking-[0.05em] ${i === 5 ? 'text-right' : 'text-left'}`}
                                    style={{ fontFamily: SFT, fontWeight: 600 }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <LogRow key={log.logId} log={log} />
                        ))}
                    </tbody>
                </table>
            </div>

            {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <Zap className="w-10 h-10 text-[#AEAEB2] mb-3" />
                    <p className="text-[15px] text-[#6E6E73]" style={{ fontWeight: 500 }}>
                        Không có bản ghi nào
                    </p>
                    <p className="text-[12px] text-[#AEAEB2] mt-1">
                        Thử thay đổi bộ lọc để xem kết quả khác
                    </p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F2F2F7]">
                    <p className="text-[12px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
                        {startItem}–{endItem} / {total} bản ghi
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={page === 1}
                            onClick={() => goToPage(page - 1)}
                            className="p-1.5 rounded-lg text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${i}`} className="px-2 text-[12px] text-[#AEAEB2]">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => goToPage(p as number)}
                                        className={`w-7 h-7 rounded-lg text-[12px] transition-colors ${page === p ? 'bg-[#0071E3] text-white' : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'}`}
                                        style={{ fontFamily: SF, fontWeight: page === p ? 700 : 400 }}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                        <button
                            disabled={page === totalPages}
                            onClick={() => goToPage(page + 1)}
                            className="p-1.5 rounded-lg text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
