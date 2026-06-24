import AiUsageLogsClient from '@/components/ai-usage-logs/AiUsageLogsClient';
import { getAIUsageLogsAction, IAiUsageLogResponse } from '@/servers/ai-usage-logs/ai-usage-logs.action';

interface AiUsageLogsPageProps {
    searchParams: Promise<{ page?: string, actionType?: string, status?: string }>;
}

export default async function AiUsageLogsPage({ searchParams }: AiUsageLogsPageProps) {
    const { page: pageParam } = await searchParams;
    const page = Math.max(1, Number(pageParam) || 1);
    const res = await getAIUsageLogsAction(page) as IAiUsageLogResponse;

    return (
        <AiUsageLogsClient
            logs={res.items}
            pagination={res.pagination}
        />
    );
}
