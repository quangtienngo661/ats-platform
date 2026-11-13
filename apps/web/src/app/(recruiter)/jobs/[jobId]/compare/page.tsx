import { getUiVariant } from '@/lib/ui-variant';
import LegacyComparePage from '@/legacy/app/(recruiter)/jobs/[jobId]/compare/page';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageToolbar, Surface } from '@/components/ui';
import { CompareTable } from '@/components/candidates/CompareTable';
import { compareApplicationsAction } from '@/servers/applications/applications.action';
import type { IComparisonItem } from '@/types/interfaces/evaluation.interface';

interface ComparePageProps {
    params: Promise<{ jobId: string }>;
    searchParams: Promise<{ ids?: string | string[] }>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
    if ((await getUiVariant()) === 'legacy') return <LegacyComparePage params={params} searchParams={searchParams} />;
    const { jobId } = await params;
    const query = await searchParams;
    const ids = typeof query.ids === 'string' ? query.ids.split(',') : [];
    const valid = ids.length >= 2 && ids.length <= 4
        && ids.every(id => UUID.test(id))
        && new Set(ids.map(id => id.toLowerCase())).size === ids.length;

    let items: IComparisonItem[] = [];
    let error: string | null = null;
    if (!valid) {
        error = 'Danh sách không hợp lệ. Chọn từ 2 đến 4 ứng viên khác nhau để so sánh.';
    } else {
        try {
            items = await compareApplicationsAction(jobId, ids);
        } catch (cause) {
            error = cause instanceof Error && cause.message ? cause.message : 'Không thể tải dữ liệu. Vui lòng thử lại.';
        }
    }

    return (
        <div className="space-y-4 py-4">
            <Link
                href={`/jobs/${jobId}/candidates`}
                className="inline-flex items-center gap-1.5 text-body-sm text-ink-3 transition-colors hover:text-ink"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Quay lại danh sách
            </Link>
            <PageToolbar title="So sánh ứng viên" />
            {error ? (
                <Surface role="alert" className="p-5 text-body-sm text-danger">{error}</Surface>
            ) : (
                <CompareTable items={items} jobId={jobId} />
            )}
        </div>
    );
}
