import { Plus, Search } from 'lucide-react';
import { Button, Input, PageToolbar, Segmented } from '@/components/ui';

export type JobFilter = 'all' | 'active' | 'draft' | 'closed';

interface JobPostingsHeaderProps {
    onAdd: () => void;
    filter: JobFilter;
    onFilterChange: (filter: JobFilter) => void;
    counts: Record<JobFilter, number>;
    search: string;
    onSearchChange: (value: string) => void;
}

const FILTERS: { value: JobFilter; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'active', label: 'Đang tuyển' },
    { value: 'draft', label: 'Bản nháp' },
    { value: 'closed', label: 'Đã đóng' },
];

export function JobPostingsHeader({ onAdd, filter, onFilterChange, counts, search, onSearchChange }: JobPostingsHeaderProps) {
    return (
        <PageToolbar title="Tin tuyển dụng">
            <Segmented
                label="Lọc theo trạng thái"
                value={filter}
                onValueChange={(v) => onFilterChange(v as JobFilter)}
                options={FILTERS.map((f) => ({ value: f.value, label: `${f.label} ${counts[f.value]}` }))}
            />
            <div className="relative w-full sm:w-56">
                <Search
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                />
                <Input
                    type="search"
                    aria-label="Tìm tin tuyển dụng"
                    placeholder="Tìm theo tên hoặc phòng ban"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8"
                />
            </div>
            <Button onClick={onAdd}>
                <Plus aria-hidden="true" strokeWidth={1.75} />
                Tạo tin tuyển dụng
            </Button>
        </PageToolbar>
    );
}
