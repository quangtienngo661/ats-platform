'use client';

import { useState } from 'react';
import { SearchX, Zap } from 'lucide-react';
import { IPaginationMeta } from '@ats-platform/types';
import { Button, EmptyState, Surface } from '@/components/ui';
import { IAiUsageLogDto } from '@/types/interfaces/ai-usage-log.interface';
import { AiUsageLogsHeader } from './ui/AiUsageLogsHeader';
import { AiUsageLogsStats } from './ui/AiUsageLogsStats';
import { AiUsageLogsFilter } from './ui/AiUsageLogsFilter';
import { AiUsageLogsTable } from './ui/AiUsageLogsTable';
import { AiUsageLogsPagination } from './ui/AiUsageLogsPagination';

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

    const clearFilters = () => {
        setActionFilter('all');
        setStatusFilter('all');
    };

    return (
        <div className="space-y-4 p-4 lg:p-6">
            <AiUsageLogsHeader>
                <AiUsageLogsFilter
                    actionFilter={actionFilter}
                    statusFilter={statusFilter}
                    onActionFilterChange={setActionFilter}
                    onStatusFilterChange={setStatusFilter}
                    totalCount={pagination.total}
                    filteredCount={filteredLogs.length}
                />
            </AiUsageLogsHeader>
            <AiUsageLogsStats logs={logs} />

            {logs.length === 0 && pagination.total > 0 ? (
                <>
                    <Surface>
                        <EmptyState
                            icon={Zap}
                            title="Trang này không có nhật ký"
                            description="Chọn một trang khác bên dưới."
                        />
                    </Surface>
                    <AiUsageLogsPagination pagination={pagination} />
                </>
            ) : logs.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={Zap}
                        title="Chưa có nhật ký AI"
                        description="Mỗi lần AI phân tích CV, chấm điểm hoặc phỏng vấn thử sẽ được ghi ở đây."
                    />
                </Surface>
            ) : filteredLogs.length === 0 ? (
                <>
                    <Surface>
                        <EmptyState
                            icon={SearchX}
                            title="Không có nhật ký khớp"
                            description="Đổi bộ lọc để xem kết quả khác."
                            action={<Button variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button>}
                        />
                    </Surface>
                    <AiUsageLogsPagination pagination={pagination} />
                </>
            ) : (
                <AiUsageLogsTable logs={filteredLogs} pagination={pagination} />
            )}
        </div>
    );
}
