import { useId } from 'react';
import { Badge, Surface } from '@/components/ui';

/** A list marker at the very start of a line: `-`, `•`, `*`, `1.` or `1)`, then whitespace. */
const LIST_MARKER = /^(?:\d+[.)]|[-*•])\s+/;

/**
 * Turns the AI's action plan (one string from the API) into steps, using only structure the text already has:
 * one step per non-blank line, with a leading list marker removed. Prose is never cut at sentence punctuation,
 * since "TP. Hồ Chí Minh", "ThS. Nguyễn" or "e.g. React" would break into wrong steps; a plan without line
 * breaks stays one step. Text and order are never changed.
 */
export function splitActionPlan(plan: string): string[] {
    return plan
        .split(/\r?\n/)
        .map((line) => line.trim().replace(LIST_MARKER, '').trim())
        .filter(Boolean);
}

interface ActionPlanCardProps {
    actionPlan: string;
}

/**
 * Several steps render as a numbered list (CSS counters, so a screen reader hears each number once, as the list
 * position). A single step is prose, not a sequence, so it renders as a paragraph.
 */
export function ActionPlanCard({ actionPlan }: ActionPlanCardProps) {
    const headingId = useId();
    const steps = splitActionPlan(actionPlan);
    if (steps.length === 0) return null;

    return (
        <Surface as="section" aria-labelledby={headingId} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
                <h2 id={headingId} className="text-title-sm text-ink">
                    Kế hoạch cải thiện
                </h2>
                <Badge tone="accent">Gợi ý AI</Badge>
            </div>
            {steps.length === 1 ? (
                <p className="mt-4 whitespace-pre-wrap break-words text-body text-ink-2">{steps[0]}</p>
            ) : (
                <ol aria-labelledby={headingId} className="mt-4 flex flex-col gap-3 [counter-reset:step]">
                    {steps.map((step, index) => (
                        <li
                            key={index}
                            className={[
                                'flex gap-3 break-words text-body text-ink-2 [counter-increment:step]',
                                'before:flex before:size-6 before:shrink-0 before:items-center before:justify-center',
                                'before:rounded-full before:bg-accent-soft before:font-mono before:text-caption',
                                'before:tabular-nums before:text-accent-text before:content-[counter(step)]',
                            ].join(' ')}
                        >
                            <span className="min-w-0 pt-px">{step}</span>
                        </li>
                    ))}
                </ol>
            )}
        </Surface>
    );
}
