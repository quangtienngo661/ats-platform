import { Surface } from '@/components/ui';
import { IAiUsageLogDto } from '@/types/interfaces/ai-usage-log.interface';

interface AiUsageLogsStatsProps {
    logs: IAiUsageLogDto[];
}

export function AiUsageLogsStats({ logs }: AiUsageLogsStatsProps) {
    const totalTokens = logs.reduce((sum, l) => sum + l.promptTokens + l.completionTokens, 0);
    const avgDuration = logs.length > 0
        ? Math.round(logs.reduce((sum, l) => sum + l.durationMs, 0) / logs.length)
        : 0;
    const successCount = logs.filter((l) => l.status === 'success').length;
    const failedCount = logs.filter((l) => l.status === 'failed').length;
    const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0;

    const stats = [
        { value: totalTokens.toLocaleString(), label: 'Tổng tokens' },
        { value: `${(avgDuration / 1000).toFixed(1)}s`, label: 'Thời gian TB' },
        { value: `${successRate}%`, label: `Thành công (${successCount}/${logs.length})` },
        { value: failedCount.toString(), label: 'Thất bại' },
    ];

    return (
        <Surface as="dl" className="grid grid-cols-1 divide-y divide-line sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {stats.map((stat) => (
                <div key={stat.label} className="min-w-0 flex items-baseline justify-between gap-3 px-4 py-2.5 sm:block sm:py-3">
                    <dt className="truncate text-caption text-ink-3" title={stat.label}>{stat.label}</dt>
                    <dd className="mt-0.5 text-title-sm font-mono tabular-nums text-ink">{stat.value}</dd>
                </div>
            ))}
        </Surface>
    );
}
