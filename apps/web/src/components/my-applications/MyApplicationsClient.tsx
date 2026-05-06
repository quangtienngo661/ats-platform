'use client';

import { useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
import { MyApplicationsHeader } from './ui/MyApplicationsHeader';
import { MyApplicationsStats } from './ui/MyApplicationsStats';
import { ApplicationCard } from './ui/ApplicationCard';
import { IApplicationCard } from '@/types/interfaces/application.interface';
import { withdrawApplicationAction } from '@/servers/applications/applications.action';
import { toast } from '@/lib/toast';

// Re-export for child components
export type { IApplicationCard as ApplicationItem };

interface MyApplicationsClientProps {
    applications: IApplicationCard[];
}

type StatusFilter = 'all' | string;

export default function MyApplicationsClient({ applications }: MyApplicationsClientProps) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filtered = statusFilter === 'all'
        ? applications
        : applications.filter((a) => a.status === statusFilter);

    const handleWithdraw = async (appId: string) => {
        // TODO: connect to withdrawApplicationAction
        const result = await withdrawApplicationAction(appId);
        if (result.success) {
            toast.success("Đơn tuyển dụng", result.message);
        } else {
            toast.error("Đơn tuyển dụng", result.message);
        }
    };

    return (
        <div className="max-w-[900px] mx-auto px-6 py-8" style={{ fontFamily: SFT }}>
            <MyApplicationsHeader />
            <MyApplicationsStats applications={applications} />

            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
                {(['all', 'applied', 'screening', 'interview', 'offer', 'rejected', 'cancelled'] as StatusFilter[]).map((s) => {
                    const labels: Record<string, string> = {
                        all: 'Tất cả', applied: 'Đã nộp', screening: 'Sàng lọc',
                        interview: 'Phỏng vấn', offer: 'Offer', rejected: 'Từ chối', cancelled: 'Rút đơn',
                    };
                    const count = s === 'all' ? applications.length : applications.filter((a) => a.status === s).length;
                    const isActive = statusFilter === s;
                    return (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-[12px] transition-all whitespace-nowrap ${isActive
                                ? 'bg-[#0071E3] text-white'
                                : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#EBEBF0]'
                                }`}
                            style={{ fontWeight: isActive ? 600 : 400 }}
                        >
                            {labels[s]} ({count})
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3">
                {filtered.map((app) => (
                    <ApplicationCard key={app.applicationId} application={app} onWithdraw={() => handleWithdraw(app.applicationId)} />
                ))}

                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#E5E5EA]">
                        <p className="text-[15px] text-[#6E6E73]" style={{ fontWeight: 500 }}>
                            Không có đơn ứng tuyển nào
                        </p>
                        <p className="text-[12px] text-[#AEAEB2] mt-1">
                            Hãy tìm và ứng tuyển việc làm phù hợp
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
