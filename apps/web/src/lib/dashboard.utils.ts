import { IApplicationDto } from '@/types/interfaces/application.interface';

export function buildApplicationsTrend(apps: IApplicationDto[]): { month: string; value: number }[] {
    const monthCounts: Record<string, number> = {};
    const now = new Date();

    // Khởi tạo 6 tháng gần nhất với giá trị 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `T${d.getMonth() + 1}`;
        monthCounts[key] = 0;
    }

    apps.forEach(app => {
        if (!app.appliedAt) return;
        const d = new Date(app.appliedAt);
        const key = `T${d.getMonth() + 1}`;
        if (key in monthCounts) monthCounts[key]++;
    });

    return Object.entries(monthCounts).map(([month, value]) => ({ month, value }));
}

export function buildPipelineData(apps: IApplicationDto[]) {
    const stageMap: Record<string, { label: string; color: string }> = {
        applied:   { label: 'Ứng tuyển', color: '#94A3B8' },
        screening: { label: 'Sàng lọc',  color: '#3B82F6' },
        interview: { label: 'Phỏng vấn', color: '#6366F1' },
        offer:     { label: 'Offer',      color: '#34C759' },
        hired:     { label: 'Đã tuyển',  color: '#0071E3' },
    };

    const counts: Record<string, number> = {
        applied: 0, screening: 0, interview: 0, offer: 0, hired: 0,
    };

    apps.forEach(app => {
        const s = app.status?.toLowerCase();
        if (s && s in counts) counts[s]++;
    });

    return Object.entries(counts).map(([key, count]) => ({
        stage: stageMap[key]?.label ?? key,
        count,
        color: stageMap[key]?.color ?? '#94A3B8',
    }));
}
