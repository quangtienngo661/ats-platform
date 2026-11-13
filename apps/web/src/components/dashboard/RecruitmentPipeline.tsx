import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Surface } from '@/components/ui';
import { stages } from '@/types/constants/kanban.constants';

interface PipelineItem {
    stage: string;
    count: number;
    color: string; // from dashboard.utils; the redesigned pipeline ignores it and uses accent tones
}

interface RecruitmentPipelineProps {
    data: PipelineItem[];
    maxCount: number;
}

// buildPipelineData labels each stage in Vietnamese; map it back to the Kanban stage so the wording stays shared.
const STAGE_LABEL_BY_ID = new Map<string, string>(stages.map((st) => [st.id, st.label]));
const ID_BY_STAGE_LABEL: Record<string, string> = {
    'Ứng tuyển': 'applied',
    'Sàng lọc': 'screening',
    'Phỏng vấn': 'interview',
    Offer: 'offer',
    'Đã tuyển': 'hired',
};

// Later stages get a stronger accent; literal classes so Tailwind keeps them.
const TONES = ['bg-accent/30', 'bg-accent/45', 'bg-accent/60', 'bg-accent/80', 'bg-accent'];

export default function RecruitmentPipeline({ data, maxCount }: RecruitmentPipelineProps) {
    const empty = data.every((d) => d.count === 0);
    return (
        <Surface className="flex h-full flex-col p-5">
            <h2 className="text-title-sm text-ink">Phễu tuyển dụng</h2>
            <p className="mt-0.5 text-caption text-ink-3">Ứng viên theo giai đoạn</p>
            {empty ? (
                <p className="py-10 text-center text-body-sm text-ink-3">Chưa có dữ liệu</p>
            ) : (
                <ul aria-label="Ứng viên theo giai đoạn" className="mt-5 flex flex-col gap-4">
                    {data.map(({ stage, count }, i) => {
                        const label = STAGE_LABEL_BY_ID.get(ID_BY_STAGE_LABEL[stage]) ?? stage;
                        const ratio = maxCount > 0 ? Math.min(1, count / maxCount) : 0;
                        return (
                            <li key={stage}>
                                <div className="mb-1.5 flex items-center justify-between text-body-sm">
                                    <span className="text-ink-2">{label}</span>
                                    <span className="tabular-nums text-ink">{count}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                                    <div
                                        data-testid="pipeline-bar"
                                        className={`h-full origin-left rounded-full transition-transform duration-500 ease-out ${TONES[Math.min(i, TONES.length - 1)]}`}
                                        style={{ transform: `scaleX(${ratio})` }}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
            <Link
                href="/jobs"
                className="mt-auto inline-flex items-center gap-1.5 pt-5 text-body-sm font-medium text-accent-text hover:underline"
            >
                Xem tin tuyển dụng <ArrowRight size={14} aria-hidden="true" />
            </Link>
        </Surface>
    );
}
