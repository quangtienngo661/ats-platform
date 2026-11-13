'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface CompareBarProps {
    jobId: string;
    selectedIds: string[];
}

export function CompareBar({ jobId, selectedIds }: CompareBarProps) {
    const router = useRouter();
    const canCompare = selectedIds.length >= 2 && selectedIds.length <= 4;

    return (
        <div className="flex min-w-0 flex-1 basis-64 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div aria-live="polite" className="min-w-0">
                <p className="text-body-sm font-medium tabular-nums text-ink">Đã chọn {selectedIds.length} ứng viên</p>
                {selectedIds.length > 4 ? (
                    <p className="text-caption text-warning">Chọn tối đa 4 ứng viên để so sánh</p>
                ) : (
                    <p className="text-caption text-ink-3">Chọn từ 2 đến 4 ứng viên để so sánh</p>
                )}
            </div>
            <Button
                variant="secondary"
                // 44 px touch target on a phone.
                className="max-md:h-11"
                disabled={!canCompare}
                onClick={() => router.push(`/jobs/${jobId}/compare?ids=${selectedIds.join(',')}`)}
            >
                So sánh
            </Button>
        </div>
    );
}
