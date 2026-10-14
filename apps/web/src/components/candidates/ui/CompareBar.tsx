'use client';

import { useRouter } from 'next/navigation';
import { SF } from '@/types/fonts/fonts';

interface CompareBarProps {
    jobId: string;
    selectedIds: string[];
}

export function CompareBar({ jobId, selectedIds }: CompareBarProps) {
    const router = useRouter();
    const canCompare = selectedIds.length >= 2 && selectedIds.length <= 4;

    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F2F2F7] bg-white p-4">
            <div aria-live="polite" className="text-[13px] text-[#6E6E73]">
                <p>Đã chọn {selectedIds.length} ứng viên</p>
                {selectedIds.length > 4 ? (
                    <p className="mt-1 text-[#D97706]">Chọn tối đa 4 ứng viên để so sánh</p>
                ) : (
                    <p className="mt-1">Chọn từ 2 đến 4 ứng viên để so sánh</p>
                )}
            </div>
            <button
                type="button"
                disabled={!canCompare}
                onClick={() => router.push(`/jobs/${jobId}/compare?ids=${selectedIds.join(',')}`)}
                className="min-h-11 rounded-xl bg-[#0071E3] px-4 py-2 text-[13px] text-white transition-colors hover:bg-[#005BB5] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]"
                style={{ fontFamily: SF, fontWeight: 600 }}
            >
                So sánh
            </button>
        </div>
    );
}
