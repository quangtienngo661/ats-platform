import { Send, Clock, CheckCircle } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { IApplicationCard, IApplicationDto } from '@/types/interfaces/application.interface';

interface MyApplicationsStatsProps {
    applications: IApplicationCard[];
}

const ACTIVE_STATUSES = new Set(['applied', 'screening', 'interview', 'offer']);
const CLOSED_STATUSES = new Set(['hired', 'rejected', 'cancelled']);

export function MyApplicationsStats({ applications }: MyApplicationsStatsProps) {
    const total = applications.length;
    const active = applications.filter((a) => ACTIVE_STATUSES.has(a.status)).length;
    const completed = applications.filter((a) => CLOSED_STATUSES.has(a.status)).length;

    const stats = [
        { icon: <Send className="w-5 h-5 text-[#6366F1]" />, bg: '#F5F3FF', value: total, label: 'Tổng đơn' },
        { icon: <Clock className="w-5 h-5 text-[#F59E0B]" />, bg: '#FFFBEB', value: active, label: 'Đang xử lý' },
        { icon: <CheckCircle className="w-5 h-5 text-[#34C759]" />, bg: '#E8F5E9', value: completed, label: 'Đã kết thúc' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[24px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>
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
