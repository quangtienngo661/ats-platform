import { Building2, Users } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { Department } from '@/types/interfaces/departments.interface';

interface DepartmentStatsProps {
    departments: Department[];
}

export function DepartmentStats({ departments }: DepartmentStatsProps) {
    const totalMembers = departments.reduce((sum, d) => sum + d.membersCount, 0);
    const avgMembers = Math.round(totalMembers / departments.length);

    const stats = [
        {
            icon: <Building2 className="w-5 h-5 text-[#0071E3]" />,
            bg: '#E3F2FF',
            value: departments.length,
            label: 'Phòng ban',
        },
        {
            icon: <Users className="w-5 h-5 text-[#34C759]" />,
            bg: '#E8F5E9',
            value: totalMembers,
            label: 'Nhân viên',
        },
        {
            icon: <Users className="w-5 h-5 text-[#FF9500]" />,
            bg: '#FFF4E5',
            value: avgMembers,
            label: 'Trung Bình / Phòng ban',
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
