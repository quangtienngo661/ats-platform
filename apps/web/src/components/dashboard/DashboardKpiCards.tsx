import { Briefcase, UserCheck, Users } from 'lucide-react';
import { Stagger, Stat, Surface } from '@/components/ui';

interface DashboardKpiCardsProps {
    totalApplications: number;
    openJobs: number;
    hiredThisMonth: number;
}

export default function DashboardKpiCards({ totalApplications, openJobs, hiredThisMonth }: DashboardKpiCardsProps) {
    const kpis = [
        { label: 'Tổng ứng viên', value: totalApplications, Icon: Users },
        { label: 'Vị trí mở', value: openJobs, Icon: Briefcase },
        { label: 'Đã tuyển tháng này', value: hiredThisMonth, Icon: UserCheck },
    ];

    return (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map(({ label, value, Icon }) => (
                <Surface key={label} className="flex items-start justify-between gap-3 p-5">
                    <Stat label={label} value={value} />
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" />
                </Surface>
            ))}
        </Stagger>
    );
}
