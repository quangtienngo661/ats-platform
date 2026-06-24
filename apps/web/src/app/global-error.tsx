'use client';

export const dynamic = 'force-dynamic';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-6">
          <section className="w-full max-w-[420px] rounded-2xl border border-[#E5E5EA] bg-white p-6 text-center shadow-sm">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#FF3B30]">
              System error
            </p>
            <h1 className="mt-2 text-[22px] font-bold text-[#1D1D1F]">
              Khong the hien thi trang
            </h1>
            <p className="mt-2 text-[14px] leading-6 text-[#6E6E73]">
              He thong dang gap loi tam thoi. Vui long thu lai.
            </p>
            {error.digest && (
              <p className="mt-3 text-[11px] text-[#AEAEB2]">Digest: {error.digest}</p>
            )}
            <button
              type="button"
              onClick={reset}
              className="mt-5 rounded-xl bg-[#0071E3] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0077ED]"
            >
              Thu lai
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
