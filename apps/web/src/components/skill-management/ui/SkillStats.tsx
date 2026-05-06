import { Zap, Tag, HelpCircle } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { ISkillDto } from '@/types/interfaces/skill.interface';

interface SkillStatsProps {
    skills: ISkillDto[];
}

export function SkillStats({ skills }: SkillStatsProps) {
    const uniqueCategories = new Set(skills.map((s) => s.category).filter(Boolean)).size;
    const uncategorized = skills.filter((s) => !s.category).length;

    const stats = [
        {
            icon: <Zap className="w-5 h-5 text-[#6366F1]" />,
            bg: '#F0F0FF',
            value: skills.length,
            label: 'Tổng kỹ năng',
        },
        {
            icon: <Tag className="w-5 h-5 text-[#0071E3]" />,
            bg: '#E3F2FF',
            value: uniqueCategories,
            label: 'Danh mục',
        },
        {
            icon: <HelpCircle className="w-5 h-5 text-[#AEAEB2]" />,
            bg: '#F5F5F7',
            value: uncategorized,
            label: 'Chưa phân loại',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: stat.bg }}
                        >
                            {stat.icon}
                        </div>
                        <div>
                            <p
                                className="text-[24px] text-[#1D1D1F] tracking-[-0.01em]"
                                style={{ fontFamily: SF, fontWeight: 700 }}
                            >
                                {stat.value}
                            </p>
                            <p className="text-[12px] text-[#6E6E73]">{stat.label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
