'use client';

import { useSocketStore } from "@/stores/useSocketStore";
import { useEffect } from "react";

export function InitSocketRoom({ userId, jobId }: { userId?: string, jobId?: string }) {
    const { emitEvent, status } = useSocketStore();

    useEffect(() => {
        if (status !== 'connected') return;

        if (jobId && !userId) emitEvent('join_job_room', { jobId: jobId });

        return () => {
            if (jobId && !userId) emitEvent('leave_job_room', { jobId: jobId });
        }
    }, [userId, jobId, emitEvent, status]);

    return null;
}

