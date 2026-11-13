'use client';

import { useId, useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, FileText, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { Button, ButtonLink, EmptyState, IconButton, Input, Select, Stagger, Surface } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { formatSalaryInput, parseSalaryInput } from '@/lib/salary-input';
import { WORK_TYPES, WORK_TYPE_LABELS } from '@/lib/work-types';
import { IJobFilterOptions, IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { JobCard } from './JobCard';

const ALL = 'Tất cả';
const LOCATION_TYPES = [ALL, ...WORK_TYPES];
const LOCATION_LABELS: Record<string, string> = { [ALL]: 'Tất cả', ...WORK_TYPE_LABELS };
const PAGE_SIZE = 12;
const MAX_SKILLS = 20;
const SALARY_RANGE_ERROR = 'Mức lương tối thiểu không thể lớn hơn mức lương tối đa';
const SALARY_INVALID_ERROR = 'Mức lương không hợp lệ';

/** A filter pill (work type, skill, the panel toggle): 32 px, ink when on, a hairline card when off. */
const PILL =
    'inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-ctl px-3 text-body-sm ' +
    'transition duration-hover ease-out-expo active:scale-[.97] active:duration-press [&_svg]:size-4 [&_svg]:shrink-0';
const PILL_ON = 'bg-ink text-surface';
const PILL_OFF = 'bg-surface text-ink-2 shadow-e1 hover:text-ink hover:shadow-e3';

const salaryText = (value?: number) => (value !== undefined ? formatSalaryInput(value) : '');

function salaryLabel(min?: number, max?: number): string {
    if (min !== undefined && max !== undefined) return `${formatSalaryInput(min)} – ${formatSalaryInput(max)} ₫`;
    if (min !== undefined) return `Từ ${formatSalaryInput(min)} ₫`;
    return `Đến ${formatSalaryInput(max ?? 0)} ₫`;
}

/** A category's name, looked up in the tree the API sends (children included). */
function categoryName(categories: IJobCategoryDto[], id: string): string | undefined {
    for (const category of categories) {
        if (category.categoryId === id) return category.name;
        const child = category.childCategories ? categoryName(category.childCategories, id) : undefined;
        if (child) return child;
    }
    return undefined;
}

/** Page numbers around the current one, with `'…'` where a run is skipped: 1 … 4 5 6 … 10. */
function pageItems(totalPages: number, currentPage: number): (number | '…')[] {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce<(number | '…')[]>((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
            acc.push(p);
            return acc;
        }, []);
}

/** A filter the results on screen were made from: its group (for the summary), its chip text and how to drop it. */
type ActiveFilter = { key: string; group: string; value: string; chip: string; remove: () => void };

interface JobSearchClientProps {
    initialJobs: IJobPostingDto[];
    total: number;
    categories: IJobCategoryDto[];
    skills: IJobFilterOptions['skills'];
    currentPage: number;
    initialQuery: {
        q?: string;
        categoryId?: string;
        locationType?: string;
        salaryMin?: number;
        salaryMax?: number;
        skillIds?: string[];
    };
}

type Overrides = {
    q?: string;
    categoryId?: string;
    locationType?: string;
    skillIds?: string[];
    page?: number;
    salaryMinText?: string;
    salaryMaxText?: string;
};

/**
 * The public job search: a sticky search bar under the header, work-type pills and the category in one row (it
 * scrolls sideways on phones), a "Bộ lọc" panel for salary and skills, the active filters as removable chips, then
 * the list. From 1024 px a right rail (30%) sums up the filters and points to the CV page.
 */
export function JobSearchClient({ initialJobs, total, categories, skills, currentPage, initialQuery }: JobSearchClientProps) {
    const router = useRouter();
    const panelId = useId();
    const chipsLabelId = useId();
    const salaryErrorId = useId();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState(initialQuery.q ?? '');
    const [selectedCategory, setSelectedCategory] = useState(initialQuery.categoryId ?? '');
    const [selectedLocationType, setSelectedLocationType] = useState(initialQuery.locationType ?? ALL);
    const [salaryMinText, setSalaryMinText] = useState(salaryText(initialQuery.salaryMin));
    const [salaryMaxText, setSalaryMaxText] = useState(salaryText(initialQuery.salaryMax));
    const [selectedSkills, setSelectedSkills] = useState<string[]>(initialQuery.skillIds ?? []);
    const [salaryError, setSalaryError] = useState('');

    // Next keeps this component's state when only the search params change (Back, a link
    // to the same page), so the fields follow the URL they were last given: the URL is
    // what the results on screen were made from. The panel stays open.
    const queryKey = JSON.stringify(initialQuery);
    const [syncedQueryKey, setSyncedQueryKey] = useState(queryKey);
    if (syncedQueryKey !== queryKey) {
        setSyncedQueryKey(queryKey);
        setSearchQuery(initialQuery.q ?? '');
        setSelectedCategory(initialQuery.categoryId ?? '');
        setSelectedLocationType(initialQuery.locationType ?? ALL);
        setSalaryMinText(salaryText(initialQuery.salaryMin));
        setSalaryMaxText(salaryText(initialQuery.salaryMax));
        setSelectedSkills(initialQuery.skillIds ?? []);
        setSalaryError('');
    }
    const [showFilters, setShowFilters] = useState(false);
    const [isPending, startTransition] = useTransition();

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const hasJobs = initialJobs.length > 0;

    const applyFilters = (overrides?: Overrides) => {
        const salaryMin = parseSalaryInput(overrides?.salaryMinText ?? salaryMinText);
        const salaryMax = parseSalaryInput(overrides?.salaryMaxText ?? salaryMaxText);
        // The message lives in the panel: open it, or a refused entry would do nothing visible.
        if (salaryMin === 'invalid' || salaryMax === 'invalid') {
            setSalaryError(SALARY_INVALID_ERROR);
            setShowFilters(true);
            return;
        }
        if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
            setSalaryError(SALARY_RANGE_ERROR);
            setShowFilters(true);
            return;
        }
        setSalaryError('');

        const params = new URLSearchParams();
        const q = overrides?.q ?? searchQuery;
        const catId = overrides?.categoryId ?? selectedCategory;
        const loc = overrides?.locationType ?? selectedLocationType;
        const pg = overrides?.page ?? 1;
        if (q) params.set('q', q);
        if (catId) params.set('categoryId', catId);
        if (loc && loc !== ALL) params.set('locationType', loc);
        if (salaryMin !== null) params.set('salaryMin', String(salaryMin));
        if (salaryMax !== null) params.set('salaryMax', String(salaryMax));
        for (const skillId of overrides?.skillIds ?? selectedSkills) params.append('skillIds', skillId);
        if (pg > 1) params.set('page', String(pg));
        startTransition(() => router.push(`/job-postings?${params.toString()}`));
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const chooseLocationType = (type: string) => {
        setSelectedLocationType(type);
        applyFilters({ locationType: type });
    };

    const toggleSkill = (skillId: string) => {
        const next = selectedSkills.includes(skillId)
            ? selectedSkills.filter(id => id !== skillId)
            : [...selectedSkills, skillId];
        setSelectedSkills(next);
        applyFilters({ skillIds: next });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedLocationType(ALL);
        setSalaryMinText('');
        setSalaryMaxText('');
        setSelectedSkills([]);
        setSalaryError('');
        startTransition(() => router.push('/job-postings'));
    };

    const hasActiveFilters = !!searchQuery || !!selectedCategory || selectedLocationType !== ALL
        || salaryMinText.trim() !== '' || salaryMaxText.trim() !== '' || selectedSkills.length > 0;

    // The chips and the summary describe the URL (the results on screen), not what is half-typed in a field.
    const activeFilters: ActiveFilter[] = [];
    if (initialQuery.q) {
        activeFilters.push({
            key: 'q',
            group: 'Từ khóa',
            value: initialQuery.q,
            chip: `“${initialQuery.q}”`,
            remove: () => { setSearchQuery(''); applyFilters({ q: '' }); },
        });
    }
    if (initialQuery.categoryId) {
        const name = categoryName(categories, initialQuery.categoryId) ?? 'Ngành nghề đã chọn';
        activeFilters.push({
            key: 'category',
            group: 'Ngành nghề',
            value: name,
            chip: name,
            remove: () => { setSelectedCategory(''); applyFilters({ categoryId: '' }); },
        });
    }
    if (initialQuery.locationType && initialQuery.locationType !== ALL) {
        const label = LOCATION_LABELS[initialQuery.locationType] ?? initialQuery.locationType;
        activeFilters.push({
            key: 'locationType',
            group: 'Hình thức',
            value: label,
            chip: label,
            remove: () => chooseLocationType(ALL),
        });
    }
    if (initialQuery.salaryMin !== undefined || initialQuery.salaryMax !== undefined) {
        const label = salaryLabel(initialQuery.salaryMin, initialQuery.salaryMax);
        activeFilters.push({
            key: 'salary',
            group: 'Mức lương',
            value: label,
            chip: label,
            remove: () => {
                setSalaryMinText('');
                setSalaryMaxText('');
                applyFilters({ salaryMinText: '', salaryMaxText: '' });
            },
        });
    }
    for (const skillId of initialQuery.skillIds ?? []) {
        const name = skills.find(s => s.skillId === skillId)?.name ?? 'Kỹ năng đã chọn';
        activeFilters.push({
            key: `skill-${skillId}`,
            group: 'Kỹ năng',
            value: name,
            chip: name,
            remove: () => {
                const next = selectedSkills.filter(id => id !== skillId);
                setSelectedSkills(next);
                applyFilters({ skillIds: next });
            },
        });
    }
    const summary = activeFilters.reduce<{ group: string; values: string[] }[]>((acc, f) => {
        const row = acc.find(r => r.group === f.group);
        if (row) row.values.push(f.value);
        else acc.push({ group: f.group, values: [f.value] });
        return acc;
    }, []);
    // What the panel holds: the salary counts once, each skill once.
    const panelCount =
        (initialQuery.salaryMin !== undefined || initialQuery.salaryMax !== undefined ? 1 : 0)
        + (initialQuery.skillIds?.length ?? 0);
    // One "Xóa bộ lọc" on screen: beside the chips while there are results, in the empty state otherwise.
    const clearBesideChips = hasActiveFilters && hasJobs;

    // Only digits and the separators a salary is written with; the rest is refused as typed.
    const salaryField = (value: string, setValue: (text: string) => void, label: string, id: string) => (
        <>
            <label htmlFor={id} className="sr-only">{label}</label>
            <Input
                id={id}
                type="text"
                inputMode="numeric"
                placeholder={label}
                value={value}
                invalid={!!salaryError}
                describedBy={salaryError ? salaryErrorId : undefined}
                onChange={e => { setValue(e.target.value.replace(/[^\d.,\s]/g, '')); setSalaryError(''); }}
                onBlur={() => { const parsed = parseSalaryInput(value); if (typeof parsed === 'number') setValue(formatSalaryInput(parsed)); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyFilters(); } }}
                className="tabular-nums sm:w-40"
            />
        </>
    );

    const emptyState = hasActiveFilters ? (
        <EmptyState
            icon={SearchX}
            title="Không có việc phù hợp"
            description="Bỏ bớt bộ lọc hoặc đổi từ khóa để xem thêm việc."
            action={<Button onClick={clearFilters}>Xóa bộ lọc</Button>}
        />
    ) : currentPage > 1 ? (
        <EmptyState
            icon={SearchX}
            title="Không có việc phù hợp"
            description="Trang này không còn việc nào."
            action={<ButtonLink href="/job-postings">Xem tất cả việc làm</ButtonLink>}
        />
    ) : (
        <EmptyState
            icon={SearchX}
            title="Chưa có việc đang tuyển"
            description="Tin mới sẽ hiện ở đây. Trong lúc chờ, tải CV lên để ứng tuyển nhanh hơn."
            action={<ButtonLink href="/my-cvs">Tải CV lên</ButtonLink>}
        />
    );

    return (
        <div className="w-full">
            {/* Search bar: sticky under the 60 px header, below its layer so the notification panel stays on top. */}
            <div className="sticky top-[60px] z-sticky border-b border-line bg-canvas/95 supports-[backdrop-filter]:bg-canvas/75 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150">
                <div className="mx-auto max-w-[1200px] px-4 py-2 sm:py-3 lg:px-6">
                    <form role="search" aria-label="Tìm việc" onSubmit={handleSearch}>
                        <Surface variant="raised" className="flex items-center gap-1 p-1">
                            <div className="relative min-w-0 flex-1">
                                <Search
                                    aria-hidden="true"
                                    size={18}
                                    strokeWidth={1.75}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                                />
                                <input
                                    ref={searchInputRef}
                                    aria-label="Tìm việc làm"
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Tên vị trí, kỹ năng, công ty…"
                                    className="h-11 w-full min-w-0 rounded-ctl bg-transparent pl-10 pr-10 text-base text-ink placeholder:text-ink-3 focus-visible:outline-offset-0 sm:text-body"
                                />
                                {searchQuery ? (
                                    <IconButton
                                        size="sm"
                                        aria-label="Xóa từ khóa"
                                        onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2"
                                    >
                                        <X aria-hidden="true" strokeWidth={1.75} />
                                    </IconButton>
                                ) : null}
                            </div>
                            <Button type="submit" size="lg">
                                Tìm
                            </Button>
                        </Surface>
                    </form>
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 pb-16 pt-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:px-6 lg:pt-8">
                {/*
                  The html scroll padding clears the 60 px header only; whatever takes focus here must also clear the
                  sticky search bar (69–77 px), or Shift+Tab leaves the focused card underneath it.
                */}
                <div className="min-w-0 [&_a]:scroll-mt-20 [&_button]:scroll-mt-20 [&_input]:scroll-mt-20 [&_select]:scroll-mt-20">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h1 className="text-heading text-ink">Việc làm</h1>
                        <p aria-live="polite" className="text-body-sm text-ink-3">
                            <span className="font-medium tabular-nums text-ink">{total.toLocaleString('vi-VN')}</span> việc phù hợp
                            {isPending ? <span> · Đang tải…</span> : null}
                        </p>
                    </div>

                    {/* Filter pills: one row that scrolls sideways on phones, wraps from 640 px. */}
                    <div className="-mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
                        <button
                            type="button"
                            aria-label="Bộ lọc"
                            aria-expanded={showFilters}
                            aria-controls={showFilters ? panelId : undefined}
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(PILL, showFilters ? PILL_ON : PILL_OFF)}
                        >
                            <SlidersHorizontal aria-hidden="true" strokeWidth={1.75} />
                            Bộ lọc
                            {panelCount > 0 ? (
                                <span
                                    className={cn(
                                        'inline-flex h-4 min-w-4 items-center justify-center rounded-ctl px-1 text-micro tabular-nums',
                                        showFilters ? 'bg-surface text-ink' : 'bg-ink text-surface',
                                    )}
                                >
                                    {panelCount}
                                </span>
                            ) : null}
                        </button>
                        <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-line" />
                        <div role="group" aria-label="Hình thức làm việc" className="flex shrink-0 items-center gap-2">
                            {LOCATION_TYPES.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    aria-pressed={selectedLocationType === t}
                                    onClick={() => chooseLocationType(t)}
                                    className={cn(PILL, selectedLocationType === t ? PILL_ON : PILL_OFF)}
                                >
                                    {LOCATION_LABELS[t]}
                                </button>
                            ))}
                        </div>
                        {categories.length > 0 ? (
                            <Select
                                size="sm"
                                aria-label="Ngành nghề"
                                value={selectedCategory}
                                onChange={e => { setSelectedCategory(e.target.value); applyFilters({ categoryId: e.target.value }); }}
                                className="w-48 shrink-0"
                            >
                                <option value="">Tất cả ngành nghề</option>
                                {categories.map(c => (
                                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                                ))}
                            </Select>
                        ) : null}
                    </div>

                    {/* More filters: salary and skills. Enters with a rise; closes at once. */}
                    {showFilters ? (
                        <div id={panelId} className="mt-3 flex animate-rise flex-col gap-5 rounded-card bg-surface p-4 shadow-e1 sm:p-5">
                            <fieldset className="min-w-0">
                                <legend className="mb-2 text-caption text-ink-3">Mức lương (VNĐ)</legend>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
                                        {salaryField(salaryMinText, setSalaryMinText, 'Từ', 'jobsearchclient-salary-min')}
                                        <span aria-hidden="true" className="text-ink-3">–</span>
                                        {salaryField(salaryMaxText, setSalaryMaxText, 'Đến', 'jobsearchclient-salary-max')}
                                    </div>
                                    <Button variant="secondary" onClick={() => applyFilters()}>
                                        Áp dụng
                                    </Button>
                                </div>
                                {salaryError ? (
                                    <p id={salaryErrorId} role="alert" className="mt-2 text-caption text-danger">{salaryError}</p>
                                ) : null}
                            </fieldset>

                            {skills.length > 0 ? (
                                <fieldset className="min-w-0">
                                    <legend className="mb-2 text-caption text-ink-3">Kỹ năng</legend>
                                    <div className="-m-1 flex max-h-[140px] flex-wrap gap-2 overflow-y-auto p-1">
                                        {skills.map(skill => {
                                            const selected = selectedSkills.includes(skill.skillId);
                                            return (
                                                <button
                                                    key={skill.skillId}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    disabled={!selected && selectedSkills.length >= MAX_SKILLS}
                                                    onClick={() => toggleSkill(skill.skillId)}
                                                    className={cn(
                                                        PILL,
                                                        'max-w-full disabled:pointer-events-none disabled:bg-surface-2 disabled:text-ink-4 disabled:shadow-none',
                                                        selected ? PILL_ON : PILL_OFF,
                                                    )}
                                                >
                                                    <span className="min-w-0 truncate">{skill.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            ) : null}
                        </div>
                    ) : null}

                    {activeFilters.length > 0 || clearBesideChips ? (
                        <div role="group" aria-labelledby={chipsLabelId} className="mt-4 flex flex-wrap items-center gap-2">
                            <span id={chipsLabelId} className="mr-1 text-caption text-ink-3">Đang lọc</span>
                            {activeFilters.map(f => (
                                <button
                                    key={f.key}
                                    type="button"
                                    aria-label={`Bỏ lọc ${f.chip}`}
                                    title={f.chip}
                                    onClick={f.remove}
                                    className="group inline-flex h-8 min-w-0 max-w-[16rem] select-none items-center gap-1 rounded-ctl bg-surface pl-2.5 pr-1.5 text-body-sm text-ink shadow-e1 transition duration-hover ease-out-expo hover:shadow-e3 active:scale-[.97] active:duration-press"
                                >
                                    <span className="min-w-0 truncate">{f.chip}</span>
                                    <X
                                        aria-hidden="true"
                                        size={14}
                                        strokeWidth={1.75}
                                        className="shrink-0 text-ink-3 transition-colors duration-hover group-hover:text-ink"
                                    />
                                </button>
                            ))}
                            {clearBesideChips ? (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Xóa bộ lọc
                                </Button>
                            ) : null}
                        </div>
                    ) : null}

                    <div
                        aria-busy={isPending || undefined}
                        className={cn('mt-5 transition-opacity duration-hover', isPending && 'opacity-60')}
                    >
                        {hasJobs ? (
                            <Stagger as="ul" className="flex flex-col gap-3">
                                {initialJobs.map(job => (
                                    <li key={job.jobId}>
                                        <JobCard job={job} />
                                    </li>
                                ))}
                            </Stagger>
                        ) : (
                            <Surface>{emptyState}</Surface>
                        )}
                    </div>

                    {totalPages > 1 ? (
                        <nav aria-label="Phân trang" className="mt-8 flex flex-wrap items-center justify-center gap-1">
                            <IconButton
                                aria-label="Trước"
                                disabled={currentPage <= 1}
                                onClick={() => applyFilters({ page: currentPage - 1 })}
                            >
                                <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
                            </IconButton>
                            {pageItems(totalPages, currentPage).map((p, i) =>
                                p === '…' ? (
                                    <span key={`gap-${i}`} aria-hidden="true" className="w-6 text-center text-body-sm text-ink-3">…</span>
                                ) : (
                                    <Button
                                        key={p}
                                        variant={currentPage === p ? 'primary' : 'ghost'}
                                        aria-current={currentPage === p ? 'page' : undefined}
                                        onClick={() => applyFilters({ page: p })}
                                        className="min-w-9 tabular-nums"
                                    >
                                        {p}
                                    </Button>
                                ),
                            )}
                            <IconButton
                                aria-label="Tiếp"
                                disabled={currentPage >= totalPages}
                                onClick={() => applyFilters({ page: currentPage + 1 })}
                            >
                                <ChevronRight aria-hidden="true" strokeWidth={1.75} />
                            </IconButton>
                        </nav>
                    ) : null}
                </div>

                {/* Right rail from 1024 px: a summary of the filters and the way to a CV. */}
                <aside aria-label="Tóm tắt tìm kiếm" className="hidden lg:block">
                    <div className="sticky top-[9.5rem] flex flex-col gap-4">
                        <Surface className="p-5">
                            <h2 className="text-title-sm text-ink">Bộ lọc đang dùng</h2>
                            {summary.length === 0 ? (
                                <p className="mt-1 text-body-sm text-ink-3">Chưa dùng bộ lọc nào.</p>
                            ) : (
                                <dl className="mt-3 flex flex-col gap-3">
                                    {summary.map(row => (
                                        <div key={row.group} className="min-w-0">
                                            <dt className="text-caption text-ink-3">{row.group}</dt>
                                            <dd className="mt-0.5 break-words text-body-sm text-ink">{row.values.join(', ')}</dd>
                                        </div>
                                    ))}
                                </dl>
                            )}
                        </Surface>
                        <Surface variant="inset" className="p-5">
                            <span className="flex size-9 items-center justify-center rounded-ctl bg-surface text-ink-2 shadow-e1">
                                <FileText aria-hidden="true" size={18} strokeWidth={1.75} />
                            </span>
                            <h2 className="mt-4 text-title-sm text-ink">Chưa có CV?</h2>
                            <p className="mt-1 text-body-sm text-ink-3">Tải CV để ứng tuyển nhanh hơn.</p>
                            <ButtonLink href="/my-cvs" variant="secondary" size="sm" className="mt-4">
                                Tải CV lên
                            </ButtonLink>
                        </Surface>
                    </div>
                </aside>
            </div>
        </div>
    );
}
