import { SF, SFT } from '@/types/fonts/fonts';
import { TrendingUp, Users, Briefcase, CalendarCheck, UserCheck } from 'lucide-react';

const ICONS = {
    Users, Briefcase, CalendarCheck, UserCheck,
} as const;

interface KpiItem {
    label: string;
    value: string;
    change: string;
    up: boolean | null;
    iconKey: keyof typeof ICONS;
    color: string;
    bg: string;
}

interface DashboardKpiCardsProps {
    totalApplications: number;
    openJobs: number;
    hiredThisMonth: number;
}

export default function DashboardKpiCards({ totalApplications, openJobs, hiredThisMonth }: DashboardKpiCardsProps) {
    const kpis: KpiItem[] = [
        {
            label: 'Tổng ứng viên',
            value: totalApplications.toLocaleString('vi-VN'),
            change: '',
            up: null,
            iconKey: 'Users',
            color: '#0071E3',
            bg: '#EBF3FD',
        },
        {
            label: 'Vị trí mở',
            value: openJobs.toString(),
            change: '',
            up: null,
            iconKey: 'Briefcase',
            color: '#6366F1',
            bg: '#F5F3FF',
        },
        {
            label: 'Đã tuyển tháng này',
            value: hiredThisMonth.toString(),
            change: '',
            up: null,
            iconKey: 'UserCheck',
            color: '#34C759',
            bg: '#F0FDF4',
        },
    ];

    return (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
            {kpis.map(({ label, value, up, change, iconKey, color, bg }) => {
                const Icon = ICONS[iconKey];
                return (
                    <div
                        key={label}
                        className="bg-white rounded-2xl p-4 border border-[#F2F2F7] hover:shadow-md hover:shadow-black/5 transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                                <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                            {up !== null && (
                                <div
                                    className="flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5"
                                    style={{
                                        background: up ? '#F0FDF4' : '#FEF2F2',
                                        color: up ? '#16A34A' : '#DC2626',
                                        fontFamily: SFT,
                                        fontWeight: 600,
                                    }}
                                >
                                    <TrendingUp className={`w-2.5 h-2.5 ${!up ? 'rotate-180' : ''}`} />
                                    {change}
                                </div>
                            )}
                        </div>
                        <p className="text-[26px] text-[#1D1D1F] tracking-[-0.03em] mb-0.5" style={{ fontFamily: SF, fontWeight: 700 }}>
                            {value}
                        </p>
                        <p className="text-[12px] text-[#6E6E73]">{label}</p>
                    </div>
                );
            })}
        </div>
    );
}
