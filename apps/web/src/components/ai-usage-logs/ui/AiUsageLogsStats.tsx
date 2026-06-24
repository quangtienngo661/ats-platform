import { Zap, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
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
        {
            icon: <Zap className="w-5 h-5 text-[#0EA5E9]" />,
            bg: '#F0F9FF',
            value: totalTokens.toLocaleString(),
            label: 'Tổng tokens',
        },
        {
            icon: <Clock className="w-5 h-5 text-[#F59E0B]" />,
            bg: '#FFFBEB',
            value: `${(avgDuration / 1000).toFixed(1)}s`,
            label: 'Thời gian TB',
        },
        {
            icon: <CheckCircle className="w-5 h-5 text-[#34C759]" />,
            bg: '#E8F5E9',
            value: `${successRate}%`,
            label: `Thành công (${successCount}/${logs.length})`,
        },
        {
            icon: <XCircle className="w-5 h-5 text-[#FF3B30]" />,
            bg: '#FEF2F2',
            value: failedCount.toString(),
            label: 'Thất bại',
        },
    ];

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: stat.bg }}
                        >
                            {stat.icon}
                        </div>
                        <div>
                            <p
                                className="text-[22px] text-[#1D1D1F] tracking-[-0.01em]"
                                style={{ fontFamily: SF, fontWeight: 700 }}
                            >
                                {stat.value}
                            </p>
                            <p className="text-[12px] text-[#6E6E73]">{stat.label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
