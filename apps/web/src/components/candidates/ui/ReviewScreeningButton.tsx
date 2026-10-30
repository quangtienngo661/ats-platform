'use client';

import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import type { ICVScreening } from '@ats-platform/types';
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
            <button type="button" onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]">
                <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                Duyệt điểm
            </button>
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
