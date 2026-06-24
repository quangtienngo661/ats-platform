'use client';

import { useEffect, useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import { MyCvsHeader } from './ui/MyCvsHeader';
import { MyCvsStats } from './ui/MyCvsStats';
import { CvCard } from './ui/CvCard';
import { UploadCvModal } from './ui/UploadCvModal';
import { CvDetailModal } from './ui/CvDetailModal';

import { ICvDto } from '@/types/interfaces/cv.interface';
import { deleteCvAction } from '@/servers/cvs/cvs.action';
import { toast } from '@/lib/toast';
import { useCvStore } from '@/stores/useCvStore';
import { useSocketStore } from '@/stores/useSocketStore';

interface DataPayload {
    cvId: string;
    updatedCv: ICvDto
}

export default function MyCvsClient() {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [viewingCv, setViewingCv] = useState<ICvDto | null>(null);
    const socket = useSocketStore();
    const updatedCv = useCvStore(state => state.updateCv);
    const removeCv = useCvStore(state => state.removeCv);
    const storeCvs = useCvStore(state => state.cvs);

    useEffect(() => {
        if (socket.status !== 'connected') return;

        const handleStatusUpdate = (data: DataPayload) => {
            updatedCv(data.cvId, data.updatedCv)
        }

        socket.onEvent<DataPayload>("cvs:parsed_successfully", handleStatusUpdate)

        return () => {
            socket.offEvent<DataPayload>("cvs:parsed_successfully", handleStatusUpdate)
        }
    }, [updatedCv, socket])

    const handleDelete = async (cvId: string) => {
        const result = await deleteCvAction(cvId);
        if (result.success) {
            removeCv(cvId);
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="max-w-[900px] mx-auto px-6 py-8" style={{ fontFamily: SFT }}>
            <MyCvsHeader onUpload={() => setShowUploadModal(true)} />
            <MyCvsStats cvs={storeCvs} />

            <motion.div layout className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {storeCvs.map((cv) => (
                        <motion.div
                            key={cv.cvId}
                            layout
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CvCard
                                cv={cv}
                                onView={() => setViewingCv(cv)}
                                onDelete={() => handleDelete(cv.cvId)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {storeCvs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#E5E5EA]">
                        <p className="text-[15px] text-[#6E6E73]" style={{ fontWeight: 500 }}>
                            Bạn chưa tải lên CV nào
                        </p>
                        <p className="text-[12px] text-[#AEAEB2] mt-1">
                            Tải lên CV để bắt đầu ứng tuyển
                        </p>
                    </div>
                )}
            </motion.div>

            {showUploadModal && <UploadCvModal onClose={() => setShowUploadModal(false)} />}
            {viewingCv && <CvDetailModal cv={viewingCv} onClose={() => setViewingCv(null)} />}
        </div>
    );
}
