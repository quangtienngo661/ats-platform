import { Select } from '@/components/ui';
import type { ActionTypeFilter, StatusFilter } from '../AiUsageLogsClient';

interface AiUsageLogsFilterProps {
    actionFilter: ActionTypeFilter;
    statusFilter: StatusFilter;
    onActionFilterChange: (value: ActionTypeFilter) => void;
    onStatusFilterChange: (value: StatusFilter) => void;
    totalCount: number;
    filteredCount: number;
}

const ACTION_OPTIONS: { value: ActionTypeFilter; label: string }[] = [
    { value: 'all', label: 'Tất cả loại' },
    { value: 'cv_parsing', label: 'CV Parsing' },
    { value: 'cv_scoring', label: 'CV Scoring' },
    { value: 'job_parsing', label: 'Job Parsing' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'mock_interview', label: 'Mock Interview' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'success', label: 'Thành công' },
    { value: 'failed', label: 'Thất bại' },
];

/** Controls only, as a fragment: the page toolbar lays them out beside the title. */
export function AiUsageLogsFilter({
    actionFilter,
    statusFilter,
    onActionFilterChange,
    onStatusFilterChange,
    totalCount,
    filteredCount,
}: AiUsageLogsFilterProps) {
    return (
        <>
            <span className="text-caption tabular-nums text-ink-3">
                Hiển thị {filteredCount}/{totalCount} bản ghi
            </span>

            <Select
                aria-label="Lọc loại thao tác AI"
                value={actionFilter}
                onChange={(e) => onActionFilterChange(e.target.value as ActionTypeFilter)}
                className="w-full sm:w-44"
            >
                {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </Select>

            <Select
                aria-label="Lọc trạng thái AI"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
                className="w-full sm:w-44"
            >
                {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </Select>
        </>
    );
}
