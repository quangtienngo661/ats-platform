'use client';

import { startTransition, useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui';
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
                toast.error('Lỗi', 'Không xuất được CSV. Thử lại.');
            } finally {
                exportInFlight.current = false;
                setIsExporting(false);
            }
        });
    }

    return (
        <Button variant="secondary" onClick={exportCsv} loading={isExporting}>
            {!isExporting && <Download aria-hidden="true" strokeWidth={1.75} />}
            Xuất CSV
        </Button>
    );
}
