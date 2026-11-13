import { useId } from 'react';
import { Badge, Surface } from '@/components/ui';

const LIST_MARKER = /^(?:\d+[.)]|[-*•])\s+/;

function startsSentence(text: string): boolean {
    const first = text.charAt(0);
    return /\d/.test(first) || (first !== first.toLowerCase() && first === first.toUpperCase());
}

/**
 * Turns the AI's action plan into ordered steps. The API returns one string: usually 3–5 sentences, sometimes
 * lines with list markers. Lines win when there are several; otherwise a sentence ends at . ! ? … followed by
 * a capital or a digit, so "Node.js", "20.5" and "v.v. cho" stay whole. Text and order are never changed.
 */
export function splitActionPlan(plan: string): string[] {
    const lines = plan
        .split(/\r?\n/)
        .map((line) => line.trim().replace(LIST_MARKER, '').trim())
        .filter(Boolean);
    if (lines.length !== 1) return lines;

    const parts = lines[0].split(/([.!?…])\s+/);
    const sentences: string[] = [];
    let current = parts[0];
    for (let i = 1; i < parts.length; i += 2) {
        const next = parts[i + 1] ?? '';
        current += parts[i];
        if (startsSentence(next)) {
            sentences.push(current);
            current = next;
        } else {
            current += ` ${next}`;
        }
    }
    sentences.push(current);
    return sentences.map((s) => s.trim()).filter(Boolean);
}

interface ActionPlanCardProps {
    actionPlan: string;
}

/** The plan as a numbered list (CSS counters, so a screen reader hears each number once, as the list position). */
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
        </Surface>
    );
}
