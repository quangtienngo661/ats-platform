'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { ButtonLink, EmptyState, Segmented, Stagger } from '@/components/ui';

import { MyApplicationsHeader } from './ui/MyApplicationsHeader';
import { MyApplicationsStats } from './ui/MyApplicationsStats';
import { ApplicationCard } from './ui/ApplicationCard';
import { IApplicationCard } from '@/types/interfaces/application.interface';
import { INotification } from '@/types/interfaces/notification.interface';
import { useSocketStore } from '@/stores/useSocketStore';
import { toast } from '@/lib/toast';
import { isInProgress } from './timeline/next-step';

export type { IApplicationCard as ApplicationItem };

interface MyApplicationsClientProps {
    applications: IApplicationCard[];
}

type StatusFilter = 'all' | 'active' | 'finished';

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'active', label: 'Đang xử lý' },
    { value: 'finished', label: 'Đã kết thúc' },
];

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
        : items.filter((application) => isInProgress(application.status) === (statusFilter === 'active'));

    if (items.length === 0) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
                <MyApplicationsHeader />
                <EmptyState
                    icon={Search}
                    title="Chưa có đơn ứng tuyển"
                    description="Các đơn bạn nộp sẽ hiện ở đây cùng trạng thái và bước tiếp theo."
                    action={<ButtonLink href="/job-postings">Tìm việc</ButtonLink>}
                />
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
            <MyApplicationsHeader>
                <Segmented
                    label="Lọc đơn theo trạng thái"
                    options={FILTER_OPTIONS}
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                />
            </MyApplicationsHeader>
            <MyApplicationsStats applications={items} />

            {filtered.length === 0 ? (
                <EmptyState title="Không có đơn nào trong nhóm này" />
            ) : (
                <Stagger as="ul" className="flex flex-col gap-3">
                    {filtered.map((application) => (
                        <li key={application.applicationId}>
                            <ApplicationCard application={application} onWithdrawSuccess={handleWithdrawSuccess} />
                        </li>
                    ))}
                </Stagger>
            )}
        </div>
    );
}
