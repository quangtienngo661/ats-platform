import { ICandidateDto } from '@/types/interfaces/candidate.interface';

interface ProfileInfoCardProps {
    profile: ICandidateDto;
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-caption text-ink-3">{label}</dt>
            <dd className="break-words text-body text-ink">{value}</dd>
        </div>
    );
}

export function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
    const pd = profile.profileData as { summary?: string; location?: string } | undefined;

    const contactItems = [
        { label: 'Email', value: profile.user?.email },
        { label: 'Điện thoại', value: profile.user?.phoneNumber },
        { label: 'Vị trí', value: pd?.location },
    ].filter((item): item is { label: string; value: string } =>
        typeof item.value === 'string' && item.value.trim() !== '',
    );

    return (
        <>
            <section aria-labelledby="profile-summary" className="flex flex-col gap-3">
                <h2 id="profile-summary" className="text-title-sm text-ink">Giới thiệu bản thân</h2>
                {pd?.summary ? (
                    <p className="whitespace-pre-line break-words text-body text-ink-2">{pd.summary}</p>
                ) : (
                    <p className="text-body-sm text-ink-3">Chưa có giới thiệu. Chọn Sửa hồ sơ để thêm.</p>
                )}
            </section>

            <section aria-labelledby="profile-contact" className="flex flex-col gap-3">
                <h2 id="profile-contact" className="text-title-sm text-ink">Thông tin liên hệ</h2>
                {contactItems.length === 0 ? (
                    <p className="text-body-sm text-ink-3">Chưa có thông tin liên hệ.</p>
                ) : (
                    <dl className="grid gap-4 sm:grid-cols-2">
                        {contactItems.map((item) => (
                            <Row key={item.label} {...item} />
                        ))}
                    </dl>
                )}
            </section>
        </>
    );
}
