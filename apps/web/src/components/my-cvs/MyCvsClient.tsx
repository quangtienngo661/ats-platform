'use client';

import { useEffect, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Button, EmptyState, Stagger } from '@/components/ui';
import { MyCvsHeader } from './ui/MyCvsHeader';
import { MyCvsStats } from './ui/MyCvsStats';
import { CvCard } from './ui/CvCard';
import { UploadCvModal } from './ui/UploadCvModal';
import { CvDetailModal } from './ui/CvDetailModal';
import { DeleteCvDialog } from './ui/DeleteCvDialog';

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
    const [deletingCv, setDeletingCv] = useState<ICvDto | null>(null);
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

    const openUpload = () => setShowUploadModal(true);

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
            <MyCvsHeader onUpload={openUpload} />

            {storeCvs.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Chưa có CV nào"
                    description="Tải CV dạng PDF lên để AI phân tích và dùng khi ứng tuyển."
                    action={
                        <Button onClick={openUpload}>
                            <Upload aria-hidden="true" strokeWidth={1.75} />
                            Tải CV lên
                        </Button>
                    }
                />
            ) : (
                <>
                    <MyCvsStats cvs={storeCvs} />
                    <Stagger className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                        {storeCvs.map((cv) => (
                            <div key={cv.cvId} className="min-w-0">
                                <CvCard
                                    cv={cv}
                                    onView={() => setViewingCv(cv)}
                                    onDelete={() => setDeletingCv(cv)}
                                />
                            </div>
                        ))}
                    </Stagger>
                </>
            )}

            {showUploadModal && <UploadCvModal onClose={() => setShowUploadModal(false)} />}
            {deletingCv && (
                <DeleteCvDialog
                    cv={deletingCv}
                    onConfirm={() => handleDelete(deletingCv.cvId)}
                    onClose={() => setDeletingCv(null)}
                />
            )}
            {viewingCv && <CvDetailModal cv={viewingCv} onClose={() => setViewingCv(null)} />}
        </div>
    );
}
