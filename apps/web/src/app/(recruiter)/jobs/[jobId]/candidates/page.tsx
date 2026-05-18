import { CandidatesHeader } from '@/components/candidates/ui/CandidatesHeader';
import { CandidatesStats } from '@/components/candidates/ui/CandidatesStats';
import { CandidatesFilters } from '@/components/candidates/ui/CandidatesFilters';
import { getApplicationsByJobAction } from '@/servers/applications/applications.action';
import { getJobPostingByIdAction } from '@/servers/job-postings/job-postings.action';

interface JobCandidateListPageProps {
    params: Promise<{ jobId: string }>;
}

export default async function JobCandidateListPage({ params }: JobCandidateListPageProps) {
    const { jobId } = await params;
    const applicationsResult = await getApplicationsByJobAction(jobId, { includeCancelled: false });
    const applications = applicationsResult.data;

    return (
        <div className="flex flex-col h-full bg-[#F5F5F7]">
            <CandidatesHeader jobId={jobId} activeView="list" />
            <div className="p-6 lg:px-8 lg:py-6 flex-1 overflow-y-auto">
                <CandidatesStats applications={applications} />
                <CandidatesFilters applications={applications} jobId={jobId} />
            </div>
        </div>
    );
}
