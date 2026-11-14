'use client';

import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import type { ICVScreening } from '@ats-platform/types';
import { Button } from '@/components/ui';
import { ReviewScreeningDialog } from './ReviewScreeningDialog';

interface ReviewScreeningButtonProps {
    applicationId: string;
    screening: ICVScreening | null | undefined;
}

/** Opens the review dialog. Only a completed screening has scores to review. */
export function ReviewScreeningButton({ applicationId, screening }: ReviewScreeningButtonProps) {
    const [open, setOpen] = useState(false);

    if (!screening || screening.status !== 'completed') return null;

    return (
        <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
                <ClipboardCheck aria-hidden="true" />
                Duyệt điểm
            </Button>
            {open && (
                <ReviewScreeningDialog
                    applicationId={applicationId}
                    screening={screening}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}
