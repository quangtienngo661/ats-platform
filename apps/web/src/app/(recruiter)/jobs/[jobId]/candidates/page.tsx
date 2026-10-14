import { CandidatesHeader } from '@/components/candidates/ui/CandidatesHeader';
import { CandidatesStats } from '@/components/candidates/ui/CandidatesStats';
import { CandidatesFilters } from '@/components/candidates/ui/CandidatesFilters';
import { InitSocketRoom } from '@/components/common/InitSocketRoom';
import { getApplicationsByJobAction } from '@/servers/applications/applications.action';
import { getAIConfigAction } from '@/servers/ai-config/ai-config.action';


interface JobCandidateListPageProps {
    params: Promise<{ jobId: string }>;
}

export default async function JobCandidateListPage({ params }: JobCandidateListPageProps) {
    const { jobId } = await params;
    const [applicationsResult, aiProfiles] = await Promise.all([
        getApplicationsByJobAction(jobId, { includeCancelled: false }),
        getAIConfigAction(),
    ]);
    const applications = applicationsResult.items;

    return (
        <div className="flex flex-col h-full bg-[#F5F5F7]">
            <InitSocketRoom jobId={jobId} />
            <CandidatesHeader jobId={jobId} activeView="list" />
            <div className="p-6 lg:px-8 lg:py-6 flex-1 overflow-y-auto">
                <CandidatesStats applications={applications} />
                <CandidatesFilters applications={applications} jobId={jobId} aiProfiles={aiProfiles} />
            </div>
        </div>
    );
}
