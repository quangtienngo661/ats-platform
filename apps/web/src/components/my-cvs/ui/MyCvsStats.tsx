import { Stat } from '@/components/ui';
import type { ICvDto } from '@/types/interfaces/cv.interface';

interface MyCvsStatsProps {
    cvs: ICvDto[];
}

export function MyCvsStats({ cvs }: MyCvsStatsProps) {
    const totalCvs = cvs.length;
    const parsedCount = cvs.filter((c) => c.parsingStatus === 'completed').length;
    const pendingCount = cvs.filter((c) => c.parsingStatus === 'pending' || c.parsingStatus === 'processing').length;

    return (
        <div role="group" aria-label="Tóm tắt CV" className="grid grid-cols-3 gap-4 rounded-card bg-surface p-4 shadow-e1">
            <Stat label="Tổng CV" value={totalCvs} />
            <Stat label="Đã phân tích" value={parsedCount} />
            <Stat label="Đang xử lý" value={pendingCount} />
        </div>
    );
}
