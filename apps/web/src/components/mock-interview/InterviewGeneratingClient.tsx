'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonLink } from '@/components/ui';
import { TypingDots } from './ui/TypingIndicator';
import { useSocketStore } from '@/stores/useSocketStore';

interface InterviewGeneratingClientProps {
    sessionId: string;
    topicName?: string;
}

export default function InterviewGeneratingClient({
    sessionId,
    topicName,
}: InterviewGeneratingClientProps) {
    const router = useRouter();
    const socket = useSocketStore();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (socket.status !== 'connected') return;

        const handleReady = () => {
            router.refresh();
        };

        const handleFailed = (payload: { message?: string }) => {
            setErrorMessage(payload?.message || 'Không tạo được câu hỏi phỏng vấn. Thử lại.');
        };

        socket.emitEvent('interview:join_session', { sessionId });
        // `interview:question` cũng được coi là tín hiệu "đã sẵn sàng" —
        // xử lý race lúc client join sau khi generation đã hoàn tất.
        socket.onEvent<object>('interview:session_ready', handleReady);
        socket.onEvent<object>('interview:question', handleReady);
        socket.onEvent<{ message?: string }>('interview:session_failed', handleFailed);

        return () => {
            socket.offEvent<object>('interview:session_ready', handleReady);
            socket.offEvent<object>('interview:question', handleReady);
            socket.offEvent<{ message?: string }>('interview:session_failed', handleFailed);
        };
    }, [router, sessionId, socket]);

    if (errorMessage) {
        return (
            <div className="flex min-h-dvh items-center justify-center px-4 py-10">
                <div role="alert" className="w-full max-w-[440px] animate-rise text-center">
                    <h1 className="text-title text-night-ink">Không tạo được câu hỏi</h1>
                    <p className="mt-2 break-words text-body text-night-ink-2">{errorMessage}</p>
                    <ButtonLink href="/mock-interview" variant="secondary" size="lg" className="mt-6">
                        Quay lại
                    </ButtonLink>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh items-center justify-center px-4 py-10">
            <div role="status" className="w-full max-w-[440px] animate-rise text-center">
                <TypingDots className="text-night-ink-3" />
                <h1 className="mt-5 text-title text-night-ink">Đang tạo câu hỏi phỏng vấn</h1>
                <p className="mt-2 break-words text-body text-night-ink-2">
                    {topicName ? `AI đang chuẩn bị câu hỏi cho chủ đề ${topicName}.` : 'AI đang chuẩn bị câu hỏi phỏng vấn.'}
                    {' '}Trang này sẽ tự chuyển tiếp khi sẵn sàng.
                </p>
            </div>
        </div>
    );
}
