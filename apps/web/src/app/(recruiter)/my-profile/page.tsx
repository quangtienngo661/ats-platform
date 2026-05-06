import RecruiterProfileClient from '@/components/recruiter-profile/RecruiterProfileClient';
import { mockRecruiterProfile } from '@/mocks/hr-portal';
// TODO: replace mock with real fetch
import { getMyRecruiterProfileAction } from '@/servers/recruiters/recruiters.action';

export default async function RecruiterProfilePage() {
    // TODO: const recruiter = await getMyRecruiterProfileAction();
    const recruiter = await getMyRecruiterProfileAction();

    return <RecruiterProfileClient recruiter={recruiter || mockRecruiterProfile} />;
}
