'use client';

import { Check } from 'lucide-react';
import { useRef, type KeyboardEvent } from 'react';
import { cn } from '@/components/ui/cn';
import { hasModifier } from '@/lib/keyboard';
import type { IInterviewTopic } from '@/types/interfaces/interview.interface';

interface TopicSelectorProps {
    topics: IInterviewTopic[];
    selectedId: string | null;
    onSelect: (topicId: string) => void;
}

/** Topics as selectable cards (`role="radiogroup"`); the choice is a ring and a tint. */
export function TopicSelector({ topics, selectedId, onSelect }: TopicSelectorProps) {
    const refs = useRef<Array<HTMLButtonElement | null>>([]);
    const selectedIndex = topics.findIndex((t) => t.topicId === selectedId);
    const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

    function onKeyDown(e: KeyboardEvent, index: number) {
        if (hasModifier(e)) return;
        let next: number;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % topics.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + topics.length) % topics.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = topics.length - 1;
        else return;
        e.preventDefault();
        onSelect(topics[next].topicId);
        refs.current[next]?.focus();
    }

    return (
        <div
            role="radiogroup"
            aria-label="Chủ đề phỏng vấn"
            className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 xl:grid-cols-3"
        >
            {topics.map((topic, index) => {
                const selected = selectedId === topic.topicId;
                const count = topic._count?.sessions ?? 0;
                const category = topic.category?.name ?? 'Chưa phân nhóm';
                return (
                    <button
                        key={topic.topicId}
                        ref={(el) => {
                            refs.current[index] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        tabIndex={index === tabStop ? 0 : -1}
                        onKeyDown={(e) => onKeyDown(e, index)}
                        onClick={() => onSelect(topic.topicId)}
                        className={cn(
                            'relative flex min-w-0 flex-col items-start rounded-card p-3 text-left ring-1 transition duration-hover ease-out-expo active:scale-[.97]',
                            selected ? 'bg-accent-soft/50 ring-2 ring-accent' : 'bg-surface ring-line hover:bg-surface-2',
                        )}
                    >
                        <span className="w-full break-words pr-6 text-body font-medium text-ink">{topic.name}</span>
                        <span className="mt-0.5 w-full truncate text-caption text-ink-3" title={category}>
                            {category}
                            {count > 0 ? ` · ${count} lần` : ''}
                        </span>
                        <span
                            aria-hidden="true"
                            className={cn(
                                'absolute right-2.5 top-2.5 flex size-4 items-center justify-center rounded-full bg-accent text-white transition duration-hover',
                                selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
                            )}
                        >
                            <Check size={10} strokeWidth={3} />
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
