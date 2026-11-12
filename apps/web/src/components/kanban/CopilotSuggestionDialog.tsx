'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AccessibleDialog, DialogContent, DialogOverlay } from '@/components/common/AccessibleDialog';
import {
    applyCopilotSuggestionAction,
    dismissCopilotSuggestionAction,
    explainCopilotSuggestionAction,
} from '@/servers/applications/copilot.action';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import type { ICopilotSuggestion } from '@/types/interfaces/copilot.interface';
import { SFT } from '@/types/fonts/fonts';

interface CopilotSuggestionDialogProps {
    applicationId: string;
    candidateName: string;
    jobId: string;
    suggestion: ICopilotSuggestion;
    onClose: () => void;
    /** After apply: the refreshed application (null when the API did not return one). */
    onApplied: (application: IApplicationDto | null) => void;
    onDismissed: () => void;
}

const APPLY_LABEL: Record<string, string> = {
    move_status: 'Áp dụng',
    run_screening: 'Chạy sàng lọc',
};

const primaryClass = 'px-4 py-2 rounded-xl text-[13px] text-white bg-[#0071E3] hover:bg-[#0062C4] disabled:opacity-50';
const secondaryClass = 'px-4 py-2 rounded-xl text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-50';

/**
 * One co-pilot suggestion: why, and what the recruiter can do with it. Nothing happens
 * until the recruiter presses a button (ADR 0002); a rejection is never one of them.
 */
export function CopilotSuggestionDialog({
    applicationId, candidateName, jobId, suggestion, onClose, onApplied, onDismissed,
}: CopilotSuggestionDialogProps) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);

    const run = async (work: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        try {
            await work();
        } finally {
            setBusy(false);
        }
    };

    const apply = () => run(async () => {
        const result = await applyCopilotSuggestionAction(applicationId, suggestion.key);
        if (result.ok) onApplied(result.data.application);
        else setError(result.message);
    });

    const dismiss = () => run(async () => {
        const result = await dismissCopilotSuggestionAction(applicationId, suggestion.key);
        if (result.ok) onDismissed();
        else setError(result.message);
    });

    const explain = () => run(async () => {
        const result = await explainCopilotSuggestionAction(applicationId);
        if (result.ok) setExplanation(result.data.explanation);
        else setError(result.message);
    });

    const profileHref = `/jobs/${jobId}/candidates/${applicationId}`;
    const action = suggestion.action.type;

    return (
        <AccessibleDialog onClose={onClose} dismissible={!busy}>
            <DialogOverlay className="fixed inset-0 bg-black/30 z-50" />
            <DialogContent title="Gợi ý của AI co-pilot">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-2xl border border-[#F2F2F7] p-6 shadow-xl"
                    style={{ fontFamily: SFT }}>
                    <p className="flex items-center gap-1.5 text-[12px] text-[#0071E3]">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Gợi ý cho {candidateName}
                    </p>
                    <h2 className="mt-1 text-[18px] text-[#1D1D1F] font-semibold">{suggestion.title}</h2>

                    <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-[#1D1D1F]" aria-label="Lý do">
                        {suggestion.reasons.map(reason => <li key={reason}>{reason}</li>)}
                    </ul>

                    {explanation && (
                        <p className="mt-3 rounded-xl bg-[#F5F5F7] px-3 py-2 text-[13px] text-[#1D1D1F]" aria-label="Giải thích của AI">
                            {explanation}
                        </p>
                    )}
                    {error && <p role="alert" className="mt-3 text-[13px] text-[#DC2626]">{error}</p>}

                    <p className="mt-3 text-[12px] text-[#6E6E73]">Bạn quyết định; gợi ý không tự thực hiện.</p>

                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={explain} disabled={busy || explanation !== null} className={secondaryClass}>
                            AI giải thích
                        </button>
                        <button type="button" onClick={dismiss} disabled={busy} className={secondaryClass}>
                            Bỏ qua
                        </button>
                        {action === 'move_status' || action === 'run_screening' ? (
                            <button type="button" onClick={apply} disabled={busy} className={primaryClass}>
                                {APPLY_LABEL[action]}
                            </button>
                        ) : action === 'schedule_interview' ? (
                            <Link href="/interviews" className={primaryClass}>Đặt lịch</Link>
                        ) : (
                            <Link href={profileHref} className={primaryClass}>Mở hồ sơ</Link>
                        )}
                    </div>
                </div>
            </DialogContent>
        </AccessibleDialog>
    );
}
