import Link from 'next/link';
import { Video } from 'lucide-react';
import { interviewRoomPath } from '@/lib/meeting-link';
import { roomTiming, roomWindow } from '@/lib/interview-room-window';

interface JoinRoomButtonProps {
    interviewId: string;
    startAt: string;
    durationMinutes: number;
    status: string;
    /** The viewer's clock, read after mount by the parent. */
    now: Date;
}

const LABEL = 'Vào phòng phỏng vấn';
const buttonClass =
    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-colors';

function formatTime(date: Date) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

/** Entry to the built-in room: a link while it is open, a disabled button before. */
export function JoinRoomButton({ interviewId, startAt, durationMinutes, status, now }: JoinRoomButtonProps) {
    const timing = roomTiming({ startAt, durationMinutes, status }, now);
    if (timing === 'closed') return null;

    if (timing === 'not_yet') {
        const { opensAt } = roomWindow(startAt, durationMinutes);
        return (
            <span className="inline-flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    disabled
                    className={`${buttonClass} cursor-not-allowed bg-[#F5F5F7] text-[#AEAEB2]`}
                    style={{ fontWeight: 600 }}
                >
                    <Video className="h-3.5 w-3.5" aria-hidden="true" />
                    {LABEL}
                </button>
                <span className="text-[12px] text-[#6E6E73]">Phòng mở lúc {formatTime(opensAt)}</span>
            </span>
        );
    }

    return (
        <Link
            href={interviewRoomPath(interviewId)}
            className={`${buttonClass} bg-[#0071E3] text-white hover:bg-[#0062C4]`}
            style={{ fontWeight: 600 }}
        >
            <Video className="h-3.5 w-3.5" aria-hidden="true" />
            {LABEL}
        </Link>
    );
}
