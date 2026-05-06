'use client';

import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { SF, SFT } from '@/types/fonts/fonts';
import { ISkillDto } from '@/types/interfaces/skill.interface';

// Deterministic pastel color from category string
function categoryColor(cat: string): { bg: string; text: string } {
    const palette = [
        { bg: '#E3F2FF', text: '#0071E3' },
        { bg: '#E8F5E9', text: '#34C759' },
        { bg: '#FFF4E5', text: '#FF9500' },
        { bg: '#F5F0FF', text: '#6366F1' },
        { bg: '#FFE8F5', text: '#AF52DE' },
        { bg: '#FFE5E5', text: '#FF3B30' },
        { bg: '#E0F7FA', text: '#00BCD4' },
        { bg: '#FFF9C4', text: '#F59E0B' },
    ];
    let hash = 0;
    for (let i = 0; i < cat.length; i++) hash = (hash * 31 + cat.charCodeAt(i)) & 0xffffffff;
    return palette[Math.abs(hash) % palette.length];
}

interface SkillRowProps {
    index: number;
    skill: ISkillDto;
    onEdit: (skill: ISkillDto) => void;
    onDelete: (skillId: string) => void;
}

export function SkillRow({ index, skill, onEdit, onDelete }: SkillRowProps) {
    const [confirming, setConfirming] = useState(false);

    const catStyle = skill.category ? categoryColor(skill.category) : null;

    return (
        <tr className="group border-b border-[#F2F2F7] hover:bg-[#FAFAFA] transition-colors">
            {/* STT */}
            <td className="px-5 py-3 text-[12px] text-[#AEAEB2] w-10" style={{ fontFamily: SFT }}>
                {index + 1}
            </td>

            {/* Tên */}
            <td className="px-4 py-3">
                <span className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                    {skill.name}
                </span>
            </td>

            {/* Danh mục */}
            <td className="px-4 py-3">
                {catStyle ? (
                    <span
                        className="text-[11px] px-2.5 py-1 rounded-full"
                        style={{ background: catStyle.bg, color: catStyle.text, fontFamily: SF, fontWeight: 600 }}
                    >
                        {skill.category}
                    </span>
                ) : (
                    <span className="text-[12px] text-[#D1D1D6]" style={{ fontFamily: SFT }}>
                        —
                    </span>
                )}
            </td>

            {/* Actions */}
            <td className="px-4 py-3 text-right w-[160px]">
                {confirming ? (
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] text-[#FF3B30] flex items-center gap-1" style={{ fontFamily: SFT }}>
                            <AlertTriangle className="w-3 h-3" /> Xác nhận xóa?
                        </span>
                        <button
                            onClick={() => { onDelete(skill.skillId); setConfirming(false); }}
                            className="text-[11px] text-white bg-[#FF3B30] hover:bg-[#E0352B] px-2.5 py-1 rounded-lg transition-colors"
                            style={{ fontFamily: SF, fontWeight: 600 }}
                        >
                            Xóa
                        </button>
                        <button
                            onClick={() => setConfirming(false)}
                            className="text-[11px] text-[#6E6E73] hover:bg-[#F5F5F7] px-2.5 py-1 rounded-lg transition-colors"
                            style={{ fontFamily: SF }}
                        >
                            Hủy
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(skill)}
                            className="p-1.5 rounded-lg text-[#0071E3] hover:bg-[#EBF3FD] transition-colors"
                            title="Chỉnh sửa"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setConfirming(true)}
                            className="p-1.5 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors"
                            title="Xóa"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}
