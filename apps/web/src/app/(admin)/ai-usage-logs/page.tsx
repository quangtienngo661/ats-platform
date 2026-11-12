import { getUiVariant } from '@/lib/ui-variant';
import LegacyAiUsageLogsPage from '@/legacy/app/(admin)/ai-usage-logs/page';
import { positivePage } from '@/lib/pagination';
import AiUsageLogsClient from '@/components/ai-usage-logs/AiUsageLogsClient';
import { getAIUsageLogsAction, IAiUsageLogResponse } from '@/servers/ai-usage-logs/ai-usage-logs.action';

interface AiUsageLogsPageProps {
    searchParams: Promise<{ page?: string, actionType?: string, status?: string }>;
}

export default async function AiUsageLogsPage({ searchParams }: AiUsageLogsPageProps) {
    if ((await getUiVariant()) === 'legacy') return <LegacyAiUsageLogsPage searchParams={searchParams} />;
    const { page: pageParam } = await searchParams;
    const page = positivePage(pageParam);
    const res = await getAIUsageLogsAction(page) as IAiUsageLogResponse;

    return (
        <AiUsageLogsClient
            logs={res.items}
            pagination={res.pagination}
        />
    );
}
