import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { JobCard } from '@/components/public/jobs/JobCard';

interface HomeFeaturedJobsProps {
    jobs: IJobPostingDto[];
}

export function HomeFeaturedJobs({ jobs }: HomeFeaturedJobsProps) {
    if (jobs.length === 0) return null;

    return (
        <section className="py-14 bg-[#F5F5F7]">
            <div className="max-w-[1200px] mx-auto px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-[26px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                            Việc làm mới nhất
                        </h2>
                        <p className="text-[14px] text-[#6E6E73] mt-1" style={{ fontFamily: SFT }}>
                            Được cập nhật liên tục từ các doanh nghiệp uy tín
                        </p>
                    </div>
                    <Link
                        href="/jobs"
                        className="hidden sm:flex items-center gap-1 text-[13px] text-[#0071E3] hover:underline"
                        style={{ fontFamily: SFT, fontWeight: 500 }}
                    >
                        Xem tất cả <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {jobs.map(job => (
                        <JobCard key={job.jobId} job={job} />
                    ))}
                </div>

                <div className="text-center mt-8">
                    <Link
                        href="/jobs"
                        className="inline-flex items-center gap-2 px-6 py-3 border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] rounded-xl transition-all text-[14px]"
                        style={{ fontFamily: SFT, fontWeight: 500 }}
                    >
                        Xem thêm việc làm <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
