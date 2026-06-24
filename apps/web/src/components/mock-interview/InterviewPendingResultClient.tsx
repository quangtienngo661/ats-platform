'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
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
        const interval = window.setInterval(async () => {
            const result = await getInterviewResultAction(sessionId);
            if (result?.session) {
                router.refresh();
            }
        }, 5000);

        return () => window.clearInterval(interval);
    }, [router, sessionId]);

    return (
        <div className="h-full min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#F5F5F7] px-6" style={{ fontFamily: SFT }}>
            <div className="w-full max-w-[460px] bg-white rounded-2xl border border-[#E5E5EA] p-8 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#EBF3FD] flex items-center justify-center mx-auto mb-4">
                    <LoaderCircle className="w-7 h-7 text-[#0071E3] animate-spin" />
                </div>
                <h1 className="text-[20px] text-[#1D1D1F] mb-2" style={{ fontFamily: SF, fontWeight: 700 }}>
                    Đang tổng hợp kết quả
                </h1>
                <p className="text-[13px] text-[#6E6E73] leading-relaxed">
                    {topicName ? `${topicName} đang được chấm điểm.` : 'Bài phỏng vấn đang được chấm điểm.'}
                    {' '}Trang này sẽ tự cập nhật khi kết quả sẵn sàng.
                </p>
            </div>
        </div>
    );
}
