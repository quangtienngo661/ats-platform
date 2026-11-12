import { getUiVariant } from '@/lib/ui-variant';
import LegacyProfilePage from '@/legacy/app/(candidate)/profile/page';
import { notFound } from 'next/navigation';
import ProfileClient from '@/components/profile/ProfileClient';
import { getMyCandidateProfileAction } from '@/servers/candidates/candidates.action';

export default async function ProfilePage() {
    if ((await getUiVariant()) === 'legacy') return <LegacyProfilePage />;
    const profile = await getMyCandidateProfileAction();

    if (!profile) {
        notFound();
    }

    return <ProfileClient profile={profile} />;
}
