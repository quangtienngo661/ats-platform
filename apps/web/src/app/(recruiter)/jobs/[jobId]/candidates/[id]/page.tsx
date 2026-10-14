import CandidateDetailClient from '@/components/candidates/CandidateDetailClient';
import { getApplicationByIdAction } from '@/servers/applications/applications.action';
import { getMeAction } from '@/servers/users/users.action';
import { ApplicationStatus } from '@ats-platform/types';

interface CandidateDetailPageProps {
    params: Promise<{ jobId: string; id: string }>;
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
    const { jobId, id } = await params;
    const [application, currentUser] = await Promise.all([
        getApplicationByIdAction(id),
        getMeAction(),
    ]);
    const isClosed = application.status === ApplicationStatus.hired
        || application.status === ApplicationStatus.rejected
        || application.status === ApplicationStatus.cancelled;

    return <CandidateDetailClient application={application} jobId={jobId} currentUserId={currentUser?.userId ?? ''} isClosed={isClosed} />;
}
