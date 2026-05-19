'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { SF, SFT } from '@/types/fonts/fonts';
import { DifficultyLevel } from '@ats-platform/database';
import { ChatBubble } from './ui/ChatBubble';
import { AnswerInput } from './ui/AnswerInput';
import { SessionSidebar } from './ui/SessionSidebar';
import { TypingIndicator } from './ui/TypingIndicator';
import { useSocketStore } from '@/stores/useSocketStore';
import { useInterviewChatStore } from '@/stores/useInterviewChatStore';
import { IInterviewQnA } from '@/types/interfaces/interview.interface';
import { abandonInterviewSessionAction } from '@/servers/interviews/interviews.action';
import { ConfirmModal } from '@/components/common/ConfirmModal';

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
                    content: `Chào bạn! Chúng ta sẽ bắt đầu phỏng vấn về **${topicName}** với ${totalQuestions} câu hỏi. Sẵn sàng chưa? 😊`,
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
        content: `Chào mừng bạn quay trở lại! Tiếp tục phỏng vấn về **${topicName}** nhé 😊`,
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

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
                        content: options.followupQuestion!,
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
                    content: '⏳ AI đang tổng hợp kết quả phỏng vấn của bạn, vui lòng chờ...',
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
                    content: '🎉 Chúc mừng bạn đã hoàn thành bài phỏng vấn! Đang chuyển đến trang kết quả...',
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

    return (
        <div className="flex h-screen" style={{ fontFamily: SFT }}>
            {/* ─── Chat Area ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Chat header */}
                <div className="px-5 py-3 border-b border-[#F2F2F7] bg-white flex items-center gap-3">
                    <button
                        onClick={() => router.push('/mock-interview')}
                        className="p-1.5 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] hover:text-[#6E6E73] transition-all flex-shrink-0"
                        title="Thoát phỏng vấn"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center">
                        <span className="text-white text-[11px]" style={{ fontFamily: SF, fontWeight: 700 }}>AI</span>
                    </div>
                    <div>
                        <p className="text-[13px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                            AI Interviewer · {topicName}
                        </p>
                        <p className="text-[11px] text-[#AEAEB2]">
                            Câu {currentIndex}/{totalQuestions}
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#F5F5F7]">
                    <div className="max-w-[720px] mx-auto flex flex-col gap-3">
                        <AnimatePresence mode="popLayout">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 15, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                >
                                    <ChatBubble message={msg} />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Typing indicator */}
                        <AnimatePresence>
                            {isAiThinking && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <TypingIndicator />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Input area */}
                <AnswerInput
                    onSubmit={handleSubmitAnswer}
                    disabled={isAiThinking || isCompleted}
                    placeholder={
                        isCompleted
                            ? 'Phỏng vấn đã kết thúc'
                            : isFollowup
                                ? 'Trả lời câu hỏi bổ sung...'
                                : 'Nhập câu trả lời của bạn...'
                    }
                />
            </div>

            {/* ─── Sidebar ───────────────────────────────────────────── */}
            <div className="hidden lg:block">
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

            {/* Confirm Modal */}
            <AnimatePresence>
                {showAbandonConfirm && (
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
                )}
            </AnimatePresence>
        </div>
    );
}
