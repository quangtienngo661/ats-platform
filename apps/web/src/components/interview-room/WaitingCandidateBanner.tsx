'use client';

import { useEffect, useState } from 'react';
import {
    admitCandidateAction,
    joinInterviewRoomAction,
} from '@/servers/interviews/interview-room.action';
import type {
    IRoomWaitingEvent,
    IWaitingCandidate,
} from '@/types/interfaces/interview-room.interface';
import { formatRoomTime } from './room-time';
import { useInterviewRoomEvent } from './useInterviewRoomEvent';

interface WaitingCandidateBannerProps {
    interviewId: string;
    initial: IWaitingCandidate | null;
}

/** How often the interviewer's page asks who is waiting, in case the socket missed it. */
const RECHECK_MS = 20_000;

/** The interviewer's side of the waiting room (R27): who is waiting, and "Cho vào". */
export function WaitingCandidateBanner({ interviewId, initial }: WaitingCandidateBannerProps) {
    const [candidate, setCandidate] = useState<IWaitingCandidate | null>(initial);
    const [admitting, setAdmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useInterviewRoomEvent<IRoomWaitingEvent>('interview-room:waiting', interviewId, (event) =>
        setCandidate({ name: event.candidateName, since: event.since }),
    );
    // Admitted here, in another tab, or by the other staff member in the interview.
    useInterviewRoomEvent('interview-room:admitted', interviewId, () => setCandidate(null));

    useEffect(() => {
        const timer = setInterval(async () => {
            const result = await joinInterviewRoomAction(interviewId);
            if (result.ok && result.room.status === 'admitted') setCandidate(result.room.waitingCandidate);
        }, RECHECK_MS);
        return () => clearInterval(timer);
    }, [interviewId]);

    if (!candidate) return null;

    const admit = async () => {
        setAdmitting(true);
        setError(null);
        const result = await admitCandidateAction(interviewId);
        setAdmitting(false);
        if (result.ok) setCandidate(null);
        else setError(result.message);
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0071E3] px-4 py-2.5 text-white">
            <div>
                <p className="text-[13px]" style={{ fontWeight: 600 }}>
                    {candidate.name} đang chờ từ {formatRoomTime(candidate.since)}
                </p>
                {error && (
                    <p role="alert" className="text-[12px] text-white/90">
                        {error}
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={admit}
                disabled={admitting}
                className="rounded-lg bg-white px-3 py-1.5 text-[13px] text-[#0071E3] hover:bg-white/90 disabled:opacity-60"
                style={{ fontWeight: 600 }}
            >
                Cho vào
            </button>
        </div>
    );
}
