'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { BulkScreeningDialog, type BulkScreeningMode } from './BulkScreeningDialog';

interface BulkScreeningBarProps {
    jobId: string;
    selectedApplications: IApplicationDto[];
    applications: IApplicationDto[];
    aiProfiles: ConfigProfile[];
    /**
     * Which buttons to show: `selected` scores the ticked rows, `auto` every eligible application of the job.
     * The candidate list puts `auto` in its toolbar and `selected` in the selection bar; default is both.
     */
    actions?: 'both' | BulkScreeningMode['kind'];
}

export function BulkScreeningBar({
    jobId, selectedApplications, applications, aiProfiles, actions = 'both',
}: BulkScreeningBarProps) {
    const [mode, setMode] = useState<BulkScreeningMode | null>(null);
    const selectedCount = selectedApplications.length;
    const showSelected = actions !== 'auto';
    const showAuto = actions !== 'selected';

    return (
        <div className="flex flex-wrap items-center gap-2">
            {showSelected && (
                <Button
                    disabled={selectedCount === 0 || selectedCount > 50}
                    onClick={() => setMode({ kind: 'selected', applications: selectedApplications })}
                >
                    Chấm AI ({selectedCount} đã chọn)
                </Button>
            )}
            {showAuto && (
                <Button variant="secondary" onClick={() => setMode({ kind: 'auto' })}>
                    Chấm mọi đơn đủ điều kiện
                </Button>
            )}
            {showSelected && selectedCount > 50 && (
                <p className="basis-full text-caption text-warning">Chọn tối đa 50 đơn để chấm cùng lúc</p>
            )}
            {mode && (
                <BulkScreeningDialog jobId={jobId} mode={mode} applications={applications}
                    aiProfiles={aiProfiles} onClose={() => setMode(null)} />
            )}
        </div>
    );
}
