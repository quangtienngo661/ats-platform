import type { ReactNode } from 'react';
import Link from 'next/link';
import { AiRecommendation, ApplicationStatus, ScorecardRecommendation } from '@ats-platform/types';
import { Surface } from '@/components/ui';
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
        // The API sends the reviewer's scores once a screening is reviewed, the AI's otherwise.
        { label: 'Điểm tổng thể', value: item => score(item.screening?.overallScore, 100) },
        { label: 'Điểm kỹ năng', value: item => score(item.screening?.skillsScore, 100) },
        { label: 'Điểm kinh nghiệm', value: item => score(item.screening?.experienceScore, 100) },
        { label: 'Điểm học vấn', value: item => score(item.screening?.educationScore, 100) },
        {
            label: 'Duyệt điểm',
            value: item => item.screening ? (item.screening.isReviewed ? 'Đã duyệt' : 'Chưa duyệt') : 'Chưa có',
        },
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
        <Surface className="overflow-hidden">
            <div className="overflow-x-auto">
                {/* Separate borders: a collapsed border belongs to the table and would not travel with the sticky column. */}
                <table className="w-full table-fixed border-separate border-spacing-0 text-left" style={{ minWidth: 224 * (items.length + 1) }}>
                    <caption className="sr-only">So sánh thông tin và đánh giá ứng viên</caption>
                    <thead>
                        <tr>
                            <th scope="col" className="sticky left-0 z-sticky w-56 border-b border-r border-line bg-surface-2 px-4 py-3 text-caption font-medium text-ink-3">Tiêu chí</th>
                            {items.map(item => (
                                <th key={item.applicationId} scope="col" className="break-words border-b border-line bg-surface-2 px-4 py-3 text-body-sm font-semibold text-ink">
                                    <Link
                                        href={`/jobs/${jobId}/candidates/${item.applicationId}`}
                                        className="rounded-ctl text-accent-text hover:underline"
                                    >
                                        {item.candidateName}
                                    </Link>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.label} className="group">
                                <th scope="row" className="sticky left-0 z-sticky border-b border-r border-line bg-surface px-4 py-3 text-caption font-medium text-ink-3 group-last:border-b-0">{row.label}</th>
                                {items.map(item => (
                                    <td key={item.applicationId} className="break-words border-b border-line px-4 py-3 align-top text-body-sm tabular-nums text-ink group-last:border-b-0">
                                        {row.value(item)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Surface>
    );
}
