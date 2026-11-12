'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    return (
        <div role="alert" className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-[15px] font-semibold text-[#1D1D1F]">Không thể tải dữ liệu</p>
            <p className="text-[13px] text-[#6E6E73]">Vui lòng thử lại sau.</p>
            <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => { router.refresh(); reset(); })}
                className="rounded-xl bg-[#0071E3] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0077ED] disabled:opacity-50"
            >
                {pending ? 'Đang tải…' : 'Thử lại'}
            </button>
        </div>
    );
}
