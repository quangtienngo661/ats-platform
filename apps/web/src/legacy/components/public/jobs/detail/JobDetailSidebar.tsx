import { DollarSign, Briefcase, Building2 } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { jobSkillsOf } from '@/lib/job-skills';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/work-types';

function formatSalary(min?: number | null, max?: number | null): string {
    if (!min && !max) return 'Thỏa thuận';
    const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : `${(n / 1_000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} VNĐ`;
    if (min) return `Từ ${fmt(min)} VNĐ`;
    return `Đến ${fmt(max ?? 0)} VNĐ`;
}

interface JobDetailSidebarProps {
    job: IJobPostingDto;
}

export function JobDetailSidebar({ job }: JobDetailSidebarProps) {
    const dept = job.department;
    const category = job.category;
    const skills = jobSkillsOf(job);
    const location = Object.hasOwn(WORK_TYPE_LABELS, job.locationType)
        ? WORK_TYPE_LABELS[job.locationType as WorkType]
        : job.locationType ?? '';

    const infoItems = [
        { label: 'Mức lương', value: formatSalary(job.salaryMin, job.salaryMax), icon: DollarSign },
        { label: 'Hình thức', value: location, icon: Briefcase },
        ...(category ? [{ label: 'Lĩnh vực', value: category.name, icon: Building2 }] : []),
    ];

    return (
        <div className="space-y-4">
            {/* Job Info */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6 top-[130px]">
                <h3 className="text-[15px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>
                    Thông tin chung
                </h3>
                <div className="space-y-4">
                    {infoItems.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-[#AEAEB2]" />
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.06em] text-[#AEAEB2]" style={{ fontWeight: 600 }}>{label}</p>
                                <p className="text-[14px] text-[#1D1D1F] mt-0.5" style={{ fontFamily: SFT, fontWeight: 500 }}>{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-[#F2F2F7]">
                        <p className="text-[11px] uppercase tracking-[0.06em] text-[#AEAEB2] mb-3" style={{ fontWeight: 600 }}>
                            Kỹ năng yêu cầu
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {skills.map(s => (
                                <span key={s.skillId} className="text-[12px] bg-[#EBF3FD] text-[#0071E3] rounded-lg px-2.5 py-1" style={{ fontWeight: 500 }}>
                                    {s.name ?? s.skillId}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Department info */}
            {dept && (
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center text-white text-[13px]" style={{ fontFamily: SF, fontWeight: 700 }}>
                            {dept.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>{dept.name}</p>
                            <p className="text-[12px] text-[#6E6E73]">Phòng ban</p>
                        </div>
                    </div>
                    {dept.description && (
                        <p className="text-[13px] text-[#6E6E73] leading-[1.6]" style={{ fontFamily: SFT }}>
                            {dept.description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
