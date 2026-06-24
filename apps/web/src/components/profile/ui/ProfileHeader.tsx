import { Edit2, FileText, Send, Calendar } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { ICandidateDto } from '@/types/interfaces/candidate.interface';

interface ProfileHeaderProps {
    profile: ICandidateDto;
    onEdit: () => void;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        month: 'long', year: 'numeric',
    });
}

export function ProfileHeader({ profile, onEdit }: ProfileHeaderProps) {
    const initials = profile.user?.fullName
        .split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();

    return (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6 mb-5">
            <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center text-white text-[20px] flex-shrink-0"
                    style={{ fontFamily: SF, fontWeight: 700 }}
                >
                    {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1
                                className="text-[22px] text-[#1D1D1F] tracking-[-0.02em]"
                                style={{ fontFamily: SF, fontWeight: 700 }}
                            >
                                {profile.user?.fullName}
                            </h1>
                            {profile.currentTitle && (
                                <p className="text-[14px] text-[#6E6E73] mt-0.5">{profile.currentTitle}</p>
                            )}
                        </div>

                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-3 py-2 bg-[#F5F5F7] hover:bg-[#EBEBF0] text-[#1D1D1F] rounded-xl transition-all text-[12px]"
                            style={{ fontWeight: 500 }}
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Chỉnh sửa
                        </button>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-[12px] text-[#AEAEB2]">
                            <FileText className="w-3.5 h-3.5" />
                            {profile.cvCount} CV
                        </span>
                        <span className="flex items-center gap-1.5 text-[12px] text-[#AEAEB2]">
                            <Send className="w-3.5 h-3.5" />
                            {profile.applicationCount} đơn ứng tuyển
                        </span>
                        {profile.yearsOfExperience && profile.yearsOfExperience > 0 && (
                            <span className="flex items-center gap-1.5 text-[12px] text-[#AEAEB2]">
                                {profile.yearsOfExperience} năm kinh nghiệm
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[12px] text-[#AEAEB2]">
                            <Calendar className="w-3.5 h-3.5" />
                            Tham gia {formatDate(profile.user?.createdAt || '')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
