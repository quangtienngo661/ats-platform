import { Pencil } from 'lucide-react';
import { Avatar, Button } from '@/components/ui';
import { ICandidateDto } from '@/types/interfaces/candidate.interface';

interface ProfileHeaderProps {
    profile: ICandidateDto;
    onEdit: () => void;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

export function ProfileHeader({ profile, onEdit }: ProfileHeaderProps) {
    const name = profile.user?.fullName ?? '';
    const stats = [
        `${profile.cvCount ?? 0} CV`,
        `${profile.applicationCount ?? 0} đơn ứng tuyển`,
        profile.yearsOfExperience && profile.yearsOfExperience > 0
            ? `${profile.yearsOfExperience} năm kinh nghiệm`
            : null,
        profile.user?.createdAt ? `Tham gia ${formatDate(profile.user.createdAt)}` : null,
    ].filter((item): item is string => item !== null);

    return (
        <header className="flex flex-wrap items-start gap-4">
            <Avatar name={name || '?'} size={64} />
            <div className="min-w-0 flex-1">
                <h1 className="break-words text-heading text-ink">{name}</h1>
                <p className="break-all text-body text-ink-3">{profile.user?.email}</p>
                {profile.currentTitle && <p className="mt-1 break-words text-body text-ink-2">{profile.currentTitle}</p>}
                <p className="mt-2 text-caption text-ink-3">{stats.join(' · ')}</p>
            </div>
            <Button variant="secondary" onClick={onEdit}>
                <Pencil aria-hidden="true" strokeWidth={1.75} />
                Sửa hồ sơ
            </Button>
        </header>
    );
}
