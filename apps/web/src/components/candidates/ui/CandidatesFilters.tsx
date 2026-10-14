'use client';

import { useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { BulkScreeningBar } from './BulkScreeningBar';
import { CandidateRow } from './CandidateRow';

interface CandidatesFiltersProps {
    applications: IApplicationDto[];
    jobId: string;
    // Required again once the candidates page passes the AI profiles (Task 10).
    aiProfiles?: ConfigProfile[];
}

const statusFilters = [
    { key: 'all', label: 'Tất cả' },
    { key: 'applied', label: 'Mới' },
    { key: 'screening', label: 'Sàng lọc' },
    { key: 'interview', label: 'Phỏng vấn' },
    { key: 'offer', label: 'Offer' },
] as const;

export function CandidatesFilters({ applications, jobId, aiProfiles = [] }: CandidatesFiltersProps) {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

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

    const allVisibleSelected = filtered.length > 0 && filtered.every(a => selectedIds.has(a.applicationId));
    const selectedApplications = applications.filter(a => selectedIds.has(a.applicationId));

    function toggleSelection(applicationId: string) {
        setSelectedIds(previous => {
            const next = new Set(previous);
            if (next.has(applicationId)) next.delete(applicationId);
            else next.add(applicationId);
            return next;
        });
    }

    function toggleAllVisible() {
        if (filtered.length === 0) return;
        setSelectedIds(previous => {
            const next = new Set(previous);
            const clearVisible = filtered.every(a => previous.has(a.applicationId));
            filtered.forEach(a => {
                if (clearVisible) next.delete(a.applicationId);
                else next.add(a.applicationId);
            });
            return next;
        });
    }

    return (
        <div style={{ fontFamily: SFT }}>
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-[#F2F2F7] p-4 mb-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border border-[#E5E5EA] bg-[#F5F5F7] flex-1">
                        <input aria-label="Tìm ứng viên"
                            type="text"
                            placeholder="Tìm theo tên, vị trí..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent text-[13px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none w-full"
                        />
                    </div>
                    {/* Status filters */}
                    <div className="flex gap-2 flex-wrap">
                        {statusFilters.map(f => {
                            const count = f.key === 'all'
                                ? applications.length
                                : applications.filter(a => a.status === f.key).length;
                            return (
                                <button key={f.key} onClick={() => setSelectedFilter(f.key)}
                                    className={`px-3.5 py-1.5 rounded-xl transition-all text-[13px] flex items-center gap-2 ${selectedFilter === f.key ? 'bg-[#EBF3FD] text-[#0071E3]' : 'text-[#6E6E73] hover:bg-[#F5F5F7]'}`}
                                    style={{ fontWeight: selectedFilter === f.key ? 500 : 400 }}>
                                    {f.label}
                                    <span className={`text-[11px] px-1.5 rounded-full ${selectedFilter === f.key ? 'bg-[#0071E3] text-white' : 'bg-[#E5E5EA] text-[#1D1D1F]'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <BulkScreeningBar
                jobId={jobId}
                selectedApplications={selectedApplications}
                applications={applications}
                aiProfiles={aiProfiles}
            />

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#F2F2F7] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#F2F2F7]">
                                <th scope="col" className="px-6 py-4 text-left">
                                    <input
                                        type="checkbox"
                                        aria-label="Chọn tất cả"
                                        checked={allVisibleSelected}
                                        onChange={toggleAllVisible}
                                        className="w-4 h-4 accent-[#0071E3] cursor-pointer"
                                    />
                                </th>
                                {['Ứng viên', 'Vị trí ứng tuyển', 'Điểm AI', 'Trạng thái', 'Thời gian', ''].map((th, i) => (
                                    <th key={i} className={`${i === 5 ? 'text-right' : 'text-left'} px-6 py-4 text-[11px] uppercase tracking-[0.06em] text-[#AEAEB2]`} style={{ fontWeight: 600 }}>{th}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((app) => (
                                <CandidateRow key={app.applicationId} application={app} jobId={jobId}
                                    selected={selectedIds.has(app.applicationId)} onToggle={toggleSelection} />
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-[13px] text-[#AEAEB2]">
                                        Không tìm thấy ứng viên nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
