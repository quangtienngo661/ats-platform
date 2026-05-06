import { Building2, Briefcase, Edit2, Trash2, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';

interface RecruiterCardProps {
    recruiter: IRecruiterDto;
    departmentName: string;
    departmentColor: string;
    onEdit: (recruiter: IRecruiterDto) => void;
    onDelete: (recruiter: IRecruiterDto) => void;
    onViewDetail: (id: string) => void;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((w) => w[0].toUpperCase())
        .join('');
}

export function RecruiterCard({
    recruiter,
    departmentName,
    departmentColor,
    onEdit,
    onDelete,
    onViewDetail,
}: RecruiterCardProps) {
    const isActive = recruiter.user?.status === 'active';
    const user = recruiter.user;

    return (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 hover:shadow-lg hover:shadow-black/5 transition-all flex flex-col gap-4">
            {/* Top row: avatar + actions */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] flex-shrink-0"
                        style={{ background: departmentColor, fontFamily: SF, fontWeight: 700 }}
                    >
                        {user?.fullName ? getInitials(user.fullName) : '??'}
                    </div>
                    <div>
                        <p
                            className="text-[16px] text-[#1D1D1F] tracking-[-0.01em] leading-tight"
                            style={{ fontFamily: SF, fontWeight: 600 }}
                        >
                            {user?.fullName ?? 'Chưa cập nhật'}
                        </p>
                        <p className="text-[12px] text-[#6E6E73] mt-0.5" style={{ fontFamily: SFT }}>
                            {recruiter.position ?? 'Chưa cập nhật vị trí'}
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onEdit(recruiter)}
                        className="p-2 rounded-lg text-[#0071E3] hover:bg-[#EBF3FD] transition-colors"
                        title="Chỉnh sửa"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(recruiter)}
                        className="p-2 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors"
                        title="Xóa"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Status + department */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Status badge */}
                <span
                    className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full ${
                        isActive
                            ? 'bg-[#E8F5E9] text-[#34C759]'
                            : 'bg-[#F5F5F7] text-[#AEAEB2]'
                    }`}
                    style={{ fontFamily: SF, fontWeight: 600 }}
                >
                    {isActive ? (
                        <CheckCircle className="w-3 h-3" />
                    ) : (
                        <XCircle className="w-3 h-3" />
                    )}
                    {isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                </span>

                {/* Department badge */}
                <span
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full"
                    style={{
                        background: `${departmentColor}18`,
                        color: departmentColor,
                        fontFamily: SF,
                        fontWeight: 600,
                    }}
                >
                    <Building2 className="w-3 h-3" />
                    {departmentName}
                </span>
            </div>

            {/* Contact info */}
            <div className="space-y-1.5 text-[13px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
                {user?.email && (
                    <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                    </div>
                )}
                {user?.phoneNumber && (
                    <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0" />
                        <span>{user.phoneNumber}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#F2F2F7] flex justify-end">
                <button
                    onClick={() => onViewDetail(recruiter.recruiterId)}
                    className="flex items-center gap-1 text-[12px] text-[#0071E3] hover:underline"
                    style={{ fontWeight: 500 }}
                >
                    <Briefcase className="w-3.5 h-3.5" />
                    Xem chi tiết
                </button>
            </div>
        </div>
    );
}
