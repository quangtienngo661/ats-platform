import type { ReactNode } from 'react';
import Link from 'next/link';
import { AiRecommendation, ApplicationStatus, ScorecardRecommendation } from '@ats-platform/types';
import { SF, SFT } from '@/types/fonts/fonts';
import type { IComparisonItem } from '@/types/interfaces/evaluation.interface';

interface CompareTableProps {
    items: IComparisonItem[];
    jobId: string;
}

const statusLabels: Record<ApplicationStatus, string> = {
    [ApplicationStatus.applied]: 'Mới',
    [ApplicationStatus.screening]: 'Sàng lọc',
    [ApplicationStatus.interview]: 'Phỏng vấn',
    [ApplicationStatus.offer]: 'Đề nghị tuyển dụng',
    [ApplicationStatus.hired]: 'Đã tuyển',
    [ApplicationStatus.rejected]: 'Từ chối',
    [ApplicationStatus.cancelled]: 'Đã hủy',
};

const recommendationLabels: Record<ScorecardRecommendation, string> = {
    [ScorecardRecommendation.strong_no]: 'Không nên tuyển',
    [ScorecardRecommendation.no]: 'Chưa phù hợp',
    [ScorecardRecommendation.yes]: 'Nên tuyển',
    [ScorecardRecommendation.strong_yes]: 'Rất nên tuyển',
};

const aiRecommendationLabels: Record<AiRecommendation, string> = {
    [AiRecommendation.interview]: 'Mời phỏng vấn',
    [AiRecommendation.reject]: 'Từ chối',
};

function score(value: number | null | undefined, maximum: number): ReactNode {
    return value == null ? 'Chưa có' : `${value} / ${maximum}`;
}

function skills(value: unknown): string {
    if (!Array.isArray(value)) return 'Chưa có';
    const names = value.filter((item): item is string => typeof item === 'string');
    return names.length ? names.join(', ') : 'Chưa có';
}

export function CompareTable({ items, jobId }: CompareTableProps) {
    const rows: { label: string; value: (item: IComparisonItem) => ReactNode }[] = [
        { label: 'Trạng thái', value: item => statusLabels[item.status] },
        { label: 'Ngày ứng tuyển', value: item => new Date(item.appliedAt).toLocaleDateString('vi-VN') },
        { label: 'Điểm AI tổng thể (gợi ý)', value: item => score(item.screening?.overallScore, 100) },
        { label: 'Điểm kỹ năng AI (gợi ý)', value: item => score(item.screening?.skillsScore, 100) },
        { label: 'Điểm kinh nghiệm AI (gợi ý)', value: item => score(item.screening?.experienceScore, 100) },
        { label: 'Điểm học vấn AI (gợi ý)', value: item => score(item.screening?.educationScore, 100) },
        {
            label: 'Khuyến nghị AI (gợi ý)',
            value: item => item.screening?.aiRecommendation
                ? aiRecommendationLabels[item.screening.aiRecommendation]
                : 'Chưa có',
        },
        { label: 'Kỹ năng phù hợp', value: item => skills(item.screening?.matchedSkills) },
        { label: 'Kỹ năng còn thiếu', value: item => skills(item.screening?.missingSkills) },
        { label: 'Số đánh giá phỏng vấn', value: item => item.scorecards.count },
        { label: 'Kỹ năng chuyên môn (trung bình)', value: item => score(item.scorecards.average.technicalSkills, 5) },
        { label: 'Giải quyết vấn đề (trung bình)', value: item => score(item.scorecards.average.problemSolving, 5) },
        { label: 'Giao tiếp (trung bình)', value: item => score(item.scorecards.average.communication, 5) },
        { label: 'Phù hợp văn hoá (trung bình)', value: item => score(item.scorecards.average.cultureFit, 5) },
        {
            label: 'Khuyến nghị của người phỏng vấn',
            value: item => item.scorecards.recommendations.length ? (
                <ul className="space-y-2">
                    {item.scorecards.recommendations.map((recommendation, index) => (
                        <li key={index}>
                            <span className="font-medium">{recommendation.interviewerName}</span>
                            {': '}{recommendationLabels[recommendation.recommendation]}
                        </li>
                    ))}
                </ul>
            ) : 'Chưa có',
        },
        { label: 'Số ghi chú', value: item => item.noteCount },
    ];

    return (
        <div className="overflow-hidden rounded-2xl border border-[#F2F2F7] bg-white" style={{ fontFamily: SFT }}>
            <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left" style={{ minWidth: 224 * (items.length + 1) }}>
                    <caption className="sr-only">So sánh thông tin và đánh giá ứng viên</caption>
                    <thead>
                        <tr className="border-b border-[#F2F2F7] bg-[#FAFAFA]">
                            <th scope="col" className="w-56 px-6 py-4 text-[13px] font-semibold text-[#6E6E73]">Tiêu chí</th>
                            {items.map(item => (
                                <th key={item.applicationId} scope="col" className="px-6 py-4 text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                                    <Link
                                        href={`/jobs/${jobId}/candidates/${item.applicationId}`}
                                        className="text-[#0071E3] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]"
                                    >
                                        {item.candidateName}
                                    </Link>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.label} className="border-b border-[#F2F2F7] last:border-0">
                                <th scope="row" className="px-6 py-4 text-[13px] font-medium text-[#6E6E73]">{row.label}</th>
                                {items.map(item => (
                                    <td key={item.applicationId} className="break-words px-6 py-4 align-top text-[13px] text-[#1D1D1F]">
                                        {row.value(item)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
