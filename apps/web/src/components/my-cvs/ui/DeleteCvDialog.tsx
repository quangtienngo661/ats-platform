'use client';

import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';
import { ICvDto } from '@/types/interfaces/cv.interface';

interface DeleteCvDialogProps {
    cv: ICvDto;
    /** Resolves when the delete finished (success or error); the dialog closes after it. */
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

export function DeleteCvDialog({ cv, onConfirm, onClose }: DeleteCvDialogProps) {
    const [deleting, setDeleting] = useState(false);

    const confirm = async () => {
        setDeleting(true);
        try {
            await onConfirm();
        } finally {
            onClose();
        }
    };

    return (
        <Dialog
            open
            onOpenChange={(open) => { if (!open && !deleting) onClose(); }}
            title="Xóa CV?"
            size="sm"
            footer={
                <>
                    <Button variant="secondary" disabled={deleting} onClick={onClose}>
                        Giữ lại
                    </Button>
                    <Button variant="danger" loading={deleting} onClick={confirm}>
                        Xóa CV
                    </Button>
                </>
            }
        >
            <p className="break-words text-body-sm text-ink-2">
                CV &quot;{cv.fileName}&quot; sẽ bị xóa khỏi hồ sơ của bạn.
            </p>
        </Dialog>
    );
}
