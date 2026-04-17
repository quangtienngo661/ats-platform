'use client';

import { useState, useActionState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
// Import thêm action update
import { createDepartmentAction, DepartmentState, updateDepartmentAction } from '@/servers/departments/departments.action';
import SubmitButton from '@/components/common/SubmitButton';
import { Department } from '@/types/interfaces/departments.interface';

const COLOR_OPTIONS = ['#0071E3', '#34C759', '#FF9500', '#6366F1', '#AF52DE', '#FF3B30'];

interface AddDepartmentModalProps {
    onClose: () => void;
    isEdited: boolean;
    editingDept: Department | null;
    onResult: (result: DepartmentState) => void;
}

const initialState = { success: false, message: '' };

export function MutateDepartmentModal({ onClose, isEdited, editingDept, onResult }: AddDepartmentModalProps) {
    const [color, setColor] = useState(isEdited && editingDept?.color ? editingDept.color : COLOR_OPTIONS[0]);

    // 1. Tự động chọn Action dựa trên trạng thái isEdited
    const actionToRun = isEdited ? updateDepartmentAction : createDepartmentAction;
    const [state, formAction] = useActionState(actionToRun, initialState);

    useEffect(() => {
        if (state.success) {
            if (onResult) {
                onResult(state);
            }

            const timer = setTimeout(() => {
                onClose();
            }, 300);
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
                    <div className="flex items-center justify-between p-6 border-b border-[#F2F2F7]">
                        <h2
                            className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]"
                            style={{ fontFamily: SF, fontWeight: 600 }}
                        >
                            {isEdited ? 'Cập nhật phòng ban' : 'Thêm phòng ban mới'}
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
                        {/* 2. THÊM HIDDEN INPUT GỬI ID NẾU LÀ CHẾ ĐỘ UPDATE */}
                        {isEdited && editingDept?.departmentId && (
                            <input type="hidden" name="departmentId" value={editingDept.departmentId} />
                        )}

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                    Tên phòng ban
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Nhập tên phòng ban"
                                    // 3. Đảm bảo fallback về chuỗi rỗng an toàn tuyệt đối
                                    defaultValue={isEdited ? (editingDept?.name ?? "") : ""}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                    Mô tả
                                </label>
                                <textarea
                                    name="description"
                                    placeholder="Mô tả chức năng và nhiệm vụ"
                                    rows={3}
                                    // 3. Đảm bảo fallback về chuỗi rỗng an toàn
                                    defaultValue={isEdited ? (editingDept?.description ?? "") : ""}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px] resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                    Màu đại diện
                                </label>
                                <input type="hidden" name="color" value={color} />
                                <div className="flex gap-2">
                                    {COLOR_OPTIONS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={`w-10 h-10 rounded-xl border-2 transition-all ${color === c ? 'border-[#1D1D1F] scale-110 shadow-sm' : 'border-transparent hover:border-[#E5E5EA]'}`}
                                            style={{ background: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

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
                                <SubmitButton content={`${isEdited ? "Cập nhật" : "Tạo"} phòng ban`} />
                            </div>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}