import { cn } from '@/components/ui/cn';

interface ChatMessage {
    id: string;
    role: 'ai' | 'candidate';
    content: string;
    type: 'question' | 'answer' | 'followup' | 'followup_answer' | 'system';
    questionIndex?: number;
}

interface ChatBubbleProps {
    message: ChatMessage;
}

/** One turn of the interview on the night surface: the AI on the left, the candidate (inverted) on the right. */
export function ChatBubble({ message }: ChatBubbleProps) {
    const isAi = message.role === 'ai';

    // System messages (welcome, completion, errors) sit centred between turns, quieter than either speaker.
    if (message.type === 'system') {
        return (
            <p className="mx-auto max-w-[520px] whitespace-pre-wrap break-words px-4 text-center text-caption text-night-ink-3 [overflow-wrap:anywhere]">
                {message.content}
            </p>
        );
    }

    const label =
        message.type === 'question' && message.questionIndex
            ? `Câu ${message.questionIndex}`
            : message.type === 'followup'
              ? 'Câu hỏi bổ sung'
              : null;

    return (
        <div className={cn('flex min-w-0', isAi ? 'justify-start' : 'justify-end')}>
            <div className={cn('flex min-w-0 max-w-[85%] flex-col sm:max-w-[75%]', isAi ? 'items-start' : 'items-end')}>
                {label && <p className="mb-1.5 text-caption tabular-nums text-night-ink-3">{label}</p>}
                <div
                    className={cn(
                        'min-w-0 rounded-card px-4 py-3',
                        isAi ? 'bg-night-2 text-night-ink' : 'bg-night-ink text-night',
                    )}
                >
                    <p className="whitespace-pre-wrap break-words text-body [overflow-wrap:anywhere]">
                        <span className="sr-only">{isAi ? 'AI: ' : 'Bạn: '}</span>
                        {message.content}
                    </p>
                </div>
            </div>
        </div>
    );
}
