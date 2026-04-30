'use client';

import { useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
import { MyCvsHeader } from './ui/MyCvsHeader';
import { MyCvsStats } from './ui/MyCvsStats';
import { CvCard } from './ui/CvCard';
import { UploadCvModal } from './ui/UploadCvModal';
import { CvDetailModal } from './ui/CvDetailModal';

import { ICvDto } from '@/types/interfaces/cv.interface';
import { deleteCvAction } from '@/servers/cvs/cvs.action';
import { toast } from '@/lib/toast';

interface MyCvsClientProps {
    cvs: ICvDto[];
}

export default function MyCvsClient({ cvs }: MyCvsClientProps) {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [viewingCv, setViewingCv] = useState<ICvDto | null>(null);

    const handleDelete = async (cvId: string) => {
        const result = await deleteCvAction(cvId);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="max-w-[900px] mx-auto px-6 py-8" style={{ fontFamily: SFT }}>
            <MyCvsHeader onUpload={() => setShowUploadModal(true)} />
            <MyCvsStats cvs={cvs} />

            <div className="flex flex-col gap-3">
                {cvs.map((cv) => (
                    <CvCard
                        key={cv.cvId}
                        cv={cv}
                        onView={() => setViewingCv(cv)}
                        onDelete={() => handleDelete(cv.cvId)}
                    />
                ))}

                {cvs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#E5E5EA]">
                        <p className="text-[15px] text-[#6E6E73]" style={{ fontWeight: 500 }}>
                            Bạn chưa tải lên CV nào
                        </p>
                        <p className="text-[12px] text-[#AEAEB2] mt-1">
                            Tải lên CV để bắt đầu ứng tuyển
                        </p>
                    </div>
                )}
            </div>

            {showUploadModal && <UploadCvModal onClose={() => setShowUploadModal(false)} />}
            {viewingCv && <CvDetailModal cv={viewingCv} onClose={() => setViewingCv(null)} />}
        </div>
    );
}
