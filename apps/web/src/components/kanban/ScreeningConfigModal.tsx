'use client';

import { useActionState, useEffect } from 'react';
import { X, Sparkles, SlidersHorizontal, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SF, SFT } from '@/types/constants/kanban.constants';
import { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import SubmitButton from '@/components/common/SubmitButton';
import { ApplicationActionState, triggerCvScreeningAction } from '@/servers/applications/applications.action';

interface ScreeningConfigModalProps {
    applicationId: string;
    candidateName: string;
    roleName: string;
    aiProfiles: ConfigProfile[];
    onClose: () => void;
    onSuccess: () => void;
}

const initialState: ApplicationActionState = { success: false, message: '' };

export default function ScreeningConfigModal({
    applicationId,
    candidateName,
    roleName,
    aiProfiles,
    onClose,
    onSuccess,
}: ScreeningConfigModalProps) {
    const defaultProfile = aiProfiles.find(p => p.isDefault) ?? aiProfiles[0] ?? null;

    const [state, formAction] = useActionState(triggerCvScreeningAction, initialState);

    // Lắng nghe kết quả từ server
    useEffect(() => {
        if (state.success) {
            onSuccess();
            const timer = setTimeout(() => onClose(), 300);
            return () => clearTimeout(timer);
        }
    }, [state]);

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                    onClick={e => e.stopPropagation()}
                    style={{ fontFamily: SFT }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-[#F2F2F7]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#4F46E5] flex items-center justify-center">
                                <SlidersHorizontal className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-[18px] text-[#1D1D1F] tracking-tight" style={{ fontFamily: SF, fontWeight: 600 }}>
                                    Cấu hình Sàng lọc AI
                                </h2>
                                <p className="text-[12px] text-[#6E6E73] truncate max-w-[260px]">
                                    {candidateName} • {roleName}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-[#6E6E73]" />
                        </button>
                    </div>

                    {/* Form */}
                    <form action={formAction}>
                        {/* Hidden fields — FormData tự động thu thập */}
                        <input type="hidden" name="applicationId" value={applicationId} />

                        <div className="p-6">
                            {aiProfiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mb-3">
                                        <SlidersHorizontal className="w-6 h-6 text-[#AEAEB2]" />
                                    </div>
                                    <p className="text-[14px] text-[#1D1D1F] mb-1" style={{ fontWeight: 600 }}>Chưa có cấu hình AI</p>
                                    <p className="text-[13px] text-[#6E6E73]">
                                        Vui lòng tạo cấu hình tại trang{' '}
                                        <a href="/ai-configuration" className="text-[#0071E3] underline">AI Configuration</a>{' '}
                                        trước khi sàng lọc.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-[13px] text-[#6E6E73] mb-4">
                                        Chọn bộ tiêu chí đánh giá CV để AI sử dụng cho ứng viên này:
                                    </p>
                                    {aiProfiles.map(profile => {
                                        const isDefault = profile.configId === defaultProfile?.configId;
                                        return (
                                            <label
                                                key={profile.configId}
                                                className="flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all
                                                    has-[:checked]:border-[#0071E3] has-[:checked]:bg-[#EBF3FD]
                                                    border-[#F2F2F7] bg-white hover:border-[#D2D2D7]"
                                            >
                                                {/* Radio — ẩn nhưng có trong FormData */}
                                                <input
                                                    type="radio"
                                                    name="configId"
                                                    value={profile.configId}
                                                    defaultChecked={isDefault}
                                                    className="sr-only"
                                                />

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[14px] text-[#1D1D1F] truncate" style={{ fontWeight: 600 }}>
                                                            {profile.name}
                                                        </span>
                                                        {profile.isDefault && (
                                                            <span className="flex-shrink-0 flex items-center gap-1 text-[10px] bg-[#F5F0FF] text-[#7C3AED] px-2 py-0.5 rounded-full border border-[#7C3AED]/20" style={{ fontWeight: 600 }}>
                                                                <Star className="w-2.5 h-2.5" />Mặc định
                                                            </span>
                                                        )}
                                                    </div>
                                                    {profile.description && (
                                                        <p className="text-[12px] text-[#6E6E73] truncate mb-2">{profile.description}</p>
                                                    )}
                                                    {/* Weight pills */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className="text-[11px] bg-white border border-[#E5E5EA] text-[#1D1D1F] px-2 py-0.5 rounded-full">
                                                            Kỹ năng {profile.skillsWeight}%
                                                        </span>
                                                        <span className="text-[11px] bg-white border border-[#E5E5EA] text-[#1D1D1F] px-2 py-0.5 rounded-full">
                                                            Kinh nghiệm {profile.experienceWeight}%
                                                        </span>
                                                        <span className="text-[11px] bg-white border border-[#E5E5EA] text-[#1D1D1F] px-2 py-0.5 rounded-full">
                                                            Học vấn {profile.educationWeight}%
                                                        </span>
                                                        <span className="text-[11px] bg-white border border-[#E5E5EA] text-[#6E6E73] px-2 py-0.5 rounded-full">
                                                            Ngưỡng: {profile.minimumScoreThreshold}
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Error message */}
                            {state.message && !state.success && (
                                <p className="mt-4 text-[13px] text-red-500 bg-[#FEF2F2] px-4 py-2.5 rounded-xl border border-red-100">
                                    {state.message}
                                </p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 px-6 py-4 bg-[#F5F5F7]/50 border-t border-[#F2F2F7]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px] text-[#1D1D1F]"
                                style={{ fontWeight: 500 }}
                            >
                                Bỏ qua
                            </button>
                            {aiProfiles.length > 0 && (
                                <div className="flex-1">
                                    <SubmitButton
                                        content="Bắt đầu Sàng lọc"
                                    />
                                </div>
                            )}
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
