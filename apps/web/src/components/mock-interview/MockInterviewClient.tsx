'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { ArrowRight, History } from 'lucide-react';
import { Button, EmptyState, PageToolbar, Reveal, Surface } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import type { IInterviewTopic, ISessionSummary } from '@/types/interfaces/interview.interface';
import { TopicSelector } from './ui/TopicSelector';
import { DifficultySelector, DIFFICULTY_OPTIONS } from './ui/DifficultySelector';
import { SessionCard } from './ui/SessionCard';
import { CategoryDropdown } from './ui/CategoryDropdown';
import type { DifficultyLevel } from '@ats-platform/types';
import { startInterviewSessionAction, abandonInterviewSessionAction } from '@/servers/interviews/interviews.action';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useSocketStore } from '@/stores/useSocketStore';

interface MockInterviewClientProps {
    topics: IInterviewTopic[];
    history: ISessionSummary[];
}

function StepHeading({ number, title, children }: { number: number; title: string; children?: React.ReactNode }) {
    return (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 className="flex items-center gap-2 text-title-sm text-ink">
                <span className="flex size-6 items-center justify-center rounded-full bg-surface-2 font-mono text-caption tabular-nums text-ink-2">
                    {number}
                </span>
                {title}
            </h2>
            {children}
        </div>
    );
}

export default function MockInterviewClient({ topics, history }: MockInterviewClientProps) {
    const router = useRouter();
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
    const [isStarting, setIsStarting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isAbandoning, setIsAbandoning] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [startFailed, setStartFailed] = useState(false);

    // Trích xuất các category độc nhất từ danh sách topics
    const categories = Array.from(
        new Set(topics.map((t) => t.category?.name).filter((name): name is string => !!name)),
    );

    const handleCategoryChange = (category: string | null) => {
        setSelectedCategory(category);
        setSelectedTopic(null);
    };

    const filteredTopics = selectedCategory ? topics.filter((t) => t.category?.name === selectedCategory) : topics;
    const topic = topics.find((t) => t.topicId === selectedTopic) ?? null;
    const difficulty = DIFFICULTY_OPTIONS.find((o) => o.value === selectedDifficulty);

    const socket = useSocketStore();

    const activeSession = history.find((s) => s.status === 'in_progress' || s.status === 'generating');
    const canStart = !!selectedTopic && !isStarting && !isAbandoning;

    const createNewSession = async () => {
        if (!selectedTopic) return;
        setIsStarting(true);
        setStartFailed(false);
        const result = await startInterviewSessionAction(selectedTopic, selectedDifficulty);
        if (result.success) {
            router.push(`/mock-interview/${result.sessionId}`);
        } else {
            setIsStarting(false);
            setShowConfirmModal(false);
            setStartFailed(true);
        }
    };

    const handleStart = async () => {
        if (!canStart) return;
        if (activeSession) {
            setShowConfirmModal(true);
            return;
        }
        await createNewSession();
    };

    const handleConfirmAbandon = async () => {
        if (!activeSession) return;
        setIsAbandoning(true);
        const success = await abandonInterviewSessionAction(activeSession.sessionId);
        if (success) {
            setShowConfirmModal(false);
            await createNewSession();
        } else {
            setIsAbandoning(false);
        }
    };

    useEffect(() => {
        const handleUpdateHistory = () => {
            router.refresh();
        };
        socket.onEvent('interview:session_completed', handleUpdateHistory);

        return () => {
            socket.offEvent('interview:session_completed', handleUpdateHistory);
        };
    }, [socket, router]);

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
            <div>
                <PageToolbar title="Phỏng vấn thử" />
                <p className="mt-1 text-body text-ink-3">
                    AI ra 10 câu theo chủ đề và độ khó bạn chọn, rồi chấm điểm khi bạn làm xong.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Surface variant="raised" className="flex flex-col gap-8 p-5 sm:p-6">
                    <Reveal as="section">
                        <StepHeading number={1} title="Chọn chủ đề">
                            {categories.length > 0 && (
                                <CategoryDropdown
                                    categories={categories}
                                    selectedCategory={selectedCategory}
                                    onSelectCategory={handleCategoryChange}
                                />
                            )}
                        </StepHeading>
                        {filteredTopics.length > 0 ? (
                            <TopicSelector topics={filteredTopics} selectedId={selectedTopic} onSelect={setSelectedTopic} />
                        ) : (
                            <p className="text-body-sm text-ink-3">Chưa có chủ đề nào.</p>
                        )}
                    </Reveal>

                    <Reveal as="section" delay={0.05}>
                        <StepHeading number={2} title="Chọn độ khó" />
                        <DifficultySelector selected={selectedDifficulty} onSelect={setSelectedDifficulty} />
                    </Reveal>

                    <Reveal as="section" delay={0.1}>
                        <StepHeading number={3} title="Bắt đầu" />
                        <p
                            className={cn(
                                'mb-4 min-h-6 text-body transition-colors duration-hover',
                                topic ? 'text-ink' : 'text-ink-3',
                            )}
                        >
                            {topic ? (
                                <>
                                    <span className="font-medium">{topic.name}</span>
                                    <span className="text-ink-3"> · {difficulty?.label}</span>
                                </>
                            ) : (
                                'Chọn chủ đề để tiếp tục.'
                            )}
                        </p>
                        <Button size="lg" variant="accent" onClick={handleStart} disabled={!canStart} loading={isStarting}>
                            {isStarting ? (
                                'AI đang chuẩn bị đề…'
                            ) : (
                                <>
                                    Bắt đầu phỏng vấn
                                    <ArrowRight aria-hidden="true" strokeWidth={1.75} />
                                </>
                            )}
                        </Button>
                        {startFailed && (
                            <p role="alert" className="mt-3 text-body-sm text-danger">
                                Không bắt đầu được phiên phỏng vấn. Thử lại.
                            </p>
                        )}
                    </Reveal>
                </Surface>

                <Reveal as="section" delay={0.15} className="min-w-0">
                    <Surface
                        variant="plain"
                        className={cn('p-2 transition-opacity duration-hover', isStarting && 'pointer-events-none opacity-50')}
                    >
                        <h2 className="flex items-center gap-2 px-3 pb-1 pt-3 text-title-sm text-ink">
                            <History aria-hidden="true" strokeWidth={1.75} className="size-4 text-ink-3" />
                            Phiên gần đây
                        </h2>
                        {history.length > 0 ? (
                            <ul className="flex flex-col">
                                {history.map((session) => (
                                    <li key={session.sessionId}>
                                        <SessionCard session={session} />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState
                                className="py-10"
                                title="Chưa có phiên nào"
                                description="Phiên bạn bắt đầu sẽ hiện ở đây."
                            />
                        )}
                    </Surface>
                </Reveal>
            </div>

            <AnimatePresence>
                {showConfirmModal && (
                    <ConfirmModal
                        isOpen={showConfirmModal}
                        title="Bạn có một bài phỏng vấn đang dở"
                        description={`Bài phỏng vấn chủ đề "${activeSession?.topic.name}" vẫn đang diễn ra. Việc bắt đầu phiên mới sẽ hủy bỏ hoàn toàn kết quả của phiên phỏng vấn trước đó.`}
                        cancelText="Quay lại"
                        confirmText="Hủy bài cũ & Tạo mới"
                        onCancel={() => setShowConfirmModal(false)}
                        onConfirm={handleConfirmAbandon}
                        isConfirming={isAbandoning || isStarting}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
