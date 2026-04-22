import { SlidersHorizontal } from 'lucide-react';
import { SFT } from '@/types/fonts/fonts';
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
    { value: 'mock_interview', label: 'Mock Interview' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'success', label: 'Thành công' },
    { value: 'failed', label: 'Thất bại' },
];

export function AiUsageLogsFilter({
    actionFilter,
    statusFilter,
    onActionFilterChange,
    onStatusFilterChange,
    totalCount,
    filteredCount,
}: AiUsageLogsFilterProps) {
    return (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 text-[#6E6E73]">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-[12px]" style={{ fontWeight: 500 }}>Bộ lọc</span>
            </div>

            <select
                value={actionFilter}
                onChange={(e) => onActionFilterChange(e.target.value as ActionTypeFilter)}
                className="px-3 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1D1D1F] bg-white outline-none focus:border-[#0EA5E9] transition-colors appearance-none pr-8"
                style={{ fontFamily: SFT }}
            >
                {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
                className="px-3 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1D1D1F] bg-white outline-none focus:border-[#0EA5E9] transition-colors appearance-none pr-8"
                style={{ fontFamily: SFT }}
            >
                {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            <div className="ml-auto">
                <span className="text-[12px] text-[#AEAEB2]">
                    Hiển thị {filteredCount}/{totalCount} bản ghi
                </span>
            </div>
        </div>
    );
}
