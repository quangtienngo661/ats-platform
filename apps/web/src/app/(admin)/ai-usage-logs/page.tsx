import { positivePage } from '@/lib/pagination';
import AiUsageLogsClient from '@/components/ai-usage-logs/AiUsageLogsClient';
import { AiModelPricesPanel } from '@/components/ai-usage-logs/ui/AiModelPricesPanel';
import { getAIUsageLogsAction, IAiUsageLogResponse } from '@/servers/ai-usage-logs/ai-usage-logs.action';
import { getModelPricesAction } from '@/servers/analytics/analytics.action';

interface AiUsageLogsPageProps {
    searchParams: Promise<{ page?: string, actionType?: string, status?: string }>;
}

export default async function AiUsageLogsPage({ searchParams }: AiUsageLogsPageProps) {
    const { page: pageParam } = await searchParams;
    const page = positivePage(pageParam);
    const [res, prices] = await Promise.all([
        getAIUsageLogsAction(page) as Promise<IAiUsageLogResponse>,
        // The prices the dashboard's AI cost is estimated from (GĐ4 R21).
        getModelPricesAction(),
    ]);

    return (
        <>
            <AiUsageLogsClient
                logs={res.items}
                pagination={res.pagination}
            />
            <div className="px-6 pb-6">
                <AiModelPricesPanel prices={prices} />
            </div>
        </>
    );
}
