'use client';

import { SFT } from '@/types/fonts/fonts';
import { AiUsageLogsHeader } from './ui/AiUsageLogsHeader';
import { IAiUsageLogDto } from '@/types/interfaces/ai-usage-log.interface';
import { IPaginationMeta } from '@ats-platform/types';
import { AiUsageLogsStats } from './ui/AiUsageLogsStats';
import { AiUsageLogsFilter } from './ui/AiUsageLogsFilter';
import { AiUsageLogsTable } from './ui/AiUsageLogsTable';
import { useState } from 'react';

interface AiUsageLogsClientProps {
    logs: IAiUsageLogDto[];
    pagination: IPaginationMeta;
}

export type ActionTypeFilter = 'all' | IAiUsageLogDto['actionType'];
export type StatusFilter = 'all' | IAiUsageLogDto['status'];

export default function AiUsageLogsClient({ logs, pagination }: AiUsageLogsClientProps) {
    const [actionFilter, setActionFilter] = useState<ActionTypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filteredLogs = logs.filter((log) => {
        if (actionFilter !== 'all' && log.actionType !== actionFilter) return false;
        if (statusFilter !== 'all' && log.status !== statusFilter) return false;
        return true;
    });

    return (
        <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
            <AiUsageLogsHeader />
            <AiUsageLogsStats logs={logs} />
            <AiUsageLogsFilter
                actionFilter={actionFilter}
                statusFilter={statusFilter}
                onActionFilterChange={setActionFilter}
                onStatusFilterChange={setStatusFilter}
                totalCount={pagination.total}
                filteredCount={filteredLogs.length}
            />
            <AiUsageLogsTable logs={filteredLogs} pagination={pagination} />
        </div>
    );
}
