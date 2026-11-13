'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DifficultyLevel } from '@ats-platform/types';
import { cn } from '@/components/ui/cn';
import { ChatBubble } from './ui/ChatBubble';
import { AnswerInput } from './ui/AnswerInput';
import { SessionSidebar, questionProgress } from './ui/SessionSidebar';
import { TypingIndicator } from './ui/TypingIndicator';
import { useSocketStore } from '@/stores/useSocketStore';
import { useInterviewChatStore } from '@/stores/useInterviewChatStore';
import { IInterviewQnA } from '@/types/interfaces/interview.interface';
import { abandonInterviewSessionAction } from '@/servers/interviews/interviews.action';
import { ConfirmModal } from '@/components/common/ConfirmModal';

// The shared Button/IconButton ghost looks are tuned for light surfaces; these are their night-surface twins.
const NIGHT_PRESS = 'transition duration-press ease-out-expo active:scale-[.97]';
const NIGHT_ICON_BUTTON = cn(
    'inline-flex size-9 shrink-0 items-center justify-center rounded-ctl text-night-ink-2',
    'hover:bg-night-2 hover:text-night-ink',
    NIGHT_PRESS,
);
const NIGHT_TEXT_BUTTON = cn(
    'inline-flex h-8 shrink-0 items-center rounded-ctl border border-night-line px-3 text-body-sm font-medium',
    'text-night-ink-2 hover:bg-night-2 hover:text-night-ink',
    NIGHT_PRESS,
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
    id: string;
    role: 'ai' | 'candidate';
    content: string;
    type: 'question' | 'answer' | 'followup' | 'followup_answer' | 'system';
    questionIndex?: number;
}

interface InterviewChatClientProps {
    sessionId: string;
    topicName: string;
    category: string;
    difficulty: DifficultyLevel;
    totalQuestions: number;
    initialQuestion: IInterviewQnA;
    historyQnAs?: IInterviewQnA[];
}

export interface FollowupQuestionData {
    qnaId: string;
    followupQuestion: string;
}

export interface CurrentQuestionData {
    qnaId: string;
    orderIndex: number;
    questionText: string;
}

export interface PendingResultData {
    status: 'pending_result';
    message: string;
}

export interface InterviewErrorData {
    message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// [Lỗi #5 Fix] Tách hàm ra ngoài component. Logic isResumedFollowup được
// kiểm tra chính xác: câu hiện tại có hasFollowup=true, đã có followupQuestion
// nhưng chưa có followupAnswer — thay vì dùng biến followUp = true không chính xác.
const rebuildChatHistory = (
    historyQnAs: IInterviewQnA[],
    topicName: string,
    totalQuestions: number,
    initialQuestion: IInterviewQnA,
): { builtHistory: ChatMessage[]; isResumedFollowup: boolean } => {
    // 1. Session mới tinh
    if (historyQnAs.length === 0) {
        return {
            builtHistory: [
                {
                    id: 'welcome',
                    role: 'ai',
                    content: `Chào bạn. Phiên này có ${totalQuestions} câu hỏi về ${topicName}.`,
                    type: 'system',
                },
                {
                    id: `q-${initialQuestion.qnaId}`,
                    role: 'ai',
                    content: initialQuestion.questionText,
                    type: 'question',
                    questionIndex: 1,
                },
            ],
            isResumedFollowup: false,
        };
    }

    // 2. Session Resume — dựng lại lịch sử
    const builtHistory: ChatMessage[] = [];
    builtHistory.push({
        id: 'resume',
        role: 'ai',
        content: `Chào mừng bạn quay lại. Tiếp tục phỏng vấn về ${topicName}.`,
        type: 'system',
    });

    historyQnAs.forEach((qna) => {
        if (qna.orderIndex > initialQuestion.orderIndex) return;

        builtHistory.push({
            id: `q-${qna.qnaId}`,
            role: 'ai',
            content: qna.questionText,
            type: 'question',
            questionIndex: qna.orderIndex,
        });

        if (qna.answerText) {
            builtHistory.push({ id: `a-${qna.qnaId}`, role: 'candidate', content: qna.answerText, type: 'answer' });

            if (qna.followupQuestion) {
                builtHistory.push({ id: `fq-${qna.qnaId}`, role: 'ai', content: qna.followupQuestion, type: 'followup' });
            }
            if (qna.followupAnswer) {
                builtHistory.push({ id: `fa-${qna.qnaId}`, role: 'candidate', content: qna.followupAnswer, type: 'followup_answer' });
            }
        }
    });

    const currentQna = historyQnAs.find((q) => q.qnaId === initialQuestion.qnaId);
    const isResumedFollowup = !!(
        currentQna?.hasFollowup &&
        currentQna?.followupQuestion &&
        !currentQna?.followupAnswer
    );

    return { builtHistory, isResumedFollowup };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function InterviewChatClient({
    sessionId,
    topicName,
    category,
    difficulty,
    totalQuestions,
    initialQuestion,
    historyQnAs = [],
}: InterviewChatClientProps) {
    const { builtHistory, isResumedFollowup } = rebuildChatHistory(historyQnAs, topicName, totalQuestions, initialQuestion);

    const [messages, setMessages] = useState<ChatMessage[]>(builtHistory);
    // [Lỗi #2 Fix] Khởi tạo từ initialQuestion.orderIndex, không hardcode = 1
    const [currentIndex, setCurrentIndex] = useState(initialQuestion.orderIndex ?? 1);
    const [isAiThinking, setIsAiThinking] = useState(false);
    // [Lỗi #5 Fix] Dùng isResumedFollowup thay vì logic followUp cũ sai
    const [isFollowup, setIsFollowup] = useState(isResumedFollowup);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
    const [isAbandoning, setIsAbandoning] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    // Messages rebuilt on load are already on screen; only turns added afterwards rise in.
    const initialMessageIds = useRef(new Set(builtHistory.map((message) => message.id)));
    const router = useRouter();

    const socket = useSocketStore();
    const currentQuestion = useInterviewChatStore((state) => state.currentQuestion);
    const setCurrentQuestion = useInterviewChatStore((state) => state.setCurrentQuestion);

    useEffect(() => {
        if (socket.status !== 'connected') return;

        socket.emitEvent('interview:join_session', { sessionId });
    }, [socket, sessionId]);

    const handleAbandon = () => {
        setShowAbandonConfirm(true);
    };

    const handleConfirmAbandon = async () => {
        setIsAbandoning(true);
        const success = await abandonInterviewSessionAction(sessionId);
        if (success) {
            router.push('/mock-interview');
        } else {
            setIsAbandoning(false);
        }
    };

    // Auto-scroll to the latest turn; jump instead of glide when the OS asks for reduced motion.
    useEffect(() => {
        const reduce =
            typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        chatEndRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }, [messages, isAiThinking]);

    // [Lỗi #3 Fix] Khai báo TRƯỚC useEffect socket để tránh ReferenceError.
    // Bọc bằng useCallback([currentIndex]) để mỗi khi currentIndex thay đổi,
    // useEffect socket sẽ re-subscribe với phiên bản mới nhất (tránh Stale Closure).
    const goToNextQuestion = useCallback(
        (options?: { isFollowUp?: boolean; followupQuestion?: string; nextQuestionText?: string }) => {
            const nextIndex = currentIndex + 1;

            if (options?.isFollowUp && options?.followupQuestion) {
                setIsFollowup(true);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `fu-${Date.now()}`,
                        role: 'ai',
                        content: options.followupQuestion ?? "",
                        type: 'followup',
                    },
                ]);
                return;
            }

            setCurrentIndex(nextIndex);
            setMessages((prev) => [
                ...prev,
                {
                    id: `q-${Date.now()}`,
                    role: 'ai',
                    content: options?.nextQuestionText ?? '',
                    type: 'question',
                    questionIndex: nextIndex,
                },
            ]);
        },
        [currentIndex],
    );

    // [Lỗi #3 Fix] goToNextQuestion trong dependency array — luôn dùng bản mới nhất
    // [Lỗi #4 Fix] Lắng nghe đủ 4 events: followup, next question, generating, completed
    useEffect(() => {
        if (socket.status !== 'connected') return;

        const handleUpdateFollowUpQuestion = ({ qnaId, followupQuestion }: FollowupQuestionData) => {
            setCurrentQuestion(qnaId, 0, ''); // Giữ qnaId đúng để submit followup answer
            goToNextQuestion({ isFollowUp: true, followupQuestion });
            setIsAiThinking(false);
        };

        const handleUpdateCurrentQuestion = ({ qnaId, orderIndex, questionText }: CurrentQuestionData) => {
            if (currentQuestion.qnaId === qnaId) {
                setIsAiThinking(false);
                return;
            }

            setCurrentQuestion(qnaId, orderIndex, questionText);
            goToNextQuestion({ isFollowUp: false, nextQuestionText: questionText });
            setIsAiThinking(false);
        };

        const handleGeneratingResult = () => {
            setIsCompleted(true);
            setIsAiThinking(true);
            setMessages((prev) => [
                ...prev,
                {
                    id: 'generating',
                    role: 'ai',
                    content: 'AI đang tổng hợp kết quả phỏng vấn…',
                    type: 'system',
                },
            ]);
        };

        const handleSessionCompleted = () => {
            setIsAiThinking(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: 'complete',
                    role: 'ai',
                    content: 'Bạn đã hoàn thành bài phỏng vấn. Đang chuyển đến trang kết quả…',
                    type: 'system',
                },
            ]);
            setTimeout(() => {
                router.push(`/mock-interview/${sessionId}/result`);
            }, 3000);
        };

        const handlePendingResult = (payload: PendingResultData) => {
            setIsCompleted(true);
            setIsAiThinking(false);
            setMessages((prev) => {
                if (prev.some((message) => message.id === 'pending-result')) return prev;

                return [
                    ...prev,
                    {
                        id: 'pending-result',
                        role: 'ai',
                        content: payload.message || 'Kết quả đang được chấm. Hệ thống sẽ tự cập nhật khi sẵn sàng.',
                        type: 'system',
                    },
                ];
            });
        };

        const handleInterviewError = ({ message }: InterviewErrorData) => {
            setIsAiThinking(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: 'ai',
                    content: message || 'Có lỗi xảy ra trong phiên phỏng vấn.',
                    type: 'system',
                },
            ]);
        };

        socket.onEvent<FollowupQuestionData>('interview:followup_question', handleUpdateFollowUpQuestion);
        socket.onEvent<CurrentQuestionData>('interview:question', handleUpdateCurrentQuestion);
        socket.onEvent<object>('interview:generating_result', handleGeneratingResult);
        socket.onEvent<object>('interview:session_completed', handleSessionCompleted);
        socket.onEvent<PendingResultData>('interview:pending_result', handlePendingResult);
        socket.onEvent<InterviewErrorData>('interview:error', handleInterviewError);

        return () => {
            socket.offEvent<FollowupQuestionData>('interview:followup_question', handleUpdateFollowUpQuestion);
            socket.offEvent<CurrentQuestionData>('interview:question', handleUpdateCurrentQuestion);
            socket.offEvent<object>('interview:generating_result', handleGeneratingResult);
            socket.offEvent<object>('interview:session_completed', handleSessionCompleted);
            socket.offEvent<PendingResultData>('interview:pending_result', handlePendingResult);
            socket.offEvent<InterviewErrorData>('interview:error', handleInterviewError);
        };
    }, [socket, setCurrentQuestion, goToNextQuestion, sessionId, router, currentQuestion.qnaId]);

    const handleSubmitAnswer = async (text: string) => {
        setIsAiThinking(true);

        const answerType = isFollowup ? 'followup_answer' : 'answer';
        setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: 'candidate', content: text, type: answerType },
        ]);

        if (answerType === 'answer') {
            socket.emitEvent('interview:submit_answer', {
                sessionId,
                qnaId: currentQuestion.qnaId,
                answerText: text,
            });
        } else if (answerType === 'followup_answer') {
            setIsFollowup(false);
            socket.emitEvent('interview:submit_followup', {
                sessionId,
                qnaId: currentQuestion.qnaId,
                followupAnswer: text,
            });
        }
    };

    const { shown, ratio } = questionProgress(currentIndex, totalQuestions, isCompleted);

    return (
        <div className="flex min-h-dvh min-w-0">
            {/* ─── Chat column ───────────────────────────────────────── */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-sticky border-b border-night-line bg-night/80 backdrop-blur">
                    <div className="flex h-14 items-center gap-3 px-4">
                        <Link href="/mock-interview" aria-label="Thoát phỏng vấn" title="Thoát phỏng vấn" className={NIGHT_ICON_BUTTON}>
                            <ArrowLeft aria-hidden="true" strokeWidth={1.75} className="size-[18px]" />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-body-sm font-medium text-night-ink" title={topicName}>
                                {topicName}
                            </p>
                            <p className="text-caption tabular-nums text-night-ink-3">
                                Câu {shown}/{totalQuestions}
                            </p>
                        </div>
                        {!isCompleted && (
                            <button type="button" onClick={handleAbandon} className={cn(NIGHT_TEXT_BUTTON, 'lg:hidden')}>
                                Hủy phỏng vấn
                            </button>
                        )}
                    </div>
                    {/* Progress rides on the bottom hairline; scaleX keeps it on the compositor. */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-accent transition-transform duration-slow ease-out-expo"
                        style={{ transform: `scaleX(${ratio})` }}
                    />
                </header>

                <div className="flex-1 px-4 py-6">
                    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
                        <div role="log" aria-label="Hội thoại phỏng vấn" className="flex flex-col gap-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={initialMessageIds.current.has(msg.id) ? undefined : 'animate-rise'}
                                >
                                    <ChatBubble message={msg} />
                                </div>
                            ))}
                        </div>

                        {isAiThinking && (
                            <div className="animate-rise">
                                <TypingIndicator />
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                </div>

                <AnswerInput
                    onSubmit={handleSubmitAnswer}
                    disabled={isAiThinking || isCompleted}
                    placeholder={
                        isCompleted
                            ? 'Phỏng vấn đã kết thúc'
                            : isFollowup
                                ? 'Trả lời câu hỏi bổ sung…'
                                : 'Nhập câu trả lời của bạn…'
                    }
                />
            </div>

            {/* ─── Sidebar (from 1024 px) ────────────────────────────── */}
            <aside aria-label="Phiên phỏng vấn" className="hidden w-[280px] shrink-0 border-l border-night-line lg:block">
                <div className="sticky top-0 h-dvh overflow-y-auto">
                    <SessionSidebar
                        topicName={topicName}
                        category={category}
                        difficulty={difficulty}
                        currentIndex={currentIndex}
                        totalQuestions={totalQuestions}
                        isCompleted={isCompleted}
                        sessionId={sessionId}
                        onAbandon={handleAbandon}
                    />
                </div>
            </aside>

            <ConfirmModal
                isOpen={showAbandonConfirm}
                title="Xác nhận hủy phỏng vấn"
                description="Bạn có chắc chắn muốn hủy phiên phỏng vấn này không? Toàn bộ quá trình sẽ không được ghi nhận kết quả."
                cancelText="Tiếp tục phỏng vấn"
                confirmText="Hủy phiên"
                onCancel={() => setShowAbandonConfirm(false)}
                onConfirm={handleConfirmAbandon}
                isConfirming={isAbandoning}
            />
        </div>
    );
}
