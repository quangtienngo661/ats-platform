import Link from 'next/link';
import { CompareTable } from '@/components/candidates/CompareTable';
import { compareApplicationsAction } from '@/servers/applications/applications.action';
import { SF, SFT } from '@/types/fonts/fonts';
import type { IComparisonItem } from '@/types/interfaces/evaluation.interface';

interface ComparePageProps {
    params: Promise<{ jobId: string }>;
    searchParams: Promise<{ ids?: string | string[] }>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
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
        <div className="flex h-full flex-col bg-[#F5F5F7]" style={{ fontFamily: SFT }}>
            <div className="border-b border-[#F2F2F7] bg-white px-6 py-5 lg:px-8">
                <Link
                    href={`/jobs/${jobId}/candidates`}
                    className="inline-flex min-h-11 items-center text-[13px] text-[#0071E3] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]"
                >
                    Quay lại danh sách
                </Link>
                <h1 className="mt-2 text-[22px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 700 }}>So sánh ứng viên</h1>
            </div>
            <div className="flex-1 overflow-y-auto p-6 lg:px-8">
                {error ? (
                    <p role="alert" className="rounded-2xl border border-[#FFD7D7] bg-white p-5 text-[14px] text-[#DC2626]">{error}</p>
                ) : (
                    <CompareTable items={items} jobId={jobId} />
                )}
            </div>
        </div>
    );
}
