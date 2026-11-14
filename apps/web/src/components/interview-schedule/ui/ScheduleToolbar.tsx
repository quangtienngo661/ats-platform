import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button, IconButton } from '@/components/ui';

interface ScheduleToolbarProps {
    weekLabel: string;
    canGoPrevious: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onCreate: () => void;
}

export function ScheduleToolbar({ weekLabel, canGoPrevious, onPrevious, onNext, onCreate }: ScheduleToolbarProps) {
    return (
        <>
            <div className="flex items-center gap-1">
                <IconButton aria-label="Tuần trước" title="Tuần trước" onClick={onPrevious} disabled={!canGoPrevious}>
                    <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
                </IconButton>
                <span className="min-w-[8.5rem] text-center text-body-sm font-medium tabular-nums text-ink">
                    Tuần {weekLabel}
                </span>
                <IconButton aria-label="Tuần sau" title="Tuần sau" onClick={onNext}>
                    <ChevronRight aria-hidden="true" strokeWidth={1.75} />
                </IconButton>
            </div>
            <Button onClick={onCreate}>
                <Plus aria-hidden="true" strokeWidth={1.75} />
                Đặt phỏng vấn
            </Button>
        </>
    );
}
