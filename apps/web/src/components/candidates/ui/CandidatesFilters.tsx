'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Search, Users } from 'lucide-react';
import { Button, ButtonLink, Checkbox, EmptyState, Input, Surface, TBody, TH, THead } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { useScreeningLiveRefresh } from '../useScreeningLiveRefresh';
import { BulkScreeningBar } from './BulkScreeningBar';
import { CandidatePeek } from './CandidatePeek';
import { CandidateRow } from './CandidateRow';
import { ExportCsvButton } from './ExportCsvButton';
import { CompareBar } from './CompareBar';

interface CandidatesFiltersProps {
    applications: IApplicationDto[];
    jobId: string;
    aiProfiles: ConfigProfile[];
}

const statusFilters = [
    { key: 'all', label: 'Tất cả' },
    { key: 'applied', label: 'Mới' },
    { key: 'screening', label: 'Sàng lọc' },
    { key: 'interview', label: 'Phỏng vấn' },
    { key: 'offer', label: 'Offer' },
] as const;

const COLUMNS = [
    { heading: 'Ứng viên', width: undefined },
    { heading: 'Gợi ý AI', width: 'w-40' },
    { heading: 'Vòng', width: 'w-28' },
    { heading: 'Nộp lúc', width: 'w-32' },
] as const;

/** Checkbox · the four headed columns · actions. */
const COLUMN_COUNT = COLUMNS.length + 2;

export function CandidatesFilters({ applications, jobId, aiProfiles }: CandidatesFiltersProps) {
    useScreeningLiveRefresh();
    const selectAllId = useId();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [peekId, setPeekId] = useState<string | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarHeight, setToolbarHeight] = useState(0);
    const hasApplications = applications.length > 0;

    useEffect(() => {
        const pageIds = new Set(applications.map(application => application.applicationId));
        setSelectedIds(previous => {
            const next = new Set(Array.from(previous).filter(id => pageIds.has(id)));
            return next.size === previous.size ? previous : next;
        });
        // A refresh can drop the peeked application; do not reopen it if it comes back later.
        setPeekId(previous => (previous && pageIds.has(previous) ? previous : null));
    }, [applications]);

    // The table header sticks under the sticky toolbar, so it needs the toolbar's height (it wraps when narrow).
    useEffect(() => {
        const toolbar = toolbarRef.current;
        if (!toolbar || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => setToolbarHeight(toolbar.offsetHeight));
        observer.observe(toolbar);
        return () => observer.disconnect();
    }, [hasApplications]);

    const onToggle = (applicationId: string) => {
        setSelectedIds(previous => {
            const next = new Set(previous);
            if (next.has(applicationId)) next.delete(applicationId);
            else next.add(applicationId);
            return next;
        });
    };

    const filtered = applications
        .filter(a => selectedFilter === 'all' || a.status === selectedFilter)
        .filter(a => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                a.candidate?.user?.fullName?.toLowerCase().includes(q) ||
                a.jobPosting?.title?.toLowerCase().includes(q)
            );
        });

    const allSelected = filtered.length > 0 && filtered.every(application => selectedIds.has(application.applicationId));
    const selectedApplications = applications.filter(a => selectedIds.has(a.applicationId));
    const selectedCount = selectedIds.size;
    const peekApplication = applications.find(a => a.applicationId === peekId) ?? null;

    const onToggleAll = () => {
        setSelectedIds(previous => {
            const next = new Set(previous);
            for (const application of filtered) {
                if (allSelected) next.delete(application.applicationId);
                else next.add(application.applicationId);
            }
            return next;
        });
    };

    if (!hasApplications) {
        return (
            <Surface>
                <EmptyState
                    icon={Users}
                    title="Chưa có ứng viên"
                    description="Đơn nộp vào tin này sẽ hiện ở đây. Tin cần ở trạng thái Đang tuyển để nhận đơn."
                    action={<ButtonLink href="/jobs" variant="secondary">Về danh sách tin</ButtonLink>}
                />
            </Surface>
        );
    }

    return (
        <div className="space-y-3" style={{ '--candidates-toolbar': `${toolbarHeight}px` } as CSSProperties}>
            <div
                ref={toolbarRef}
                className="-mx-4 flex flex-wrap items-center gap-2 px-4 py-2 md:sticky md:top-14 md:z-sticky md:bg-canvas/85 md:backdrop-blur lg:-mx-6 lg:px-6"
            >
                <div className="relative w-full sm:w-64">
                    <Search
                        aria-hidden="true"
                        strokeWidth={1.75}
                        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                    />
                    {/* type="text", not "search": the field is a plain textbox for assistive tech and tests alike. */}
                    <Input
                        aria-label="Tìm ứng viên"
                        type="text"
                        placeholder="Tìm theo tên hoặc vị trí"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div
                    role="group"
                    aria-label="Lọc theo vòng"
                    className="flex max-w-full flex-wrap gap-0.5 rounded-ctl bg-surface-2 p-0.5"
                >
                    {statusFilters.map(f => {
                        const count = f.key === 'all'
                            ? applications.length
                            : applications.filter(a => a.status === f.key).length;
                        const active = selectedFilter === f.key;
                        return (
                            <button
                                key={f.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setSelectedFilter(f.key)}
                                className={cn(
                                    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-ctl px-2.5 text-body-sm',
                                    'transition duration-press ease-out-expo active:scale-[.97]',
                                    active ? 'bg-surface text-ink shadow-e2' : 'text-ink-3 hover:text-ink',
                                )}
                            >
                                {f.label}{' '}
                                <span className="text-caption tabular-nums text-ink-3">{count}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:ml-auto">
                    <BulkScreeningBar
                        actions="auto"
                        jobId={jobId}
                        selectedApplications={selectedApplications}
                        applications={applications}
                        aiProfiles={aiProfiles}
                    />
                    <ExportCsvButton jobId={jobId} />
                </div>
            </div>

            {/* overflow-clip rounds the corners without becoming a scroll container, so the header can still stick. */}
            <Surface className="overflow-clip">
                <table className="w-full border-separate border-spacing-0 text-left text-body-sm text-ink-2 max-md:block md:table-fixed">
                    <THead className="max-md:block md:sticky md:top-[calc(3.5rem+var(--candidates-toolbar,0px))] md:z-sticky">
                        <tr className="max-md:flex max-md:items-center max-md:border-b max-md:border-line max-md:px-3 max-md:py-2">
                            <TH className="bg-surface max-md:flex max-md:h-auto max-md:items-center max-md:gap-3 max-md:p-0 md:w-10 md:border-b md:border-line">
                                <Checkbox
                                    id={selectAllId}
                                    aria-label="Chọn tất cả"
                                    checked={allSelected}
                                    onChange={onToggleAll}
                                    disabled={filtered.length === 0}
                                />
                                <label htmlFor={selectAllId} className="cursor-pointer text-caption text-ink-3 md:hidden">
                                    Chọn tất cả
                                </label>
                            </TH>
                            {/* Fixed layout: these widths hold, and the candidate column takes the rest and truncates. */}
                            {COLUMNS.map(({ heading, width }) => (
                                <TH key={heading} className={cn('bg-surface max-md:hidden md:border-b md:border-line', width)}>
                                    {heading}
                                </TH>
                            ))}
                            <TH className="bg-surface max-md:hidden md:w-14 md:border-b md:border-line">
                                <span className="sr-only">Thao tác</span>
                            </TH>
                        </tr>
                    </THead>
                    <TBody className="max-md:block">
                        {filtered.map((app) => (
                            <CandidateRow
                                key={app.applicationId}
                                application={app}
                                jobId={jobId}
                                selected={selectedIds.has(app.applicationId)}
                                onToggle={onToggle}
                                onPeek={setPeekId}
                            />
                        ))}
                        {filtered.length === 0 && (
                            <tr className="max-md:block">
                                <td colSpan={COLUMN_COUNT} className="px-6 py-12 text-center text-body-sm text-ink-3 max-md:block">
                                    Không tìm thấy ứng viên nào.
                                </td>
                            </tr>
                        )}
                    </TBody>
                </table>
            </Surface>

            {/* Sits after the table so it can stick to the bottom of the viewport; it rises in once a row is ticked. */}
            <Surface
                variant={selectedCount > 0 ? 'raised' : 'inset'}
                className={cn(
                    'flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3',
                    selectedCount > 0 && 'sticky bottom-4 z-sticky animate-rise',
                )}
            >
                <CompareBar jobId={jobId} selectedIds={Array.from(selectedIds)} />
                <BulkScreeningBar
                    actions="selected"
                    jobId={jobId}
                    selectedApplications={selectedApplications}
                    applications={applications}
                    aiProfiles={aiProfiles}
                />
                {selectedCount > 0 && (
                    <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>
                        Bỏ chọn
                    </Button>
                )}
            </Surface>

            <CandidatePeek application={peekApplication} jobId={jobId} onClose={() => setPeekId(null)} />
        </div>
    );
}
