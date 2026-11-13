'use client';

import { useState } from 'react';
import { ProfileHeader } from './ui/ProfileHeader';
import { ProfileInfoCard } from './ui/ProfileInfoCard';
import { ProfileDetails } from './ui/ProfileDetails';
import { ProfileEditModal } from './ui/ProfileEditModal';
import { ICandidateDto } from '@/types/interfaces/candidate.interface';

interface ProfileClientProps {
    profile: ICandidateDto;
}

export default function ProfileClient({ profile }: ProfileClientProps) {
    const [showEditModal, setShowEditModal] = useState(false);

    return (
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 py-6 sm:px-6">
            <ProfileHeader profile={profile} onEdit={() => setShowEditModal(true)} />
            <ProfileInfoCard profile={profile} />
            <ProfileDetails profileData={profile.profileData} />

            <ProfileEditModal profile={profile} open={showEditModal} onClose={() => setShowEditModal(false)} />
        </div>
    );
}
