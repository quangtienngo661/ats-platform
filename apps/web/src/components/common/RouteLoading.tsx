export default function RouteLoading() {
    return (
        <div role="status" aria-live="polite" className="flex min-h-[240px] items-center justify-center gap-3 text-[14px] text-[#6E6E73]">
            <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#0071E3]" />
            Đang tải…
        </div>
    );
}
