'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { joinInterviewRoomAction } from '@/servers/interviews/interview-room.action';
import type {
    IInterviewRoomJoin,
    IRoomAdmittedEvent,
} from '@/types/interfaces/interview-room.interface';
import { InterviewRoomClient } from './InterviewRoomClient';
import { RoomUnavailable } from './RoomUnavailable';
import { WaitingRoom } from './WaitingRoom';
import { useInterviewRoomEvent } from './useInterviewRoomEvent';

/** How often a waiting candidate asks again, in case the socket missed the admission. */
const RECHECK_MS = 20_000;

interface InterviewRoomGateProps {
    interviewId: string;
    initial: IInterviewRoomJoin;
    backHref: string;
}

/**
 * Decides what the person sees: the waiting room until the interviewer lets the candidate
 * in (decision D13), then the room itself. The API decides; this only asks again when told
 * the candidate was admitted, every 20 seconds, or on request.
 */
export function InterviewRoomGate({ interviewId, initial, backHref }: InterviewRoomGateProps) {
    const [room, setRoom] = useState<IInterviewRoomJoin>(initial);
    const [refusal, setRefusal] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const inFlight = useRef(false);
    const waiting = room.status === 'waiting' && !refusal;

    const checkAgain = useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        setChecking(true);
        try {
            const result = await joinInterviewRoomAction(interviewId);
            if (result.ok) setRoom(result.room);
            else setRefusal(result.message);
        } finally {
            inFlight.current = false;
            setChecking(false);
        }
    }, [interviewId]);

    useInterviewRoomEvent<IRoomAdmittedEvent>('interview-room:admitted', interviewId, () => {
        if (waiting) void checkAgain();
    });

    useEffect(() => {
        if (!waiting) return;
        const timer = setInterval(() => void checkAgain(), RECHECK_MS);
        return () => clearInterval(timer);
    }, [waiting, checkAgain]);

    if (refusal) return <RoomUnavailable message={refusal} backHref={backHref} />;
    if (room.status === 'waiting') {
        return <WaitingRoom waiting={room} backHref={backHref} checking={checking} onCheckAgain={checkAgain} />;
    }
    return <InterviewRoomClient interviewId={interviewId} access={room} backHref={backHref} />;
}
