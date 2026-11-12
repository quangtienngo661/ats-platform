import { FolderTree, Layers, Briefcase } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';

interface JobCategoryStatsProps {
    categories: IJobCategoryDto[];
}

export function JobCategoryStats({ categories }: JobCategoryStatsProps) {
    const totalChildren = categories.reduce(
        (sum, c) => sum + (c.childCategories?.length || 0),
        0
    );
    const totalJobPostings = categories.reduce(
        (sum, c) => sum + (c.jobPostings?.length || 0),
        0
    );

    const stats = [
        {
            icon: <FolderTree className="w-5 h-5 text-[#6366F1]" />,
            bg: '#F5F3FF',
            value: categories.length,
            label: 'Danh mục gốc',
        },
        {
            icon: <Layers className="w-5 h-5 text-[#0EA5E9]" />,
            bg: '#F0F9FF',
            value: totalChildren,
            label: 'Danh mục con',
        },
        {
            icon: <Briefcase className="w-5 h-5 text-[#34C759]" />,
            bg: '#E8F5E9',
            value: totalJobPostings,
            label: 'Tin tuyển dụng',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
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