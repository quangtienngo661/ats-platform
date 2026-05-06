import Link from 'next/link';
import { Briefcase, MapPin, Clock, Users, Edit3, Trash2, CheckCircle, XCircle, List, LayoutGrid } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';

const formatAmount = (value: number): string => {
    if (value >= 1_000_000_000) {
        const v = value / 1_000_000_000;
        return `${Number.isInteger(v) ? v : v.toFixed(1)} Tỷ`;
    }
    if (value >= 1_000_000) {
        const v = value / 1_000_000;
        return `${Number.isInteger(v) ? v : v.toFixed(1)} Triệu`;
    }
    if (value >= 1_000) {
        const v = value / 1_000;
        return `${Number.isInteger(v) ? v : v.toFixed(1)} Nghìn`;
    }
    return value.toLocaleString('vi-VN');
};

const salaryFormat = (min: number | null, max: number | null): string => {
    if (min === null && max === null) return 'Thỏa thuận';
    if (min === null) return `Đến ${formatAmount(max!)} VNĐ`;
    if (max === null) return `Từ ${formatAmount(min)} VNĐ`;
    if (min === max) return `${formatAmount(min)} VNĐ`;
    return `${formatAmount(min)} - ${formatAmount(max)} VNĐ`;
};


interface JobPostingCardProps {
    job: IJobPostingDto;
    onEdit: (job: IJobPostingDto) => void;
    onDelete: (job: IJobPostingDto) => void;
}

const locationLabel: Record<string, string> = {
    remote: 'Remote',
    onsite: 'Onsite',
    hybrid: 'Hybrid',
};

const statusConfig: Record<string, { label: string; bg: string; text: string; Icon: typeof CheckCircle }> = {
    active: { label: 'Đang tuyển', bg: '#F0FDF4', text: '#16A34A', Icon: CheckCircle },
    draft: { label: 'Bản nháp', bg: '#F5F5F7', text: '#6E6E73', Icon: Edit3 },
    closed: { label: 'Đã đóng', bg: '#FEF2F2', text: '#DC2626', Icon: XCircle },
};

function timeAgo(dateStr?: string | null): string {
    if (!dateStr) return 'Bản nháp';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hôm nay';
    if (days === 1) return '1 ngày trước';
    if (days < 7) return `${days} ngày trước`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 tuần trước' : `${weeks} tuần trước`;
}

type TApplication = {
    candidate?: {
        userId?: string;
    };
    cvId?: string;
    status?: string;
}

export function JobPostingCard({ job, onEdit, onDelete }: JobPostingCardProps) {
    const deptColor = job.department?.color || '#6E6E73';
    const deptBg = `${deptColor}15`;
    const status = statusConfig[job.status || 'draft'] || statusConfig.draft;
    const skills = job.jobPostingSkills?.map(jps => jps.skill.name) || [];
    const applicantCount = job.applications?.filter((a: TApplication) => a.status !== 'cancelled').length || 0;

    return (
        <div className="bg-white rounded-2xl border border-[#F2F2F7] hover:border-[#E5E5EA] hover:shadow-md hover:shadow-black/5 transition-all group cursor-pointer p-5">
            <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: deptBg }}>
                    <Briefcase className="w-5 h-5" style={{ color: deptColor }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                            <h3 className="text-[15px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>{job.title}</h3>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-[12px] rounded-full px-2.5 py-0.5" style={{ background: deptBg, color: deptColor, fontWeight: 500 }}>
                                    {job.department?.name || 'N/A'}
                                </span>
                                <div className="flex items-center gap-1 text-[#AEAEB2]">
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-[12px]">{locationLabel[job.locationType] || job.locationType}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[#AEAEB2]">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[12px]">{timeAgo(job.publishedAt || job.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-1" style={{ background: status.bg, color: status.text, fontWeight: 500 }}>
                                <status.Icon className="w-3 h-3" />
                                {status.label}
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {skills.map(t => (
                                <span key={t} className="text-[11px] bg-[#F5F5F7] text-[#6E6E73] rounded-lg px-2 py-0.5 border border-[#F2F2F7]">{t}</span>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#0071E3]" />
                            <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{applicantCount}</span>
                            <span className="text-[12px] text-[#AEAEB2]">ứng viên</span>
                        </div>

                        <div className="text-[12px] text-[#6E6E73] mt-[2px]">
                            {salaryFormat(job.salaryMin || null, job.salaryMax || null)}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <Link
                                href={`/jobs/${job.jobId}/candidates`}
                                className="flex items-center gap-1.5 text-[12px] text-[#0071E3] bg-[#EBF3FD] hover:bg-[#D6E9FA] px-3 py-1.5 rounded-lg transition-colors"
                                style={{ fontWeight: 500 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <List className="w-3 h-3" />
                                Ứng viên
                            </Link>
                            <Link
                                href={`/jobs/${job.jobId}/kanban`}
                                className="flex items-center gap-1.5 text-[12px] text-[#6366F1] bg-[#F5F3FF] hover:bg-[#EDE9FE] px-3 py-1.5 rounded-lg transition-colors"
                                style={{ fontWeight: 500 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <LayoutGrid className="w-3 h-3" />
                                Kanban
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => onEdit(job)} className="p-2 rounded-xl text-[#0071E3] hover:bg-[#EBF3FD] transition-colors">
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(job)} className="p-2 rounded-xl text-[#AEAEB2] hover:bg-[#FEF2F2] hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
