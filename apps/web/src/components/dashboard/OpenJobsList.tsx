import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';

interface OpenJobsListProps {
    jobs: IJobPostingDto[];
}

const LOCATION_LABELS: Record<string, string> = {
    onsite: 'Văn phòng',
    remote: 'Từ xa',
    hybrid: 'Hybrid',
};

export default function OpenJobsList({ jobs }: OpenJobsListProps) {
    const displayed = jobs.slice(0, 5);

    return (
        <div className="mt-4 bg-white rounded-2xl border border-[#F2F2F7] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
                <h3 className="text-[14px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                    Vị trí đang tuyển
                </h3>
                <Link href="/jobs" className="text-[12px] text-[#0071E3] hover:underline" style={{ fontWeight: 500 }}>
                    Xem tất cả →
                </Link>
            </div>

            {displayed.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-[13px] text-[#AEAEB2]">Không có vị trí nào đang tuyển</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#F2F2F7]">
                    {displayed.map(job => {
                        const appCount = job.applications?.length ?? 0;
                        const location = LOCATION_LABELS[job.locationType ?? ''] ?? job.locationType ?? 'N/A';
                        return (
                            <Link
                                key={job.jobId}
                                href={`/jobs/${job.jobId}`}
                                className="flex items-center gap-3 px-5 py-4 hover:bg-[#F5F5F7] transition-colors group"
                            >
                                <div className="w-9 h-9 rounded-xl bg-[#EBF3FD] flex items-center justify-center flex-shrink-0">
                                    <span className="text-[13px] text-[#0071E3]" style={{ fontFamily: SF, fontWeight: 700 }}>
                                        {job.title?.[0]?.toUpperCase() ?? 'J'}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>
                                        {job.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[11px] text-[#AEAEB2]">{location}</span>
                                        <span className="text-[11px] text-[#AEAEB2]">·</span>
                                        <span className="text-[11px] text-[#AEAEB2]">{appCount} ứng viên</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-[#AEAEB2] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
