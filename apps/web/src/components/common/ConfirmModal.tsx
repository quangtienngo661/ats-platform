'use client';

import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isConfirming?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    description,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    isConfirming = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] overflow-hidden"
            >
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-[#FFFBEB] flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
                    </div>
                    <h3 className="text-[18px] text-[#1D1D1F] mb-2" style={{ fontFamily: SF, fontWeight: 700 }}>
                        {title}
                    </h3>
                    <p className="text-[14px] text-[#6E6E73] mb-6 leading-relaxed">
                        {description}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isConfirming}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E5EA] text-[#1D1D1F] text-[14px] hover:bg-[#F5F5F7] transition-colors disabled:opacity-50"
                            style={{ fontWeight: 600 }}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isConfirming}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF3B30] text-white text-[14px] hover:bg-[#D70015] transition-colors flex items-center justify-center disabled:opacity-50"
                            style={{ fontWeight: 600 }}
                        >
                            {isConfirming ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
