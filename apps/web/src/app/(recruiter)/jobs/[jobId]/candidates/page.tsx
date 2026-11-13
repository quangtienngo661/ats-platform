import { getUiVariant } from '@/lib/ui-variant';
import LegacyJobCandidateListPage from '@/legacy/app/(recruiter)/jobs/[jobId]/candidates/page';
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
    if ((await getUiVariant()) === 'legacy') return <LegacyJobCandidateListPage params={params} />;
    const { jobId } = await params;
    const [applicationsResult, aiProfiles] = await Promise.all([
        getApplicationsByJobAction(jobId, { includeCancelled: false }),
        getAIConfigAction(),
    ]);
    const applications = applicationsResult.items;

    return (
        <div className="pb-6">
            <InitSocketRoom jobId={jobId} />
            <CandidatesHeader jobId={jobId} activeView="list" title={applications[0]?.jobPosting?.title} />
            <div className="space-y-4 px-4 pt-4 lg:px-6">
                <CandidatesStats applications={applications} />
                <CandidatesFilters applications={applications} jobId={jobId} aiProfiles={aiProfiles} />
            </div>
        </div>
    );
}
