'use client';

import { useActionState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import SubmitButton from '@/components/common/SubmitButton';
import { ICandidateDto } from '@/types/interfaces/candidate.interface';
import { updateMyCandidateProfileAction } from '@/servers/candidates/candidates.action';

interface ProfileEditModalProps {
    profile: ICandidateDto;
    onClose: () => void;
}

type ActionState = { success: boolean; message: string };
const initialState: ActionState = { success: false, message: '' };

export function ProfileEditModal({ profile, onClose }: ProfileEditModalProps) {
    const [state, formAction] = useActionState(updateMyCandidateProfileAction, initialState);

    useEffect(() => {
        if (state.success) {
            const timer = setTimeout(() => onClose(), 300);
            return () => clearTimeout(timer);
        }
    }, [state.success, onClose]);

    const pd = profile.profileData as {
        summary?: string;
        location?: string;

        // Temporarily comment the url such as github, website, linkedin
        // linkedin?: string;
        // github?: string;
        // website?: string;
    } | undefined;

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
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#F2F2F7] flex-shrink-0">
                        <h2 className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                            Chỉnh sửa hồ sơ
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors" type="button">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Form */}
                    <form action={formAction} className="flex flex-col flex-1 overflow-hidden">
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Họ và tên</label>
                                <input type="text" name="fullName" required defaultValue={profile.user?.fullName}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Chức danh hiện tại</label>
                                <input type="text" name="currentTitle" defaultValue={profile.currentTitle || ''}
                                    placeholder="Ví dụ: Frontend Developer"
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Số năm kinh nghiệm</label>
                                <input type="number" name="yearsOfExperience" min={0} max={50}
                                    defaultValue={profile.yearsOfExperience || ''}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Số điện thoại</label>
                                <input type="tel" name="phoneNumber" defaultValue={profile.user?.phoneNumber || ''}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Giới thiệu bản thân</label>
                                <textarea name="summary" rows={3} defaultValue={pd?.summary || ''}
                                    placeholder="Mô tả ngắn về bản thân và mục tiêu nghề nghiệp"
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px] resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Vị trí</label>
                                <input type="text" name="location" defaultValue={pd?.location || ''}
                                    placeholder="Ví dụ: TP. Hồ Chí Minh"
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                />
                            </div>

                            {/* Temporarily comment the url such as github, website, linkedin */}
                            {/* <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>LinkedIn</label>
                                <input type="url" name="linkedin" defaultValue={pd?.linkedin || ''}
                                    placeholder="https://linkedin.com/in/username"
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                />
                            </div> */}

                            {/* <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>GitHub</label>
                                <input type="url" name="github" defaultValue={pd?.github || ''}
                                    placeholder="https://github.com/username"
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                />
                            </div> */}

                            {/* <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Website</label>
                                <input type="url" name="website" defaultValue={pd?.website || ''}
                                    placeholder="https://yourwebsite.com"
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                />
                            </div> */}

                            {state.message && !state.success && (
                                <div className="px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                                    <p className="text-[13px] text-[#DC2626]">{state.message}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[#F2F2F7] flex gap-3 flex-shrink-0">
                            <button type="button" onClick={onClose}
                                className="flex-1 mt-[3px] py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px] text-[#1D1D1F]"
                                style={{ fontWeight: 500 }}
                            >
                                Hủy
                            </button>
                            <div className="flex-1">
                                <SubmitButton content="Cập nhật" />
                            </div>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
