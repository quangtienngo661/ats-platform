'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TypingDots } from './ui/TypingIndicator';
import { useSocketStore } from '@/stores/useSocketStore';
import { getInterviewResultAction } from '@/servers/interviews/interviews.action';
import { IInterviewResult } from '@/types/interfaces/interview.interface';

interface InterviewPendingResultClientProps {
    sessionId: string;
    topicName?: string;
}

export default function InterviewPendingResultClient({
    sessionId,
    topicName,
}: InterviewPendingResultClientProps) {
    const router = useRouter();
    const [pollFailed, setPollFailed] = useState(false);
    const socket = useSocketStore();

    useEffect(() => {
        if (socket.status !== 'connected') return;

        const handleCompleted = (_result: IInterviewResult) => {
            router.refresh();
        };

        socket.emitEvent('interview:join_session', { sessionId });
        socket.onEvent<IInterviewResult>('interview:session_completed', handleCompleted);

        return () => {
            socket.offEvent<IInterviewResult>('interview:session_completed', handleCompleted);
        };
    }, [router, sessionId, socket]);

    useEffect(() => {
        let active = true;
        let running = false;
        const interval = window.setInterval(async () => {
            if (running) return;
            running = true;
            try {
                const result = await getInterviewResultAction(sessionId);
                if (!active) return;
                setPollFailed(false);
                if (result?.session) router.refresh();
            } catch {
                if (active) setPollFailed(true);
            } finally { running = false; }
        }, 5000);
        return () => { active = false; window.clearInterval(interval); };
    }, [router, sessionId]);

    return (
        <div className="flex min-h-dvh items-center justify-center px-4 py-10">
            <div className="w-full max-w-[440px] animate-rise text-center">
                <div role="status">
                    <TypingDots className="text-night-ink-3" />
                    <h1 className="mt-5 text-title text-night-ink">Đang tổng hợp kết quả</h1>
                    <p className="mt-2 break-words text-body text-night-ink-2">
                        {topicName ? `${topicName} đang được chấm điểm.` : 'Bài phỏng vấn đang được chấm điểm.'}
                        {' '}Trang này sẽ tự cập nhật khi kết quả sẵn sàng.
                    </p>
                </div>
                {pollFailed && (
                    <p role="alert" className="mt-4 text-body-sm text-night-ink">
                        Không cập nhật được kết quả. Đang thử lại…
                    </p>
                )}
            </div>
        </div>
    );
}
