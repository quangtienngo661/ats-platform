'use client';

import { useState, useActionState, useEffect } from 'react';
import { UserCircle, Building2, Mail, Phone, Shield, Edit3, Save, X, Briefcase, Camera, CheckCircle2 } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { toast } from '@/lib/toast';
import { motion, AnimatePresence } from 'motion/react';
import { updateMyRecruiterProfileAction, RecruiterActionState } from '@/servers/recruiters/recruiters.action';

interface RecruiterProfileClientProps {
    recruiter: IRecruiterDto;
}

export default function RecruiterProfileClient({ recruiter }: RecruiterProfileClientProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [position, setPosition] = useState(recruiter.position || '');

    const [state, formAction, isPending] = useActionState(updateMyRecruiterProfileAction, {
        success: false,
        message: ''
    } as RecruiterActionState);

    useEffect(() => {
        if (state && state.message) {
            if (state.success) {
                toast.success(state.message);
                setIsEditing(false);
                if (state.data?.position) {
                    setPosition(state.data.position);
                }
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    const user = recruiter.user;
    const dept = recruiter.department;
    const initials = (user?.fullName || 'NN').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

    const handleCancel = () => {
        setIsEditing(false);
        setPosition(recruiter.position || ''); // Reset lại
    };

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full" style={{ fontFamily: SFT }}>
            {/* Page Title */}
            <div className="mb-8">
                <h1 className="text-[24px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                    Hồ sơ cá nhân
                </h1>
                <p className="text-[14px] text-[#6E6E73] mt-1">
                    Quản lý thông tin và tài khoản tuyển dụng của bạn
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Left Column: Avatar & Basic Identity */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white rounded-3xl border border-[#F2F2F7] p-6 flex flex-col items-center text-center shadow-sm">
                        <div className="relative group cursor-pointer mb-5">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#0071E3] to-[#4F46E5] flex items-center justify-center text-white shadow-md shadow-[#0071E3]/20 transition-transform duration-300 group-hover:scale-105">
                                <span className="text-[32px] tracking-tight" style={{ fontFamily: SF, fontWeight: 600 }}>{initials}</span>
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute bottom-1 right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-[#34C759]" />
                            </div>
                        </div>

                        <h2 className="text-[20px] text-[#1D1D1F] tracking-tight mb-1" style={{ fontFamily: SF, fontWeight: 700 }}>
                            {user?.fullName || 'N/A'}
                        </h2>
                        <p className="text-[14px] text-[#0071E3] bg-[#EBF3FD] px-3 py-1 rounded-full inline-flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                            <Briefcase className="w-3.5 h-3.5" />
                            {position || 'Chưa cập nhật'}
                        </p>
                    </div>

                    {/* Role & Status Card */}
                    <div className="bg-white rounded-3xl border border-[#F2F2F7] p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[12px] uppercase tracking-wider text-[#AEAEB2]" style={{ fontWeight: 600 }}>Trạng thái</span>
                            <span className="flex items-center gap-1.5 text-[12px] text-[#34C759] bg-[#F0FDF4] px-2.5 py-1 rounded-full" style={{ fontWeight: 600 }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span> Hoạt động
                            </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-2xl">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <Shield className="w-5 h-5 text-[#6366F1]" />
                            </div>
                            <div>
                                <p className="text-[11px] text-[#AEAEB2] mb-0.5">Quyền hạn</p>
                                <p className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
                                    {user?.role === 'recruiter' ? 'Nhà tuyển dụng' : user?.role === 'admin' ? 'Quản trị viên' : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Info & Settings */}
                <form action={formAction} className="lg:col-span-8">
                    <div className="bg-white rounded-3xl border border-[#F2F2F7] overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-[#F2F2F7] flex items-center justify-between bg-white/50 backdrop-blur-xl sticky top-0 z-10">
                            <h3 className="text-[16px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                                Thông tin liên hệ & Công việc
                            </h3>
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[#0071E3] hover:bg-[#EBF3FD] rounded-lg transition-colors text-[13px]" style={{ fontWeight: 500 }}>
                                    <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={handleCancel} className="px-3 py-1.5 text-[#6E6E73] hover:bg-[#F5F5F7] rounded-lg transition-colors text-[13px]" style={{ fontWeight: 500 }}>
                                        Hủy
                                    </button>
                                    <button type="submit" disabled={isPending} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-lg shadow-sm shadow-[#0071E3]/20 transition-all text-[13px]" style={{ fontWeight: 500 }}>
                                        {isPending ? <span className="animate-pulse">Đang lưu...</span> : <><Save className="w-3.5 h-3.5" /> Lưu thay đổi</>}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-[12px] text-[#6E6E73] flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                                        <Mail className="w-3.5 h-3.5" /> Địa chỉ Email
                                    </label>
                                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-transparent">
                                        <p className="text-[14px] text-[#1D1D1F] truncate">{user?.email || 'N/A'}</p>
                                    </div>
                                    <p className="text-[11px] text-[#AEAEB2] ml-1">Email dùng để đăng nhập, không thể thay đổi.</p>
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <label className="text-[12px] text-[#6E6E73] flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                                        <Phone className="w-3.5 h-3.5" /> Số điện thoại
                                    </label>
                                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-transparent">
                                        <p className="text-[14px] text-[#1D1D1F] truncate">{user?.phoneNumber || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>

                                {/* Department */}
                                <div className="space-y-1.5 py-1.5 md:col-span-2">
                                    <label className="text-[12px] text-[#6E6E73] flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                                        <Building2 className="w-3.5 h-3.5" /> Phòng ban trực thuộc
                                    </label>
                                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-transparent flex items-center gap-2">
                                        {dept?.color && <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: dept.color }} />}
                                        <p className="text-[14px] text-[#1D1D1F]">{dept?.name || 'Chưa phân bổ'}</p>
                                    </div>
                                </div>

                                {/* Position (Editable) */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[12px] text-[#6E6E73] flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                                        <Briefcase className="w-3.5 h-3.5" /> Chức danh hiển thị
                                    </label>
                                    <AnimatePresence mode="wait">
                                        {isEditing ? (
                                            <motion.div
                                                key="editing"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <input
                                                    type="text"
                                                    name="position"
                                                    value={position}
                                                    onChange={e => setPosition(e.target.value)}
                                                    className="w-full p-3 bg-white rounded-xl border border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10 outline-none text-[14px] text-[#1D1D1F] transition-all shadow-sm"
                                                    placeholder="Ví dụ: Senior IT Recruiter"
                                                />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="viewing"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="p-3 bg-white rounded-xl border border-[#E5E5EA]"
                                            >
                                                <p className="text-[14px] text-[#1D1D1F]">{position || 'Chưa cập nhật'}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
