'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import { MyApplicationsHeader } from './ui/MyApplicationsHeader';
import { MyApplicationsStats } from './ui/MyApplicationsStats';
import { ApplicationCard } from './ui/ApplicationCard';
import { IApplicationCard } from '@/types/interfaces/application.interface';
import { INotification } from '@/types/interfaces/notification.interface';
import { useSocketStore } from '@/stores/useSocketStore';
import { toast } from '@/lib/toast';

export type { IApplicationCard as ApplicationItem };

interface MyApplicationsClientProps {
    applications: IApplicationCard[];
}

type StatusFilter = 'all' | string;

const STATUS_FILTERS: StatusFilter[] = [
    'all',
    'applied',
    'screening',
    'interview',
    'offer',
    'rejected',
    'cancelled',
];

const FILTER_LABELS: Record<string, string> = {
    all: 'Tất cả',
    applied: 'Đã nộp',
    screening: 'Sàng lọc',
    interview: 'Phỏng vấn',
    offer: 'Offer',
    rejected: 'Từ chối',
    cancelled: 'Rút đơn',
};

export default function MyApplicationsClient({ applications }: MyApplicationsClientProps) {
    const [items, setItems] = useState<IApplicationCard[]>(applications);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const router = useRouter();
    const socket = useSocketStore();

    useEffect(() => {
        setItems(applications);
    }, [applications]);

    useEffect(() => {
        if (socket.status !== 'connected') return;

        const handleApplicationNotification = (notification: INotification) => {
            const applicationType = 'application' as INotification['type'];
            const applicationEntityType = 'application' as INotification['relatedEntityType'];

            if (notification.type !== applicationType) return;
            if (notification.relatedEntityType && notification.relatedEntityType !== applicationEntityType) return;

            toast.info(notification.title, notification.message);

            router.refresh();
        };

        socket.onEvent<INotification>('notification:new', handleApplicationNotification);
        return () => {
            socket.offEvent<INotification>('notification:new', handleApplicationNotification);
        };
    }, [router, socket]);

    const handleWithdrawSuccess = useCallback((applicationId: string) => {
        setItems((prev) =>
            prev.map((application) =>
                application.applicationId === applicationId
                    ? { ...application, status: 'cancelled' }
                    : application,
            ),
        );
        router.refresh();
    }, [router]);

    const filtered = statusFilter === 'all'
        ? items
        : items.filter((application) => application.status === statusFilter);

    return (
        <div className="w-full max-w-[900px] mx-auto px-4 md:px-6 py-8" style={{ fontFamily: SFT }}>
            <MyApplicationsHeader />
            <MyApplicationsStats applications={items} />

            <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
                {STATUS_FILTERS.map((status) => {
                    const count = status === 'all'
                        ? items.length
                        : items.filter((application) => application.status === status).length;
                    const isActive = statusFilter === status;

                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-[12px] transition-all whitespace-nowrap ${isActive
                                ? 'bg-[#0071E3] text-white'
                                : 'bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#EBEBF0]'
                                }`}
                            style={{ fontWeight: isActive ? 600 : 400 }}
                        >
                            {FILTER_LABELS[status]} ({count})
                        </button>
                    );
                })}
            </div>

            <motion.div layout className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {filtered.map((application) => (
                        <motion.div
                            key={application.applicationId}
                            layout
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ApplicationCard
                                application={application}
                                onWithdrawSuccess={handleWithdrawSuccess}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#E5E5EA]">
                        <p className="text-[15px] text-[#6E6E73]" style={{ fontWeight: 500 }}>
                            Không có đơn ứng tuyển nào
                        </p>
                        <p className="text-[12px] text-[#AEAEB2] mt-1">
                            Hãy tìm và ứng tuyển công việc phù hợp
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
