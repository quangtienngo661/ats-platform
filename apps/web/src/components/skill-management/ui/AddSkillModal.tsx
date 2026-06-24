'use client';

import { useEffect, useRef, useActionState } from 'react';
import { X, Zap } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import { createSkillAction, SkillActionState } from '@/servers/skills/skills.action';
import { ISkillDto } from '@/types/interfaces/skill.interface';
import { toast } from '@/lib/toast';

interface AddSkillModalProps {
    existingCategories: string[];
    onClose: () => void;
}

const initialState: SkillActionState = { success: false, message: '' };

export function AddSkillModal({ existingCategories, onClose }: AddSkillModalProps) {
    const [state, dispatch, isPending] = useActionState(createSkillAction, initialState);
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => { nameRef.current?.focus(); }, []);

    // Watch state to handle success/error
    useEffect(() => {
        if (state.success && state.data) {
            toast.success('Thành công', state.message);
            onClose();
        } else if (state.message) {
            toast.error('Lỗi', state.message);
        }
    }, [state]);

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
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#F0F0FF] flex items-center justify-center">
                                <Zap className="w-4 h-4 text-[#6366F1]" />
                            </div>
                            <h2 className="text-[18px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                                Thêm kỹ năng mới
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <form action={dispatch}>
                        <div className="p-6 space-y-4">
                            {!state.success && state.message && (
                                <div className="px-4 py-3 rounded-xl bg-[#FFE5E5] text-[#FF3B30] text-[13px]" style={{ fontFamily: SF }}>
                                    {state.message}
                                </div>
                            )}

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                    Tên kỹ năng <span className="text-[#FF3B30]">*</span>
                                </label>
                                <input
                                    ref={nameRef}
                                    type="text"
                                    name="name"
                                    placeholder="Ví dụ: TypeScript, React, Docker..."
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 outline-none transition-all text-[14px]"
                                    style={{ fontFamily: SF }}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                    Danh mục <span className="text-[#AEAEB2] font-normal">(tùy chọn)</span>
                                </label>
                                <input
                                    type="text"
                                    name="category"
                                    placeholder="Ví dụ: Programming Language, Framework..."
                                    list="category-suggestions"
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 outline-none transition-all text-[14px]"
                                    style={{ fontFamily: SF }}
                                />
                                <datalist id="category-suggestions">
                                    {existingCategories.map((cat) => <option key={cat} value={cat} />)}
                                </datalist>
                                <p className="text-[11px] text-[#AEAEB2] mt-1.5">Nhập hoặc chọn từ danh mục có sẵn</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[#F2F2F7] flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px]"
                                style={{ fontWeight: 500 }}
                            >
                                Hủy
                            </button>
                            <motion.button
                                type="submit"
                                disabled={isPending}
                                whileTap={{ scale: 0.97 }}
                                className="flex-1 px-4 py-3 bg-[#6366F1] hover:bg-[#4F52D9] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[14px]"
                                style={{ fontWeight: 600 }}
                            >
                                {isPending ? 'Đang tạo...' : 'Tạo kỹ năng'}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
