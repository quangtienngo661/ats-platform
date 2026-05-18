'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { X, FileUp, FileText, Trash2 } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import SubmitButton from '@/components/common/SubmitButton';
import { CvActionState, uploadCvAction } from '@/servers/cvs/cvs.action';
import { toast } from '@/lib/toast';
import { useCvStore } from '@/stores/useCvStore';

interface UploadCvModalProps {
    onClose: () => void;
}

const initialState: CvActionState = { success: false, message: '' };
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function UploadCvModal({ onClose }: UploadCvModalProps) {
    const [state, formAction] = useActionState(uploadCvAction, initialState);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const addCv = useCvStore((store) => store.addCv);
    const handledCvId = useRef<string | null>(null);

    useEffect(() => {
        if (state.success) {
            if (state.data && handledCvId.current !== state.data.cvId) {
                handledCvId.current = state.data.cvId;
                addCv(state.data);
            }
            toast.success(state.message)
            onClose();
        } else if (!state.success && state.message) {
            toast.error("Upload CV thất bại", state.message);
        }
    }, [state, onClose, addCv])

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        // Reset the file input so the same file can be re-selected
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const defaultFileName = file ? file.name.replace(/\.pdf$/i, '') : '';

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
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between p-6 border-b border-[#F2F2F7]">
                        <h2
                            className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]"
                            style={{ fontFamily: SF, fontWeight: 600 }}
                        >
                            Tải CV lên
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors" type="button">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* ── Form ── */}
                    <form action={formAction}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="file"
                            accept=".pdf"
                            id="cv-upload-input"
                            onChange={handleFileSelected}
                            className="hidden"
                        />

                        {file === null ? (
                            /* ── Step 1: File selection (drag-drop area) ── */
                            <div className="p-6">
                                <label className="block text-[13px] text-[#1D1D1F] mb-3" style={{ fontWeight: 500 }}>
                                    Chọn file CV <span className="text-[#FF3B30]">*</span>
                                </label>

                                <label
                                    htmlFor="cv-upload-input"
                                    className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-[#E5E5EA] hover:border-[#0071E3] rounded-2xl cursor-pointer transition-colors bg-[#FAFAFA] hover:bg-[#F0F7FF]"
                                >
                                    <FileUp className="w-8 h-8 text-[#AEAEB2] mb-3" />
                                    <p className="text-[13px] text-[#6E6E73] mb-1" style={{ fontWeight: 500 }}>
                                        Kéo thả hoặc nhấn để chọn file
                                    </p>
                                    <p className="text-[11px] text-[#AEAEB2]">
                                        PDF — tối đa 5MB
                                    </p>
                                </label>

                                <p className="text-[11px] text-[#AEAEB2] mt-3">
                                    AI sẽ tự động phân tích CV sau khi tải lên
                                </p>
                            </div>
                        ) : (
                            /* ── Step 2: Name input + file preview card ── */
                            <div className="p-6 flex flex-col gap-5">
                                {/* CV Name input */}
                                <div>
                                    <label
                                        htmlFor="cvFileName"
                                        className="block text-[13px] text-[#1D1D1F] mb-2"
                                        style={{ fontWeight: 500 }}
                                    >
                                        Tên CV <span className="text-[#FF3B30]">*</span>
                                    </label>
                                    <input
                                        id="cvFileName"
                                        type="text"
                                        name="fileName"
                                        defaultValue={defaultFileName}
                                        placeholder="Nhập tên CV của bạn"
                                        required
                                        minLength={3}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA] text-[14px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 focus:bg-white"
                                        style={{ fontFamily: SFT }}
                                    />
                                </div>

                                {/* File Preview Card */}
                                <div>
                                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                        File đã chọn
                                    </label>
                                    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA]">
                                        {/* PDF Icon */}
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#FF3B30]/10 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-[#FF3B30]" />
                                        </div>

                                        {/* File info */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-[13px] text-[#1D1D1F] truncate"
                                                style={{ fontWeight: 500 }}
                                                title={file.name}
                                            >
                                                {file.name}
                                            </p>
                                            <p className="text-[11px] text-[#AEAEB2]">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>

                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="flex-shrink-0 p-2 rounded-lg text-[#AEAEB2] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                                            title="Xóa file"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-[11px] text-[#AEAEB2]">
                                    AI sẽ tự động phân tích CV sau khi tải lên
                                </p>
                            </div>
                        )}

                        {/* Error message */}
                        {state.message && !state.success && (
                            <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                                <p className="text-[13px] text-[#DC2626]">{state.message}</p>
                            </div>
                        )}

                        {/* ── Footer buttons ── */}
                        <div className="p-6 border-t border-[#F2F2F7] flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 mt-[3px] py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                                Hủy
                            </button>
                            <div className="flex-1">
                                <SubmitButton content="Tải lên" />
                            </div>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
}
