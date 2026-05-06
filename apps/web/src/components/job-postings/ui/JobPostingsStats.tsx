import { Briefcase, CheckCircle, Edit3, XCircle } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';

interface JobPostingsStatsProps {
    jobs: IJobPostingDto[];
}

export function JobPostingsStats({ jobs }: JobPostingsStatsProps) {
    const active = jobs.filter(j => j.status === 'active').length;
    const draft = jobs.filter(j => j.status === 'draft').length;
    const closed = jobs.filter(j => j.status === 'closed').length;
    const totalApplicants = jobs.reduce((sum, j) => sum + (j.applications?.length || 0), 0);

    const stats = [
        { icon: Briefcase, label: 'Tổng tin', value: jobs.length, color: '#0071E3', bg: '#EBF3FD' },
        { icon: CheckCircle, label: 'Đang tuyển', value: active, color: '#16A34A', bg: '#F0FDF4' },
        { icon: Edit3, label: 'Bản nháp', value: draft, color: '#F59E0B', bg: '#FFFBEB' },
        { icon: XCircle, label: 'Đã đóng', value: closed, color: '#EF4444', bg: '#FEF2F2' },
    ];

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            {stats.map(({ icon: Icon, label, value, color, bg }) => (
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
