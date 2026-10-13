/** How a candidate sees an application's status: label and badge colours. */
export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    applied: { label: 'Đã nộp', color: '#0071E3', bg: '#EBF3FD' },
    screening: { label: 'Sàng lọc AI', color: '#0EA5E9', bg: '#F0F9FF' },
    interview: { label: 'Phỏng vấn', color: '#6366F1', bg: '#F5F3FF' },
    offer: { label: 'Offer', color: '#34C759', bg: '#E8F5E9' },
    hired: { label: 'Được tuyển', color: '#16A34A', bg: '#DCFCE7' },
    rejected: { label: 'Từ chối', color: '#DC2626', bg: '#FEF2F2' },
    cancelled: { label: 'Đã rút', color: '#6E6E73', bg: '#F5F5F7' },
};
