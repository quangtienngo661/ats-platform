'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { IPaginationMeta } from '@ats-platform/types';

/** Page numbers around the current one, with "…" where a run is skipped. */
function pageItems(current: number, total: number): (number | '...')[] {
    return Array.from({ length: total }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === total || Math.abs(p - current) <= 1)
        .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);
}

/** Page controls from the server's pagination. Shown under the table and under every empty state. */
export function AiUsageLogsPagination({ pagination }: { pagination: IPaginationMeta }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { page, limit, total, totalPages } = pagination;
    if (totalPages <= 1) return null;

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);
    // A page past the end has no neighbour inside the range: step back into it.
    const lastShown = Math.min(page, totalPages);

    const goToPage = (targetPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(targetPage));
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption tabular-nums text-ink-3">
                {page > totalPages ? `${total} bản ghi` : `${startItem}–${endItem} / ${total} bản ghi`}
            </p>
            <nav aria-label="Phân trang nhật ký AI" className="flex items-center gap-1">
                <IconButton size="sm" aria-label="Trước" disabled={page === 1} onClick={() => goToPage(Math.min(page - 1, totalPages))}>
                    <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
                </IconButton>
                {pageItems(lastShown, totalPages).map((p, i) =>
                    p === '...' ? (
                        <span key={`ellipsis-${i}`} aria-hidden="true" className="px-1 text-caption text-ink-3">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            aria-label={`Trang ${p}`}
                            aria-current={page === p ? 'page' : undefined}
                            onClick={() => goToPage(p)}
                            className={cn(
                                'inline-flex size-8 items-center justify-center rounded-ctl text-caption tabular-nums',
                                'transition duration-press ease-out-expo active:scale-[.97]',
                                page === p ? 'bg-ink text-surface' : 'text-ink-2 hover:bg-ink/5 hover:text-ink',
                            )}
                        >
                            {p}
                        </button>
                    ),
                )}
                <IconButton size="sm" aria-label="Tiếp" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                    <ChevronRight aria-hidden="true" strokeWidth={1.75} />
                </IconButton>
            </nav>
        </div>
    );
}
