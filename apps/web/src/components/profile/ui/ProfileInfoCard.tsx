import { Mail, Phone, MapPin, Globe, AlignLeft } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { ICandidateDto } from '@/types/interfaces/candidate.interface';
import { GitHubIcon } from '@/components/public/icons/common.icon';


// Temporary
// {linkItems.length > 0 && (
//                 <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
//                     <h3
//                         className="text-[13px] text-[#1D1D1F] mb-3 flex items-center gap-2"
//                         style={{ fontFamily: SF, fontWeight: 600 }}
//                     >
//                         <Globe className="w-4 h-4 text-[#AEAEB2]" />
//                         Liên kết
//                     </h3>
//                     <div className="space-y-2.5">
//                         {linkItems.map(({ icon: Icon, label, value, color, bg }) => (
//                             <a
//                                 key={label}
//                                 href={value}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 className="flex items-center gap-3 group"
//                             >
//                                 <div
//                                     className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
//                                     style={{ background: bg }}
//                                 >
//                                     {/* <Icon className="w-4 h-4" style={{ color }} /> */}
//                                 </div>
//                                 <div className="min-w-0">
//                                     <p className="text-[11px] text-[#AEAEB2]">{label}</p>
//                                     <p
//                                         className="text-[13px] truncate group-hover:underline"
//                                         style={{ color }}
//                                     >
//                                         {value}
//                                     </p>
//                                 </div>
//                             </a>
//                         ))}
//                     </div>
//                 </div>
//             )}

interface ProfileInfoCardProps {
    profile: ICandidateDto;
}

export function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
    const pd = profile.profileData as {
        summary?: string;
        location?: string;
        // linkedin?: string;
        // github?: string;
        // website?: string;
    } | undefined;

    const contactItems = [
        { icon: Mail, label: 'Email', value: profile.user?.email },
        { icon: Phone, label: 'Điện thoại', value: profile.user?.phoneNumber },
        { icon: MapPin, label: 'Vị trí', value: pd?.location },
    ].filter((item): item is { icon: typeof Mail; label: string; value: string } =>
        typeof item.value === 'string' && item.value.trim() !== ''
    );

    // const linkItems = [
    //     // { icon: Linkedin, label: 'LinkedIn', value: pd?.linkedin, color: '#0A66C2', bg: '#EBF3FD' },
    //     { icon: GitHubIcon(), label: 'GitHub', value: pd?.github, color: '#1D1D1F', bg: '#F5F5F7' },
    //     { icon: Globe, label: 'Website', value: pd?.website, color: '#0071E3', bg: '#EBF3FD' },
    // ].filter((item): item is typeof item & { value: string } =>
    //     typeof item.value === 'string' && item.value.trim() !== ''
    // );

    return (
        <div className="space-y-4" style={{ fontFamily: SFT }}>

            {/* summary */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
                <h3
                    className="text-[13px] text-[#1D1D1F] mb-3 flex items-center gap-2"
                    style={{ fontFamily: SF, fontWeight: 600 }}
                >
                    <AlignLeft className="w-4 h-4 text-[#AEAEB2]" />
                    Giới thiệu bản thân
                </h3>
                {pd?.summary ? (
                    <p className="text-[13px] text-[#6E6E73] leading-relaxed">{pd.summary}</p>
                ) : (
                    <p className="text-[13px] text-[#AEAEB2] italic">
                        Chưa có thông tin giới thiệu. Hãy chỉnh sửa hồ sơ để thêm.
                    </p>
                )}
            </div>

            {/* Contact info */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
                <h3
                    className="text-[13px] text-[#1D1D1F] mb-3 flex items-center gap-2"
                    style={{ fontFamily: SF, fontWeight: 600 }}
                >
                    <Mail className="w-4 h-4 text-[#AEAEB2]" />
                    Thông tin liên hệ
                </h3>

                {contactItems.length === 0 ? (
                    <p className="text-[13px] text-[#AEAEB2] italic">Chưa có thông tin liên hệ.</p>
                ) : (
                    <div className="space-y-3">
                        {contactItems.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-4 h-4 text-[#AEAEB2]" />
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#AEAEB2]">{label}</p>
                                    <p className="text-[13px] text-[#1D1D1F]">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Social links */}

        </div>
    );
}
