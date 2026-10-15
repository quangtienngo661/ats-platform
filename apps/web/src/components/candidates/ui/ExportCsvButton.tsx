'use client';

import { startTransition, useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { downloadCsv } from '@/lib/download-csv';
import { toast } from '@/lib/toast';
import { exportCandidatesCsvAction } from '@/servers/applications/applications.action';

export function ExportCsvButton({ jobId }: { jobId: string }) {
    const [isExporting, setIsExporting] = useState(false);
    const exportInFlight = useRef(false);

    function exportCsv() {
        if (exportInFlight.current) return;
        exportInFlight.current = true;
        setIsExporting(true);

        startTransition(async () => {
            try {
                const result = await exportCandidatesCsvAction(jobId);
                if (result.success) {
                    downloadCsv(result.filename, result.csv);
                } else {
                    toast.error('Lỗi', result.message);
                }
            } catch (error) {
                unstable_rethrow(error);
                toast.error('Lỗi', 'Xuất CSV thất bại. Vui lòng thử lại.');
            } finally {
                exportInFlight.current = false;
                setIsExporting(false);
            }
        });
    }

    return (
        <button type="button" onClick={exportCsv} disabled={isExporting} aria-busy={isExporting}
            className="px-3.5 py-2.5 rounded-xl bg-[#EBF3FD] text-[#0071E3] text-[13px] font-medium hover:bg-[#DCEBFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Xuất CSV
        </button>
    );
}
