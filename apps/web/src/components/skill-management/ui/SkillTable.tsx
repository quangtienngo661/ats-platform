'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { SkillRow } from './SkillRow';
import { ISkillDto } from '@/types/interfaces/skill.interface';

interface SkillTableProps {
    skills: ISkillDto[];
    onEdit: (skill: ISkillDto) => void;
    onDelete: (skillId: string) => void;
}

const PAGE_SIZE = 20;

export function SkillTable({ skills, onEdit, onDelete }: SkillTableProps) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(skills.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = skills.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    if (skills.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-[#E5E5EA] py-16 flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F0F0FF] flex items-center justify-center">
                    <Zap className="w-7 h-7 text-[#6366F1]" />
                </div>
                <div className="text-center">
                    <p className="text-[15px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                        Không tìm thấy kỹ năng nào
                    </p>
                    <p className="text-[13px] text-[#6E6E73] mt-1" style={{ fontFamily: SFT }}>
                        Thử thay đổi bộ lọc hoặc thêm kỹ năng mới
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-[#F2F2F7] bg-[#FAFAFA]">
                        <th className="px-5 py-3 text-left text-[11px] text-[#AEAEB2] uppercase tracking-widest w-10" style={{ fontFamily: SF, fontWeight: 600 }}>#</th>
                        <th className="px-4 py-3 text-left text-[11px] text-[#AEAEB2] uppercase tracking-widest" style={{ fontFamily: SF, fontWeight: 600 }}>Tên kỹ năng</th>
                        <th className="px-4 py-3 text-left text-[11px] text-[#AEAEB2] uppercase tracking-widest" style={{ fontFamily: SF, fontWeight: 600 }}>Danh mục</th>
                        <th className="px-4 py-3 text-right text-[11px] text-[#AEAEB2] uppercase tracking-widest w-[160px]" style={{ fontFamily: SF, fontWeight: 600 }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {paginated.map((skill, idx) => (
                        <SkillRow
                            key={skill.skillId}
                            index={(safePage - 1) * PAGE_SIZE + idx}
                            skill={skill}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#F2F2F7]">
                    <p className="text-[12px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
                        {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, skills.length)} / {skills.length} kỹ năng
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={safePage === 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="p-1.5 rounded-lg text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                            .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${i}`} className="px-2 text-[12px] text-[#AEAEB2]">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p as number)}
                                        className={`w-7 h-7 rounded-lg text-[12px] transition-colors ${safePage === p ? 'bg-[#6366F1] text-white' : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'}`}
                                        style={{ fontFamily: SF, fontWeight: safePage === p ? 700 : 400 }}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                        <button
                            disabled={safePage === totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="p-1.5 rounded-lg text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
