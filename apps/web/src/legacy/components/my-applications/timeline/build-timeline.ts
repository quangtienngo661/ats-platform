import type { IApplicationHistoryItem } from '@/types/interfaces/application.interface';

export interface TimelineStep {
    key: string;
    status: string;
    label: string;
    at: string;
    isCurrent: boolean;
    isRevert: boolean;
    rejectionReason?: string;
}

export const TIMELINE_LABELS: Record<string, string> = {
    applied: 'Đã nộp đơn',
    screening: 'Đang sàng lọc',
    interview: 'Vòng phỏng vấn',
    offer: 'Nhận offer',
    hired: 'Được tuyển',
    rejected: 'Bị từ chối',
    cancelled: 'Đã rút đơn',
};

const PIPELINE = ['applied', 'screening', 'interview', 'offer', 'hired'];

function isStepBack(fromStatus: string | null, toStatus: string): boolean {
    if (!fromStatus) return false;
    if (fromStatus === 'rejected' || fromStatus === 'cancelled') return true;
    const from = PIPELINE.indexOf(fromStatus);
    const to = PIPELINE.indexOf(toStatus);
    return from >= 0 && to >= 0 && to < from;
}

/**
 * The steps a candidate reads, oldest first (stable for equal times). An older
 * application whose first "applied" row is missing gets one built from `appliedAt`
 * (E13). The last step is the current one.
 */
export function buildTimeline(
    history: IApplicationHistoryItem[],
    application: { status: string; appliedAt?: string },
): TimelineStep[] {
    const sorted = [...history].sort(
        (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
    );
    const steps: TimelineStep[] = sorted.map((item) => ({
        key: item.id,
        status: item.toStatus,
        label: TIMELINE_LABELS[item.toStatus] ?? item.toStatus,
        at: item.changedAt,
        isCurrent: false,
        isRevert: isStepBack(item.fromStatus, item.toStatus),
        ...(item.rejectionReason ? { rejectionReason: item.rejectionReason } : {}),
    }));

    if (application.appliedAt && !history.some((item) => item.fromStatus === null)) {
        steps.unshift({
            key: 'applied',
            status: 'applied',
            label: TIMELINE_LABELS.applied,
            at: application.appliedAt,
            isCurrent: false,
            isRevert: false,
        });
    }

    if (steps.length > 0) steps[steps.length - 1].isCurrent = true;
    return steps;
}
