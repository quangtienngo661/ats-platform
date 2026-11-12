import { SF } from '@/types/fonts/fonts';
import type { IAiCostSummary } from '@/types/interfaces/analytics.interface';

const ACTION_LABEL: Record<string, string> = {
    cv_parsing: 'Phân tích CV',
    cv_scoring: 'Chấm CV',
    mock_interview: 'Phỏng vấn thử',
    job_parsing: 'Phân tích JD',
    embedding: 'Embedding',
    copilot: 'AI co-pilot',
};

export function formatUsd(value: number | null): string {
    if (value === null) return 'Chưa có giá';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
}

const formatCount = (value: number) => value.toLocaleString('vi-VN');

interface AiCostPanelProps {
    cost: IAiCostSummary;
}

/** AI usage of the period, priced with the admin's model prices (GĐ4 R22). */
export function AiCostPanel({ cost }: AiCostPanelProps) {
    return (
        <section aria-labelledby="ai-cost-title" className="bg-white rounded-2xl p-5 border border-[#F2F2F7] mb-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                    <h2 id="ai-cost-title" className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                        Chi phí AI
                    </h2>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">Ước tính theo giá model do quản trị viên nhập (USD)</p>
                </div>
                <p className="text-[13px] text-[#1D1D1F]">
                    Tổng: <span style={{ fontWeight: 600 }}>{formatUsd(cost.totals.estimatedCostUsd)}</span>
                    {' '}· {formatCount(cost.totals.calls)} lượt gọi
                </p>
            </div>

            {cost.modelsWithoutPrice.length > 0 && (
                <p role="status" className="mt-3 rounded-xl bg-[#FFFBEB] px-3 py-2 text-[12px] text-[#92400E]">
                    Chưa có giá cho: {cost.modelsWithoutPrice.join(', ')}. Tổng chi phí chưa tính được.
                </p>
            )}

            {cost.items.length === 0 ? (
                <p className="mt-4 text-[13px] text-[#AEAEB2]">Chưa có lượt gọi AI nào trong kỳ</p>
            ) : (
                <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-[12px]" aria-label="Chi phí AI theo tháng và tác vụ">
                        <thead>
                            <tr className="text-left text-[#6E6E73]">
                                <th scope="col" className="py-1.5 font-medium">Tháng</th>
                                <th scope="col" className="py-1.5 font-medium">Tác vụ</th>
                                <th scope="col" className="py-1.5 font-medium text-right">Lượt gọi</th>
                                <th scope="col" className="py-1.5 font-medium text-right">Token vào</th>
                                <th scope="col" className="py-1.5 font-medium text-right">Token ra</th>
                                <th scope="col" className="py-1.5 font-medium text-right">Chi phí</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cost.items.map(item => (
                                <tr key={`${item.month}-${item.actionType}`} className="border-t border-[#F2F2F7]">
                                    <td className="py-1.5 text-[#1D1D1F]">{item.month}</td>
                                    <td className="py-1.5 text-[#1D1D1F]">{ACTION_LABEL[item.actionType] ?? item.actionType}</td>
                                    <td className="py-1.5 text-right">
                                        {formatCount(item.calls)}
                                        {item.failedCalls > 0 && <span className="text-[#DC2626]"> ({item.failedCalls} lỗi)</span>}
                                    </td>
                                    <td className="py-1.5 text-right">{formatCount(item.promptTokens)}</td>
                                    <td className="py-1.5 text-right">{formatCount(item.completionTokens)}</td>
                                    <td className="py-1.5 text-right text-[#1D1D1F]">{formatUsd(item.estimatedCostUsd)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
