'use client';

import { X, Users, Mail, Phone, CheckCircle, XCircle, Building2, Briefcase, Trash2 } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';

interface RecruiterDetailModalProps {
    recruiter: IRecruiterDto;
    departmentName: string;
    departmentColor: string;
    onClose: () => void;
    onEdit: (recruiter: IRecruiterDto) => void;
    onDelete: (recruiter: IRecruiterDto) => void;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((w) => w[0].toUpperCase())
        .join('');
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-3 border-b border-[#F2F2F7] last:border-0">
            <div className="w-8 h-8 rounded-xl bg-[#F5F5F7] flex items-center justify-center flex-shrink-0 mt-0.5">
                {icon}
            </div>
            <div>
                <p className="text-[11px] text-[#AEAEB2] uppercase tracking-wider mb-0.5" style={{ fontFamily: SF, fontWeight: 600 }}>
                    {label}
                </p>
                <p className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SFT }}>
                    {value}
                </p>
            </div>
        </div>
    );
}

export function RecruiterDetailModal({
    recruiter,
    departmentName,
    departmentColor,
    onClose,
    onEdit,
    onDelete,
}: RecruiterDetailModalProps) {
    const user = recruiter.user;
    const isActive = user?.status === 'active';

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
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[#F2F2F7]">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-[18px] flex-shrink-0"
                                    style={{ background: departmentColor, fontFamily: SF, fontWeight: 700 }}
                                >
                                    {user?.fullName ? getInitials(user.fullName) : '??'}
                                </div>
                                <div>
                                    <h2
                                        className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]"
                                        style={{ fontFamily: SF, fontWeight: 700 }}
                                    >
                                        {user?.fullName ?? 'Chưa cập nhật'}
                                    </h2>
                                    <p className="text-[13px] text-[#6E6E73] mt-0.5" style={{ fontFamily: SFT }}>
                                        {recruiter.position ?? 'Chưa cập nhật chức vụ'}
                                    </p>
                                    {/* Status badge */}
                                    <span
                                        className={`mt-2 inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full ${
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
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {[
                                {
                                    icon: <Building2 className="w-4 h-4" style={{ color: departmentColor }} />,
                                    value: departmentName,
                                    label: 'Phòng ban',
                                },
                                {
                                    icon: <Users className="w-4 h-4 text-[#6366F1]" />,
                                    value: user?.role === 'admin' ? 'Admin' : 'Recruiter',
                                    label: 'Vai trò',
                                },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-[#F5F5F7] rounded-2xl p-3 text-center">
                                    <div className="flex justify-center mb-1">{stat.icon}</div>
                                    <p
                                        className="text-[13px] text-[#1D1D1F] truncate"
                                        style={{ fontFamily: SF, fontWeight: 700 }}
                                    >
                                        {stat.value}
                                    </p>
                                    <p className="text-[10px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detail rows */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <InfoRow
                            icon={<Mail className="w-4 h-4 text-[#0071E3]" />}
                            label="Email"
                            value={user?.email}
                        />
                        <InfoRow
                            icon={<Phone className="w-4 h-4 text-[#34C759]" />}
                            label="Số điện thoại"
                            value={user?.phoneNumber}
                        />
                        <InfoRow
                            icon={<Briefcase className="w-4 h-4 text-[#FF9500]" />}
                            label="Chức vụ"
                            value={recruiter.position}
                        />
                        <InfoRow
                            icon={<Building2 className="w-4 h-4" style={{ color: departmentColor }} />}
                            label="Phòng ban"
                            value={departmentName}
                        />
                    </div>

                    {/* Footer actions */}
                    <div className="p-4 border-t border-[#F2F2F7] flex gap-3">
                        <button
                            onClick={() => { onDelete(recruiter); onClose(); }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#FFD5D5] text-[#FF3B30] hover:bg-[#FFF0F0] rounded-xl transition-colors text-[13px]"
                            style={{ fontFamily: SF, fontWeight: 500 }}
                        >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                        </button>
                        <button
                            onClick={() => { onEdit(recruiter); onClose(); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[13px]"
                            style={{ fontFamily: SF, fontWeight: 600 }}
                        >
                            Chỉnh sửa thông tin
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
