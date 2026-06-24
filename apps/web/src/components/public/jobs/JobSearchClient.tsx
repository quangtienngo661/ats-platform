'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search, SlidersHorizontal, Briefcase, X, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { JobCard } from './JobCard';

const LOCATION_TYPES = ['Tất cả', 'remote', 'onsite', 'hybrid'];
const LOCATION_LABELS: Record<string, string> = { 'Tất cả': 'Tất cả', remote: 'Remote', onsite: 'Văn phòng', hybrid: 'Hybrid' };

interface JobSearchClientProps {
    initialJobs: IJobPostingDto[];
    total: number;
    categories: IJobCategoryDto[];
    currentPage: number;
    initialQuery: { q?: string; categoryId?: string; locationType?: string };
}

export function JobSearchClient({ initialJobs, total, categories, currentPage, initialQuery }: JobSearchClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState(initialQuery.q ?? '');
    const [selectedCategory, setSelectedCategory] = useState(initialQuery.categoryId ?? '');
    const [selectedLocationType, setSelectedLocationType] = useState(initialQuery.locationType ?? 'Tất cả');
    const [showFilters, setShowFilters] = useState(false);
    const [isPending, startTransition] = useTransition();

    const totalPages = Math.ceil(total / 12);

    const applyFilters = (overrides?: Partial<typeof initialQuery & { page?: number }>) => {
        const params = new URLSearchParams();
        const q = overrides?.q ?? searchQuery;
        const catId = overrides?.categoryId ?? selectedCategory;
        const loc = overrides?.locationType ?? selectedLocationType;
        const pg = overrides?.page ?? 1;
        if (q) params.set('q', q);
        if (catId) params.set('categoryId', catId);
        if (loc && loc !== 'Tất cả') params.set('locationType', loc);
        if (pg > 1) params.set('page', String(pg));
        startTransition(() => router.push(`/job-postings?${params.toString()}`));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedLocationType('Tất cả');
        startTransition(() => router.push('/job-postings'));
    };

    const hasActiveFilters = !!searchQuery || !!selectedCategory || selectedLocationType !== 'Tất cả';

    return (
        <div className="min-h-screen" style={{ fontFamily: SFT }}>
            {/* Search Header */}
            <div className="bg-white border-b border-[#E5E5EA] sticky top-[60px] z-30">
                <div className="max-w-[1200px] mx-auto px-6 py-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="flex items-center gap-2.5 bg-[#F5F5F7] rounded-2xl px-4 py-2.5 flex-1 border-2 border-transparent focus-within:border-[#0071E3] focus-within:bg-white transition-all">
                            <Search className="w-4 h-4 text-[#AEAEB2] flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Tên vị trí, kỹ năng, công ty..."
                                className="bg-transparent text-[14px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none flex-1"
                            />
                            {searchQuery && (
                                <button type="button" onClick={() => setSearchQuery('')} className="text-[#AEAEB2] hover:text-[#6E6E73]">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button type="submit" className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-2xl text-[14px] transition-all flex-shrink-0" style={{ fontWeight: 500 }}>
                            Tìm
                        </button>
                        <button
                            type="button"
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
                                className="overflow-hidden"
                            >
                                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                    {/* Category */}
                                    <div className="flex-1">
                                        <label className="text-[11px] uppercase tracking-[0.07em] text-[#AEAEB2] mb-2 block" style={{ fontWeight: 600 }}>
                                            Ngành nghề
                                        </label>
                                        <select
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
                                        <label className="text-[11px] uppercase tracking-[0.07em] text-[#AEAEB2] mb-2 block" style={{ fontWeight: 600 }}>
                                            Hình thức
                                        </label>
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
                        <button
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
                        <button
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
