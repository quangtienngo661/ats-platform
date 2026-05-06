import { Users, Star, TrendingUp } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IApplicationDto } from '@/types/interfaces/application.interface';

interface CandidatesStatsProps {
    applications: IApplicationDto[];
}

export function CandidatesStats({ applications }: CandidatesStatsProps) {
    const newCount = applications.filter(a => a.status === 'applied').length;
    const scores = applications
        .map(a => a.screening?.overallScore)
        .filter((s): s is number => s != null && s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highScoreCount = scores.filter(s => s >= 90).length;

    const stats = [
        { icon: Users, bg: '#E3F2FF', color: '#0071E3', value: applications.length, label: 'Tổng ứng viên' },
        { icon: Star, bg: '#E3F2FF', color: '#0071E3', value: newCount, label: 'Ứng viên mới' },
        { icon: TrendingUp, bg: '#FFF4E5', color: '#FF9500', value: avgScore, label: 'Điểm TB' },
        { icon: Star, bg: '#E8F5E9', color: '#34C759', value: highScoreCount, label: 'Điểm cao (≥90)' },
    ];

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            {stats.map(({ icon: Icon, bg, color, value, label }) => (
                <div key={label} className="bg-white rounded-2xl p-5 border border-[#F2F2F7] hover:shadow-md hover:shadow-black/5 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                            <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        <div>
                            <p className="text-[22px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>{value}</p>
                            <p className="text-[12px] text-[#6E6E73]" style={{ fontFamily: SFT }}>{label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
