'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, FileText, Lock } from 'lucide-react';
import Link from 'next/link';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { applyForJobAction, ApplicationActionState } from '@/servers/applications/applications.action';
import { getMyCvsAction } from '@/servers/cvs/cvs.action';
import { ICvDto } from '@/types/interfaces/cv.interface';
import { toast } from '@/lib/toast';

interface ApplyButtonProps {
    job: IJobPostingDto;
    isLoggedIn: boolean;
}

const initialState: ApplicationActionState = { success: false, message: '' };

export function ApplyButton({ job, isLoggedIn }: ApplyButtonProps) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [cvs, setCvs] = useState<ICvDto[]>([]);
    const [selectedCvId, setSelectedCvId] = useState('');
    const [loadingCvs, setLoadingCvs] = useState(false);

    const [state, dispatch, isPending] = useActionState(applyForJobAction, initialState);

    // Load CVs when modal opens
    useEffect(() => {
        if (!showModal || !isLoggedIn) return;
        setLoadingCvs(true);
        getMyCvsAction().then(data => {
            setCvs(data);
            if (data.length > 0) setSelectedCvId(data[0].cvId);
            setLoadingCvs(false);
        });
    }, [showModal, isLoggedIn]);

    // Handle action result
    useEffect(() => {
        if (state.success) {
            toast.success('Ứng tuyển thành công!', 'Đơn của bạn đã được ghi nhận.');
            setShowModal(false);
            router.push('/my-applications');
        } else if (state.message) {
            toast.error('Ứng tuyển thất bại', state.message);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    if (!isLoggedIn) {
        return (
            <Link
                href={`/sign-in?callbackUrl=/jobs/${job.jobId}`}
                className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[15px]"
                style={{ fontFamily: SFT, fontWeight: 600 }}
            >
                <Lock className="w-4 h-4" />
                Đăng nhập để ứng tuyển
            </Link>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[15px]"
                style={{ fontFamily: SFT, fontWeight: 600 }}
            >
                <Send className="w-4 h-4" />
                Ứng tuyển ngay
            </button>

            {/* Apply Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-[#F2F2F7]">
                                <div>
                                    <h2 className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                                        Ứng tuyển vị trí
                                    </h2>
                                    <p className="text-[13px] text-[#6E6E73] mt-0.5">{job.title}</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body */}
                            <form action={dispatch} className="p-6 space-y-4">
                                <input type="hidden" name="jobId" value={job.jobId} />
                                <input type="hidden" name="cvId" value={selectedCvId} />

                                {!state.success && state.message && (
                                    <div className="px-4 py-3 rounded-xl bg-[#FFE5E5] text-[#FF3B30] text-[13px]">
                                        {state.message}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                        Chọn CV để ứng tuyển <span className="text-[#FF3B30]">*</span>
                                    </label>

                                    {loadingCvs ? (
                                        <div className="text-[13px] text-[#AEAEB2] py-4 text-center">Đang tải CV...</div>
                                    ) : cvs.length === 0 ? (
                                        <div className="border-2 border-dashed border-[#E5E5EA] rounded-xl p-6 text-center">
                                            <FileText className="w-8 h-8 text-[#AEAEB2] mx-auto mb-2" />
                                            <p className="text-[13px] text-[#6E6E73] mb-1">Bạn chưa có CV nào</p>
                                            <Link
                                                href="/profile?tab=cvs"
                                                className="text-[13px] text-[#0071E3] hover:underline"
                                                style={{ fontWeight: 500 }}
                                            >
                                                Tải lên CV ngay →
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {cvs.map(cv => (
                                                <label
                                                    key={cv.cvId}
                                                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${selectedCvId === cv.cvId ? 'border-[#0071E3] bg-[#EBF3FD]' : 'border-[#E5E5EA] hover:border-[#AEAEB2]'}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="cvSelect"
                                                        className="sr-only"
                                                        checked={selectedCvId === cv.cvId}
                                                        onChange={() => setSelectedCvId(cv.cvId)}
                                                    />
                                                    <FileText className={`w-4 h-4 flex-shrink-0 ${selectedCvId === cv.cvId ? 'text-[#0071E3]' : 'text-[#AEAEB2]'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] text-[#1D1D1F] truncate" style={{ fontWeight: selectedCvId === cv.cvId ? 500 : 400 }}>
                                                            {cv.fileName ?? `CV - ${cv.cvId.slice(-6)}`}
                                                        </p>
                                                        {cv.createdAt && (
                                                            <p className="text-[11px] text-[#AEAEB2]">
                                                                {new Date(cv.createdAt).toLocaleDateString('vi-VN')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {selectedCvId === cv.cvId && (
                                                        <div className="w-4 h-4 rounded-full bg-[#0071E3] flex items-center justify-center flex-shrink-0">
                                                            <div className="w-2 h-2 bg-white rounded-full" />
                                                        </div>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px]"
                                        style={{ fontWeight: 500 }}
                                    >
                                        Hủy
                                    </button>
                                    <motion.button
                                        type="submit"
                                        disabled={isPending || cvs.length === 0 || !selectedCvId}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[14px]"
                                        style={{ fontWeight: 600 }}
                                    >
                                        <Send className="w-4 h-4" />
                                        {isPending ? 'Đang nộp...' : 'Nộp đơn ứng tuyển'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
