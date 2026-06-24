import CandidateDetailClient from '@/components/candidates/CandidateDetailClient';
import { getApplicationByIdAction } from '@/servers/applications/applications.action';

interface CandidateDetailPageProps {
    params: Promise<{ jobId: string; id: string }>;
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
    const { jobId, id } = await params;
    const application = await getApplicationByIdAction(id);

    return <CandidateDetailClient application={application} jobId={jobId} />;
}
