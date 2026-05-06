import CandidateDetailClient from '@/components/candidates/CandidateDetailClient';
import { getApplicationByIdAction } from '@/servers/applications/applications.action';

interface CandidateDetailPageProps {
    params: Promise<{ jobId: string; id: string }>;
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
    const { jobId, id } = await params;

    // TODO: replace mock with real fetch
    const application = await getApplicationByIdAction(id);
    // const application = mockApplications.find(a => a.applicationId === id) || mockApplications[0];

    return <CandidateDetailClient application={application} jobId={jobId} />;
}
