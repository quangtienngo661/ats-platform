'use client';

import { useState, useActionState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import { createRecruiterAction, updateRecruiterAction, RecruiterActionState } from '@/servers/recruiters/recruiters.action';
import SubmitButton from '@/components/common/SubmitButton';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { UserRole } from '@ats-platform/database';
import { IUserDto } from '@ats-platform/types';

interface DepartmentOption {
    departmentId: string;
    name: string;
    color: string;
}

interface MutateRecruiterModalProps {
    onClose: () => void;
    isEdited: boolean;
    editingRecruiter: IRecruiterDto | null;
    departments: DepartmentOption[];
    users: IUserDto[];
    onResult: (result: RecruiterActionState) => void;
}

const initialState: RecruiterActionState = { success: false, message: '' };

export function MutateRecruiterModal({
    onClose,
    isEdited,
    editingRecruiter,
    departments,
    users,
    onResult,
}: MutateRecruiterModalProps) {
    const actionToRun = isEdited ? updateRecruiterAction : createRecruiterAction;
    const [state, formAction] = useActionState(actionToRun, initialState);

    useEffect(() => {
        if (state.success) {
            if (onResult) onResult(state);
            const timer = setTimeout(() => onClose(), 300);
            return () => clearTimeout(timer);
        }
    }, [state.success, onClose]);

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
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#F2F2F7]">
                        <h2
                            className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]"
                            style={{ fontFamily: SF, fontWeight: 600 }}
                        >
                            {isEdited ? 'Cập nhật nhà tuyển dụng' : 'Thêm nhà tuyển dụng mới'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors"
                            type="button"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <form action={formAction}>
                        {/* Hidden ID for update mode */}
                        {isEdited && editingRecruiter?.recruiterId && (
                            <input type="hidden" name="recruiterId" value={editingRecruiter.recruiterId} />
                        )}

                        <div className="p-6 space-y-4">
                            {/* userId — only for create */}
                            {!isEdited && (
                                <div>
                                    <label
                                        className="block text-[13px] text-[#1D1D1F] mb-2"
                                        style={{ fontWeight: 500 }}
                                    >
                                        Chọn user <span className="text-[#FF3B30]">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="userId"
                                            defaultValue={isEdited ? (editingRecruiter?.userId ?? '') : ''}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px] appearance-none bg-white"
                                            style={{ fontFamily: SFT }}
                                        >
                                            <option value="" disabled>Chọn user</option>
                                            {users
                                                .filter((user) => user.role === UserRole.recruiter)
                                                .map((user) => (
                                                    <option key={user.userId} value={user.userId}>
                                                        {user.fullName}
                                                    </option>
                                                ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2] pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {/* Department */}
                            <div>
                                <label
                                    className="block text-[13px] text-[#1D1D1F] mb-2"
                                    style={{ fontWeight: 500 }}
                                >
                                    Phòng ban <span className="text-[#FF3B30]">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        name="departmentId"
                                        required
                                        defaultValue={isEdited ? (editingRecruiter?.departmentId ?? '') : ''}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px] appearance-none bg-white"
                                        style={{ fontFamily: SFT }}
                                    >
                                        <option value="" disabled>Chọn phòng ban</option>
                                        {departments.map((dept) => (
                                            <option key={dept.departmentId} value={dept.departmentId}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2] pointer-events-none" />
                                </div>
                            </div>

                            {/* Position */}
                            <div>
                                <label
                                    className="block text-[13px] text-[#1D1D1F] mb-2"
                                    style={{ fontWeight: 500 }}
                                >
                                    Chức vụ <span className="text-[#FF3B30]">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="position"
                                    required
                                    placeholder="VD: Senior Recruiter, HR Manager..."
                                    defaultValue={isEdited ? (editingRecruiter?.position ?? '') : ''}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                    style={{ fontFamily: SFT }}
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {state.message && !state.success && (
                            <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-[#FFF0F0] border border-[#FFD5D5]">
                                <p className="text-[13px] text-[#FF3B30]" style={{ fontFamily: SFT }}>
                                    {state.message}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="p-6 border-t border-[#F2F2F7] flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 mt-[3px] py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px] text-[#1D1D1F]"
                                style={{ fontWeight: 500 }}
                            >
                                Hủy
                            </button>
                            <div className="flex-1">
                                <SubmitButton content={`${isEdited ? 'Cập nhật' : 'Tạo'}`} />
                            </div>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
