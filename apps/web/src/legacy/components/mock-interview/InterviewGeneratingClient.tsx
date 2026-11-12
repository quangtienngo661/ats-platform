'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
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
            setErrorMessage(payload?.message || 'Không thể tạo câu hỏi phỏng vấn. Vui lòng thử lại.');
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
            <div className="h-full min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#F5F5F7] px-6" style={{ fontFamily: SFT }}>
                <div className="w-full max-w-[460px] bg-white rounded-2xl border border-[#E5E5EA] p-8 text-center shadow-sm">
                    <h1 className="text-[20px] text-[#1D1D1F] mb-2" style={{ fontFamily: SF, fontWeight: 700 }}>
                        Đã xảy ra lỗi
                    </h1>
                    <p className="text-[13px] text-[#6E6E73] leading-relaxed mb-6">
                        {errorMessage}
                    </p>
                    <button
                        onClick={() => router.push('/mock-interview')}
                        className="px-5 py-2.5 rounded-xl bg-[#0071E3] text-white text-[13px]"
                        style={{ fontFamily: SF, fontWeight: 600 }}
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#F5F5F7] px-6" style={{ fontFamily: SFT }}>
            <div className="w-full max-w-[460px] bg-white rounded-2xl border border-[#E5E5EA] p-8 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#EBF3FD] flex items-center justify-center mx-auto mb-4">
                    <LoaderCircle className="w-7 h-7 text-[#0071E3] animate-spin" />
                </div>
                <h1 className="text-[20px] text-[#1D1D1F] mb-2" style={{ fontFamily: SF, fontWeight: 700 }}>
                    Đang tạo câu hỏi phỏng vấn
                </h1>
                <p className="text-[13px] text-[#6E6E73] leading-relaxed">
                    {topicName ? `AI đang chuẩn bị câu hỏi cho chủ đề ${topicName}.` : 'AI đang chuẩn bị câu hỏi phỏng vấn.'}
                    {' '}Trang này sẽ tự chuyển tiếp khi sẵn sàng.
                </p>
            </div>
        </div>
    );
}
