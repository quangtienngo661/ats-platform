import { DifficultyLevel } from '@ats-platform/types';
import { cn } from '@/components/ui/cn';
import { DIFFICULTY_OPTIONS } from './DifficultySelector';

/** Question shown as "Câu x/y" and the share of the bar it fills; a finished session is always full. */
export function questionProgress(currentIndex: number, totalQuestions: number, isCompleted: boolean) {
    if (totalQuestions <= 0) return { shown: 0, ratio: isCompleted ? 1 : 0 };
    const shown = Math.min(Math.max(currentIndex, 0), totalQuestions);
    return { shown, ratio: isCompleted ? 1 : shown / totalQuestions };
}

interface SessionSidebarProps {
    topicName: string;
    category: string;
    difficulty: DifficultyLevel;
    currentIndex: number;
    totalQuestions: number;
    isCompleted: boolean;
    sessionId: string;
    onAbandon?: () => void;
}

/** Session facts and the question list beside the chat. Shown from 1024 px; the top bar carries the essentials below. */
export function SessionSidebar({
    topicName,
    category,
    difficulty,
    currentIndex,
    totalQuestions,
    isCompleted,
    onAbandon,
}: SessionSidebarProps) {
    const difficultyLabel = DIFFICULTY_OPTIONS.find((o) => o.value === difficulty)?.label ?? 'Trung bình';
    const { shown, ratio } = questionProgress(currentIndex, totalQuestions, isCompleted);

    return (
        <div className="flex h-full flex-col gap-6 p-5">
            <section aria-labelledby="session-info-heading">
                <h2 id="session-info-heading" className="text-caption text-night-ink-3">
                    Thông tin phiên
                </h2>
                <dl className="mt-3 flex flex-col gap-3">
                    <div className="min-w-0">
                        <dt className="text-caption text-night-ink-3">Chủ đề</dt>
                        <dd className="mt-0.5 break-words text-body-sm font-medium text-night-ink">{topicName}</dd>
                        {category && <dd className="break-words text-caption text-night-ink-2">{category}</dd>}
                    </div>
                    <div>
                        <dt className="text-caption text-night-ink-3">Mức độ</dt>
                        <dd className="mt-0.5 text-body-sm text-night-ink">{difficultyLabel}</dd>
                    </div>
                </dl>
            </section>

            <section aria-labelledby="session-progress-heading">
                <div className="flex items-baseline justify-between gap-3">
                    <h2 id="session-progress-heading" className="text-caption text-night-ink-3">
                        Tiến trình
                    </h2>
                    <span className="text-caption tabular-nums text-night-ink-2">
                        Câu {shown}/{totalQuestions}
                    </span>
                </div>
                <div aria-hidden="true" className="mt-2 h-1 overflow-hidden rounded-full bg-night-3">
                    <div
                        className="h-full origin-left rounded-full bg-accent transition-transform duration-slow ease-out-expo"
                        style={{ transform: `scaleX(${ratio})` }}
                    />
                </div>
                <ol aria-hidden="true" className="mt-4 grid grid-cols-5 gap-1.5">
                    {Array.from({ length: totalQuestions }, (_, i) => {
                        const number = i + 1;
                        const done = isCompleted || number < currentIndex;
                        const current = !isCompleted && number === currentIndex;
                        return (
                            <li
                                key={number}
                                className={cn(
                                    'flex h-7 items-center justify-center rounded-ctl text-caption tabular-nums transition-colors duration-hover',
                                    done && 'bg-night-3 text-night-ink-2',
                                    current && 'bg-night-ink text-night',
                                    !done && !current && 'border border-night-line text-night-ink-3',
                                )}
                            >
                                {number}
                            </li>
                        );
                    })}
                </ol>
            </section>

            {!isCompleted && onAbandon && (
                <button
                    type="button"
                    onClick={onAbandon}
                    className="mt-auto inline-flex h-9 w-full items-center justify-center rounded-ctl border border-night-ink-3 text-body-sm font-medium text-night-ink-2 transition duration-press ease-out-expo hover:bg-night-2 hover:text-night-ink active:scale-[.97]"
                >
                    Hủy phỏng vấn
                </button>
            )}
        </div>
    );
}
