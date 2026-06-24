import { X, Users, Briefcase, Mail, Phone, Shield, CheckCircle, XCircle, Building2, UserPlus } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '@ats-platform/types';
import { Department, DepartmentMember } from '@/types/interfaces/departments.interface';

interface DepartmentDetailModalProps {
    department: Department;
    onClose: () => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
    admin: 'Quản trị viên',
    recruiter: 'Tuyển dụng',
    candidate: 'Ứng viên',
};

const ROLE_STYLE: Record<UserRole, string> = {
    admin: 'bg-[#F5F0FF] text-[#6366F1]',
    recruiter: 'bg-[#E3F2FF] text-[#0071E3]',
    candidate: 'bg-[#FFF4E5] text-[#FF9500]',
};

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((w) => w[0].toUpperCase())
        .join('');
}

function MemberCard({ member, color }: { member: DepartmentMember; color: string }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F5F5F7] transition-colors group"
        >
            {/* Avatar */}
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[12px]"
                style={{ background: color, fontFamily: SF, fontWeight: 700 }}
            >
                {getInitials(member.fullName)}
            </div>

            {/* Info — name, position, role badge stacked */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-[14px] text-[#1D1D1F] truncate" style={{ fontFamily: SF, fontWeight: 600 }}>
                        {member.fullName}
                    </p>
                    {member.status === 'active' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[#34C759] flex-shrink-0" />
                    ) : (
                        <XCircle className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0" />
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[12px] text-[#6E6E73] truncate" style={{ fontFamily: SFT }}>
                        {member.position ?? 'Chưa cập nhật vị trí'}
                    </p>
                    <span
                        className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_STYLE[member.role]}`}
                        style={{ fontFamily: SF, fontWeight: 600 }}
                    >
                        {ROLE_LABEL[member.role]}
                    </span>
                </div>
            </div>

            {/* Contact — revealed on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {member.email && (
                    <a
                        href={`mailto:${member.email}`}
                        className="p-1.5 rounded-lg text-[#AEAEB2] hover:text-[#0071E3] hover:bg-[#EBF3FD] transition-colors"
                        title={member.email}
                    >
                        <Mail className="w-3.5 h-3.5" />
                    </a>
                )}
                {member.phoneNumber && (
                    <a
                        href={`tel:${member.phoneNumber}`}
                        className="p-1.5 rounded-lg text-[#AEAEB2] hover:text-[#34C759] hover:bg-[#E8F5E9] transition-colors"
                        title={member.phoneNumber}
                    >
                        <Phone className="w-3.5 h-3.5" />
                    </a>
                )}
            </div>
        </motion.div>
    );
}

export function DepartmentDetailModal({ department, onClose }: DepartmentDetailModalProps) {
    const activeMembers = department.members.filter((m) => m.status === 'active');
    const inactiveMembers = department.members.filter((m) => m.status === 'inactive');

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[#F2F2F7]">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${department.color}18` }}
                                >
                                    <Building2 className="w-6 h-6" style={{ color: department.color }} />
                                </div>
                                <div>
                                    <h2
                                        className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]"
                                        style={{ fontFamily: SF, fontWeight: 700 }}
                                    >
                                        {department.name}
                                    </h2>
                                    <p className="text-[13px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
                                        {department.description}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick stats */}
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {[
                                { icon: <Users className="w-4 h-4" style={{ color: department.color }} />, value: department.membersCount, label: 'Thành viên' },
                                { icon: <CheckCircle className="w-4 h-4 text-[#34C759]" />, value: activeMembers.length, label: 'Đang hoạt động' },
                                { icon: <Briefcase className="w-4 h-4 text-[#6366F1]" />, value: department.membersCount, label: 'Tin tuyển dụng' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-[#F5F5F7] rounded-2xl p-3 text-center">
                                    <div className="flex justify-center mb-1">{stat.icon}</div>
                                    <p className="text-[18px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 700 }}>{stat.value}</p>
                                    <p className="text-[10px] text-[#6E6E73]" style={{ fontFamily: SFT }}>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Member list */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        {department.members.length === 0 ? (
                            <div className="py-12 flex flex-col items-center gap-3 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                                    <Users className="w-6 h-6 text-[#AEAEB2]" />
                                </div>
                                <p className="text-[14px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
                                    Chưa có thành viên nào
                                </p>
                            </div>
                        ) : (
                            <>
                                {activeMembers.length > 0 && (
                                    <div>
                                        <p className="text-[11px] text-[#AEAEB2] mb-2 uppercase tracking-widest" style={{ fontFamily: SF, fontWeight: 600 }}>
                                            Đang hoạt động · {activeMembers.length}
                                        </p>
                                        <div className="space-y-1">
                                            {activeMembers.map((m) => (
                                                <MemberCard key={m.recruiterId} member={m} color={department.color} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {inactiveMembers.length > 0 && (
                                    <div>
                                        <p className="text-[11px] text-[#AEAEB2] mb-2 uppercase tracking-widest" style={{ fontFamily: SF, fontWeight: 600 }}>
                                            Không hoạt động · {inactiveMembers.length}
                                        </p>
                                        <div className="space-y-1 opacity-60">
                                            {inactiveMembers.map((m) => (
                                                <MemberCard key={m.recruiterId} member={m} color="#AEAEB2" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[#F2F2F7]">
                        <button
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[13px]"
                            style={{ fontFamily: SF, fontWeight: 600 }}
                        >
                            <UserPlus className="w-4 h-4" />
                            Thêm thành viên
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
