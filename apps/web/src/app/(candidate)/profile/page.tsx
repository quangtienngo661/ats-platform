import { notFound } from 'next/navigation';
import ProfileClient from '@/components/profile/ProfileClient';
import { getMyCandidateProfileAction } from '@/servers/candidates/candidates.action';

export default async function ProfilePage() {
    const profile = await getMyCandidateProfileAction();

    if (!profile) {
        notFound();
    }

    return <ProfileClient profile={profile} />;
}
