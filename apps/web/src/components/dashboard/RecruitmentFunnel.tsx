import { SF } from '@/types/fonts/fonts';
import type { IRecruitmentAnalytics } from '@/types/interfaces/analytics.interface';

const STAGE_LABEL: Record<string, string> = {
    applied: 'Ứng tuyển',
    screening: 'Sàng lọc',
    interview: 'Phỏng vấn',
    offer: 'Offer',
    hired: 'Đã tuyển',
};
const STAGE_COLOR: Record<string, string> = {
    applied: '#64748B',
    screening: '#3B82F6',
    interview: '#6366F1',
    offer: '#34C759',
    hired: '#0071E3',
};

export function formatPercent(rate: number | null): string {
    return rate === null ? '—' : `${(Math.round(rate * 1000) / 10).toLocaleString('vi-VN')}%`;
}

interface RecruitmentFunnelProps {
    funnel: IRecruitmentAnalytics['funnel'];
    outcomes: IRecruitmentAnalytics['outcomes'];
}

/** How many applications of the period reached each stage, and the rate from the stage before (R18). */
export function RecruitmentFunnel({ funnel, outcomes }: RecruitmentFunnelProps) {
    const top = Math.max(funnel[0]?.reached ?? 0, 1);
    return (
        <section aria-labelledby="funnel-title" className="bg-white rounded-2xl p-5 border border-[#F2F2F7]">
            <h2 id="funnel-title" className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                Phễu tuyển dụng
            </h2>
            <p className="text-[12px] text-[#6E6E73] mt-0.5">Số đơn trong kỳ đã đạt từng giai đoạn</p>
            <ol className="mt-4 space-y-3">
                {funnel.map(step => (
                    <li key={step.stage} aria-label={`${STAGE_LABEL[step.stage]}: ${step.reached} đơn`}>
                        <div className="flex items-baseline justify-between text-[12px]">
                            <span className="text-[#1D1D1F]" style={{ fontWeight: 500 }}>{STAGE_LABEL[step.stage]}</span>
                            <span className="text-[#6E6E73]">
                                <span className="text-[#1D1D1F]" style={{ fontWeight: 600 }}>{step.reached}</span>
                                {step.stage !== 'applied' && <> · {formatPercent(step.conversion)} so với bước trước</>}
                            </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-[#F2F2F7]" aria-hidden="true">
                            <div
                                className="h-2 rounded-full"
                                style={{ width: `${(step.reached / top) * 100}%`, background: STAGE_COLOR[step.stage] }}
                            />
                        </div>
                    </li>
                ))}
            </ol>
            <p className="mt-4 text-[12px] text-[#6E6E73]">
                Từ chối: <span className="text-[#1D1D1F]">{outcomes.rejected}</span> · Ứng viên rút đơn:{' '}
                <span className="text-[#1D1D1F]">{outcomes.cancelled}</span>
            </p>
        </section>
    );
}

interface TimeInStageProps {
    timeInStage: IRecruitmentAnalytics['timeInStage'];
}

/** Mean days per stage over the stays that ended (R18). */
export function TimeInStage({ timeInStage }: TimeInStageProps) {
    return (
        <section aria-labelledby="stage-time-title" className="bg-white rounded-2xl p-5 border border-[#F2F2F7]">
            <h2 id="stage-time-title" className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                Thời gian ở mỗi giai đoạn
            </h2>
            <p className="text-[12px] text-[#6E6E73] mt-0.5">Số ngày trung bình, chỉ tính các lượt đã chuyển sang giai đoạn sau</p>
            <table className="mt-3 w-full text-[12px]">
                <thead>
                    <tr className="text-left text-[#6E6E73]">
                        <th scope="col" className="py-1.5 font-medium">Giai đoạn</th>
                        <th scope="col" className="py-1.5 font-medium text-right">Số ngày TB</th>
                        <th scope="col" className="py-1.5 font-medium text-right">Số lượt</th>
                    </tr>
                </thead>
                <tbody>
                    {timeInStage.map(row => (
                        <tr key={row.stage} className="border-t border-[#F2F2F7]">
                            <th scope="row" className="py-1.5 text-left text-[#1D1D1F] font-normal">{STAGE_LABEL[row.stage]}</th>
                            <td className="py-1.5 text-right text-[#1D1D1F]">
                                {row.averageDays === null ? '—' : row.averageDays.toLocaleString('vi-VN')}
                            </td>
                            <td className="py-1.5 text-right text-[#6E6E73]">{row.samples}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
