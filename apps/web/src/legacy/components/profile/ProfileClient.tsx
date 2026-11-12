'use client';

import { useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
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
        <div className="max-w-[700px] mx-auto px-6 py-8" style={{ fontFamily: SFT }}>
            <ProfileHeader profile={profile} onEdit={() => setShowEditModal(true)} />
            <ProfileInfoCard profile={profile} />
            <ProfileDetails profileData={profile.profileData} />

            {showEditModal && (
                <ProfileEditModal
                    profile={profile}
                    onClose={() => setShowEditModal(false)}
                />
            )}
        </div>
    );
}
