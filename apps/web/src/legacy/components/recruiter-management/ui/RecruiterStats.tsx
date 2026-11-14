import { Users, CheckCircle, Briefcase, Building2 } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';

interface RecruiterStatsProps {
    recruiters: IRecruiterDto[];
}

export function RecruiterStats({ recruiters }: RecruiterStatsProps) {
    const totalRecruiters = recruiters.length;
    const activeRecruiters = recruiters.filter((r) => r.user?.status === 'active').length;
    const uniqueDepartments = new Set(recruiters.map((r) => r.department?.departmentId).filter(Boolean)).size;
    const withPosition = recruiters.filter((r) => !!r.position).length;

    const stats = [
        {
            icon: <Users className="w-5 h-5 text-[#0071E3]" />,
            bg: '#E3F2FF',
            value: totalRecruiters,
            label: 'Tổng số',
        },
        {
            icon: <CheckCircle className="w-5 h-5 text-[#34C759]" />,
            bg: '#E8F5E9',
            value: activeRecruiters,
            label: 'Đang hoạt động',
        },
        {
            icon: <Building2 className="w-5 h-5 text-[#FF9500]" />,
            bg: '#FFF4E5',
            value: uniqueDepartments,
            label: 'Phòng ban',
        },
        {
            icon: <Briefcase className="w-5 h-5 text-[#6366F1]" />,
            bg: '#F5F0FF',
            value: withPosition,
            label: 'Có chức vụ',
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
