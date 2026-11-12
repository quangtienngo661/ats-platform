import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { JobParsedRequirements } from './JobParsedRequirements';

interface JobDetailBodyProps {
    job: IJobPostingDto;
}

export function JobDetailBody({ job }: JobDetailBodyProps) {
    return (
        <div className="space-y-5">
            <JobParsedRequirements parsedRequirements={job.parsedRequirements} />

            {job.description && (
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-7">
                    <h2 className="text-[18px] text-[#1D1D1F] mb-4 tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                        Mô tả công việc
                    </h2>
                    <div
                        className="text-[14px] text-[#6E6E73] leading-[1.75] whitespace-pre-line"
                        style={{ fontFamily: SFT }}
                        dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                </div>
            )}
        </div>
    );
}
