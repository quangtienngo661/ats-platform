'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Briefcase, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SF, SFT } from '@/types/fonts/fonts';
import { formatSalaryInput, parseSalaryInput } from '@/lib/salary-input';
import { WORK_TYPES, WORK_TYPE_LABELS } from '@/lib/work-types';
import { IJobFilterOptions, IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { JobCard } from './JobCard';

const LOCATION_TYPES = ['Tất cả', ...WORK_TYPES];
const LOCATION_LABELS: Record<string, string> = { 'Tất cả': 'Tất cả', ...WORK_TYPE_LABELS };
const MAX_SKILLS = 20;
const SALARY_RANGE_ERROR = 'Mức lương tối thiểu không thể lớn hơn mức lương tối đa';
const SALARY_INVALID_ERROR = 'Mức lương không hợp lệ';
const SALARY_INPUT_CLASS = 'w-full sm:w-[150px] px-3 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1D1D1F] outline-none focus:border-[#0071E3] bg-white';
const GROUP_LABEL_CLASS = 'text-[11px] uppercase tracking-[0.07em] text-[#AEAEB2] mb-2 block';

const salaryText = (value?: number) => (value !== undefined ? formatSalaryInput(value) : '');

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

export function JobSearchClient({ initialJobs, total, categories, skills, currentPage, initialQuery }: JobSearchClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState(initialQuery.q ?? '');
    const [selectedCategory, setSelectedCategory] = useState(initialQuery.categoryId ?? '');
    const [selectedLocationType, setSelectedLocationType] = useState(initialQuery.locationType ?? 'Tất cả');
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
        setSelectedLocationType(initialQuery.locationType ?? 'Tất cả');
        setSalaryMinText(salaryText(initialQuery.salaryMin));
        setSalaryMaxText(salaryText(initialQuery.salaryMax));
        setSelectedSkills(initialQuery.skillIds ?? []);
        setSalaryError('');
    }
    const [showFilters, setShowFilters] = useState(false);
    const [isPending, startTransition] = useTransition();

    const totalPages = Math.ceil(total / 12);

    const applyFilters = (overrides?: Partial<typeof initialQuery & { page?: number }>) => {
        const salaryMin = parseSalaryInput(salaryMinText);
        const salaryMax = parseSalaryInput(salaryMaxText);
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
        if (loc && loc !== 'Tất cả') params.set('locationType', loc);
        if (salaryMin !== null) params.set('salaryMin', String(salaryMin));
        if (salaryMax !== null) params.set('salaryMax', String(salaryMax));
        for (const skillId of overrides?.skillIds ?? selectedSkills) params.append('skillIds', skillId);
        if (pg > 1) params.set('page', String(pg));
        startTransition(() => router.push(`/job-postings?${params.toString()}`));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
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
        setSelectedLocationType('Tất cả');
        setSalaryMinText('');
        setSalaryMaxText('');
        setSelectedSkills([]);
        setSalaryError('');
        startTransition(() => router.push('/job-postings'));
    };

    // Only digits and the separators a salary is written with; the rest is refused as typed.
    const salaryField = (value: string, setValue: (text: string) => void, label: string, id: string) => (
        <>
            <label htmlFor={id} className="sr-only">{label}</label>
            <input
                id={id}
                type="text"
                inputMode="numeric"
                placeholder={label}
                value={value}
                onChange={e => { setValue(e.target.value.replace(/[^\d.,\s]/g, '')); setSalaryError(''); }}
                onBlur={() => { const parsed = parseSalaryInput(value); if (typeof parsed === 'number') setValue(formatSalaryInput(parsed)); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyFilters(); } }}
                className={SALARY_INPUT_CLASS}
            />
        </>
    );

    const hasActiveFilters = !!searchQuery || !!selectedCategory || selectedLocationType !== 'Tất cả'
        || salaryMinText.trim() !== '' || salaryMaxText.trim() !== '' || selectedSkills.length > 0;

    return (
        <div className="min-h-screen" style={{ fontFamily: SFT }}>
            {/* Search Header */}
            <div className="bg-white border-b border-[#E5E5EA] sticky top-[60px] z-30">
                <div className="max-w-[1200px] mx-auto px-6 py-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="flex items-center gap-2.5 bg-[#F5F5F7] rounded-2xl px-4 py-2.5 flex-1 min-w-0 border-2 border-transparent focus-within:border-[#0071E3] focus-within:bg-white transition-all">
                            <Search className="w-4 h-4 text-[#AEAEB2] flex-shrink-0" />
                            <input
                                aria-label="Tìm việc làm"
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Tên vị trí, kỹ năng, công ty..."
                                className="min-w-0 bg-transparent text-[14px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none flex-1"
                            />
                            {searchQuery && (
                                <button aria-label="Đóng" type="button" onClick={() => setSearchQuery('')} className="text-[#AEAEB2] hover:text-[#6E6E73]">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button type="submit" className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-2xl text-[14px] transition-all flex-shrink-0" style={{ fontWeight: 500 }}>
                            Tìm
                        </button>
                        <button
                            type="button"
                            aria-label="Bộ lọc"
                            aria-expanded={showFilters}
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-[13px] transition-all flex-shrink-0 ${showFilters || hasActiveFilters ? 'border-[#0071E3] text-[#0071E3] bg-[#EBF3FD]' : 'border-[#E5E5EA] text-[#6E6E73] hover:bg-[#F5F5F7]'}`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="hidden sm:inline">Lọc</span>
                            {hasActiveFilters && <span className="w-2 h-2 bg-[#0071E3] rounded-full" />}
                        </button>
                    </form>

                    {/* Filter Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-x-hidden overflow-y-auto max-h-[60vh]"
                            >
                                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                    {/* Category */}
                                    <div className="flex-1">
                                        <label htmlFor="jobsearchclient-field-1" className="text-[11px] uppercase tracking-[0.07em] text-[#AEAEB2] mb-2 block" style={{ fontWeight: 600 }}>
                                            Ngành nghề
                                        </label>
                                        <select id="jobsearchclient-field-1"
                                            value={selectedCategory}
                                            onChange={e => { setSelectedCategory(e.target.value); applyFilters({ categoryId: e.target.value }); }}
                                            className="w-full px-3 py-2 rounded-xl border border-[#E5E5EA] text-[13px] text-[#1D1D1F] outline-none focus:border-[#0071E3] bg-white"
                                        >
                                            <option value="">Tất cả ngành nghề</option>
                                            {categories.map(c => (
                                                <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Location Type */}
                                    <div>
                                        <span className="text-[11px] uppercase tracking-[0.07em] text-[#AEAEB2] mb-2 block" style={{ fontWeight: 600 }}>
                                            Hình thức
                                        </span>
                                        <div className="flex gap-2">
                                            {LOCATION_TYPES.map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => { setSelectedLocationType(t); applyFilters({ locationType: t }); }}
                                                    className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${selectedLocationType === t ? 'bg-[#0071E3] text-white' : 'bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#EBEBF0]'}`}
                                                >
                                                    {LOCATION_LABELS[t]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {hasActiveFilters && (
                                        <div className="flex items-end">
                                            <button onClick={clearFilters} className="text-[13px] text-[#FF3B30] hover:underline flex items-center gap-1">
                                                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 flex flex-col gap-4">
                                    {/* Salary */}
                                    <fieldset>
                                        <legend className={GROUP_LABEL_CLASS} style={{ fontWeight: 600 }}>Mức lương (VNĐ)</legend>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {salaryField(salaryMinText, setSalaryMinText, 'Từ', 'jobsearchclient-salary-min')}
                                            <span aria-hidden="true" className="text-[#AEAEB2]">–</span>
                                            {salaryField(salaryMaxText, setSalaryMaxText, 'Đến', 'jobsearchclient-salary-max')}
                                            <button type="button" onClick={() => applyFilters()} className="px-3 py-2 rounded-xl bg-[#F2F2F7] text-[13px] text-[#1D1D1F] hover:bg-[#EBEBF0] transition-all">
                                                Áp dụng
                                            </button>
                                        </div>
                                        {salaryError && <p role="alert" className="mt-2 text-[12px] text-[#FF3B30]">{salaryError}</p>}
                                    </fieldset>

                                    {/* Skills */}
                                    {skills.length > 0 && (
                                        <fieldset>
                                            <legend className={GROUP_LABEL_CLASS} style={{ fontWeight: 600 }}>Kỹ năng</legend>
                                            <div className="flex flex-wrap gap-2 max-h-[132px] overflow-y-auto">
                                                {skills.map(skill => {
                                                    const selected = selectedSkills.includes(skill.skillId);
                                                    return (
                                                        <button
                                                            key={skill.skillId}
                                                            type="button"
                                                            aria-pressed={selected}
                                                            disabled={!selected && selectedSkills.length >= MAX_SKILLS}
                                                            onClick={() => toggleSkill(skill.skillId)}
                                                            className={`px-3 py-1.5 rounded-lg text-[12px] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selected ? 'bg-[#0071E3] text-white' : 'bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#EBEBF0]'}`}
                                                        >
                                                            {skill.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </fieldset>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-[1200px] mx-auto px-6 py-6">
                {/* Count */}
                <div className="flex items-center justify-between mb-5">
                    <p className="text-[13px] text-[#6E6E73]">
                        <span className="text-[#1D1D1F]" style={{ fontWeight: 500 }}>{total}</span> vị trí phù hợp
                        {isPending && <span className="ml-2 text-[#AEAEB2] animate-pulse">Đang tải...</span>}
                    </p>
                </div>

                {/* Job Grid or Empty */}
                {initialJobs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#E5E5EA] py-20 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                            <Briefcase className="w-8 h-8 text-[#AEAEB2]" />
                        </div>
                        <div className="text-center">
                            <p className="text-[17px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>Không tìm thấy vị trí phù hợp</p>
                            <p className="text-[14px] text-[#6E6E73] mt-1">Thử thay đổi từ khóa hoặc bộ lọc</p>
                        </div>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="mt-2 px-5 py-2.5 bg-[#0071E3] text-white rounded-xl text-[13px]" style={{ fontWeight: 500 }}>
                                Xóa tất cả bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {initialJobs.map(job => (
                                <motion.div
                                    key={job.jobId}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <JobCard job={job} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                        <button type="button" aria-label="Trước"
                            disabled={currentPage <= 1}
                            onClick={() => applyFilters({ page: currentPage - 1 })}
                            className="p-2 rounded-xl hover:bg-[#F5F5F7] text-[#6E6E73] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === '...' ? (
                                    <span key={`e${i}`} className="text-[13px] text-[#AEAEB2] px-1">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => applyFilters({ page: p as number })}
                                        className={`w-9 h-9 rounded-xl text-[13px] transition-all ${currentPage === p ? 'bg-[#0071E3] text-white' : 'text-[#6E6E73] hover:bg-[#F5F5F7]'}`}
                                        style={{ fontWeight: currentPage === p ? 600 : 400 }}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                        <button type="button" aria-label="Tiếp"
                            disabled={currentPage >= totalPages}
                            onClick={() => applyFilters({ page: currentPage + 1 })}
                            className="p-2 rounded-xl hover:bg-[#F5F5F7] text-[#6E6E73] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
