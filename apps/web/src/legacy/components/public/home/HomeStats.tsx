import { Briefcase, Users, Building2, Sparkles } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

const stats = [
    { icon: Briefcase,  value: '500+',  label: 'Vị trí đang tuyển',   color: '#0071E3', bg: '#EBF3FD' },
    { icon: Users,      value: '10K+',  label: 'Ứng viên đã tìm được việc', color: '#34C759', bg: '#E8F5E9' },
    { icon: Building2,  value: '200+',  label: 'Công ty đối tác',      color: '#FF9500', bg: '#FFF4E5' },
    { icon: Sparkles,   value: '95%',   label: 'Tỷ lệ hài lòng',       color: '#6366F1', bg: '#EEF2FF' },
];

export function HomeStats() {
    return (
        <section className="bg-white py-12 border-b border-[#E5E5EA]">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(({ icon: Icon, value, label, color, bg }) => (
                        <div key={label} className="flex items-center gap-3 p-4 rounded-2xl border border-[#F2F2F7]">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                                <Icon className="w-5 h-5" style={{ color }} />
                            </div>
                            <div>
                                <p className="text-[22px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>{value}</p>
                                <p className="text-[12px] text-[#6E6E73]" style={{ fontFamily: SFT }}>{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
