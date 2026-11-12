'use client';

import { useEffect, useRef } from 'react';
import { useSocketStore } from '@/stores/useSocketStore';

/**
 * Listens to a waiting-room event of ONE interview. The API sends it to the person's own
 * Socket.IO room (`user_<id>`), so events of their other interviews arrive too and are
 * ignored here.
 */
export function useInterviewRoomEvent<T extends { interviewId: string }>(
    eventName: string,
    interviewId: string,
    handler: (payload: T) => void,
): void {
    const { status, onEvent, offEvent } = useSocketStore();
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(() => {
        if (status !== 'connected') return;

        const listener = (payload: T) => {
            if (payload?.interviewId === interviewId) handlerRef.current(payload);
        };
        onEvent(eventName, listener);
        return () => offEvent(eventName, listener);
    }, [status, onEvent, offEvent, eventName, interviewId]);
}
