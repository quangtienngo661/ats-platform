import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface ScheduleToolbarProps {
    canGoPrevious: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onCreate: () => void;
}

export function ScheduleToolbar({ canGoPrevious, onPrevious, onNext, onCreate }: ScheduleToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E5EA] text-[#6E6E73] transition-colors hover:bg-[#F5F5F7] disabled:cursor-not-allowed disabled:opacity-40"
                title="Tuần trước"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={onNext}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E5EA] text-[#6E6E73] transition-colors hover:bg-[#F5F5F7]"
                title="Tuần sau"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={onCreate}
                className="ml-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0071E3] px-4 py-2.5 text-[13px] text-white shadow-sm transition-colors hover:bg-[#0077ED]"
                style={{ fontWeight: 700 }}
            >
                <Plus className="h-4 w-4" />
                Đặt phỏng vấn
            </button>
        </div>
    );
}