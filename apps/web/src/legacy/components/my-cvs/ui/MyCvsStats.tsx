import { FileText, CheckCircle, Clock } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import type { ICvDto } from '@/types/interfaces/cv.interface';

interface MyCvsStatsProps {
    cvs: ICvDto[];
}

export function MyCvsStats({ cvs }: MyCvsStatsProps) {
    const totalCvs = cvs.length;
    const parsedCount = cvs.filter((c) => c.parsingStatus === 'completed').length;
    const pendingCount = cvs.filter((c) => c.parsingStatus === 'pending' || c.parsingStatus === 'processing').length;

    const stats = [
        { icon: <FileText className="w-5 h-5 text-[#0071E3]" />, bg: '#EBF3FD', value: totalCvs, label: 'Tổng CV' },
        { icon: <CheckCircle className="w-5 h-5 text-[#34C759]" />, bg: '#E8F5E9', value: parsedCount, label: 'Đã phân tích' },
        { icon: <Clock className="w-5 h-5 text-[#F59E0B]" />, bg: '#FFFBEB', value: pendingCount, label: 'Đang xử lý' },
    ];

    return (
        <div className="grid grid-cols-3 gap-4 mb-6">
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
