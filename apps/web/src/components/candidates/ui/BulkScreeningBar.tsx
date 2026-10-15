'use client';

import { useState } from 'react';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { BulkScreeningDialog, type BulkScreeningMode } from './BulkScreeningDialog';

interface BulkScreeningBarProps {
    jobId: string;
    selectedApplications: IApplicationDto[];
    applications: IApplicationDto[];
    aiProfiles: ConfigProfile[];
}

export function BulkScreeningBar({
    jobId, selectedApplications, applications, aiProfiles,
}: BulkScreeningBarProps) {
    const [mode, setMode] = useState<BulkScreeningMode | null>(null);
    const selectedCount = selectedApplications.length;

    return (
        <div className="bg-white rounded-2xl border border-[#F2F2F7] p-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
                <button type="button"
                    disabled={selectedCount === 0 || selectedCount > 50}
                    onClick={() => setMode({ kind: 'selected', applications: selectedApplications })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#0071E3] text-white text-[13px] font-medium hover:bg-[#005BB5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Chấm AI ({selectedCount} đã chọn)
                </button>
                <button type="button" onClick={() => setMode({ kind: 'auto' })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#EBF3FD] text-[#0071E3] text-[13px] font-medium hover:bg-[#DCEBFC] transition-colors">
                    Chấm mọi đơn đủ điều kiện
                </button>
            </div>
            {selectedCount > 50 && (
                <p className="mt-2 text-[13px] text-[#6E6E73]">Chọn tối đa 50 đơn để chấm cùng lúc</p>
            )}
            {mode && (
                <BulkScreeningDialog jobId={jobId} mode={mode} applications={applications}
                    aiProfiles={aiProfiles} onClose={() => setMode(null)} />
            )}
        </div>
    );
}
