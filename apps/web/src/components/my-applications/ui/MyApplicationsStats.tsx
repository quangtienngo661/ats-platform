import { Stat } from '@/components/ui';
import { IApplicationCard } from '@/types/interfaces/application.interface';
import { isInProgress } from '../timeline/next-step';

interface MyApplicationsStatsProps {
    applications: IApplicationCard[];
}

export function MyApplicationsStats({ applications }: MyApplicationsStatsProps) {
    const total = applications.length;
    const active = applications.filter((a) => isInProgress(a.status)).length;
    const finished = total - active;

    return (
        <div role="group" aria-label="Tóm tắt đơn ứng tuyển" className="grid grid-cols-3 gap-4 rounded-card bg-surface p-4 shadow-e1">
            <Stat label="Tổng đơn" value={total} />
            <Stat label="Đang xử lý" value={active} />
            <Stat label="Đã kết thúc" value={finished} />
        </div>
    );
}
