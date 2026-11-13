'use client';

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';

const MAX_HEIGHT = 200; // px — sau đó scroll bên trong, không expand thêm

interface AnswerInputProps {
    onSubmit: (text: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

/**
 * The composer pinned to the bottom of the interview, above the phone's home indicator. Enter sends, Shift+Enter
 * adds a line, and Enter that confirms an IME composition (Vietnamese Telex/VNI on some keyboards) never sends.
 */
export function AnswerInput({ onSubmit, disabled = false, placeholder = 'Nhập câu trả lời…' }: AnswerInputProps) {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand chiều cao — reset về 'auto' trước để tính lại đúng scrollHeight
    const adjustHeight = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + 'px';
        // Chỉ scroll bên trong khi đã đạt maxHeight
        el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [text, adjustHeight]);

    const handleSubmit = () => {
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSubmit(trimmed);
        setText('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
        e.preventDefault();
        handleSubmit();
    };

    const canSend = !disabled && text.trim().length > 0;

    return (
        <div className="sticky bottom-0 z-sticky border-t border-night-line bg-night/90 px-4 pt-3 backdrop-blur pb-[max(16px,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-[760px] items-end gap-2">
                <textarea
                    aria-label="Câu trả lời"
                    aria-describedby="answer-input-hint"
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={placeholder}
                    rows={1}
                    className={[
                        'block min-h-11 w-full min-w-0 flex-1 resize-none overflow-y-hidden rounded-card border border-night-line',
                        'bg-night-2 px-4 py-2.5 text-body text-night-ink placeholder:text-night-ink-3',
                        'transition-colors duration-hover focus:border-night-ink-3',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    ].join(' ')}
                />
                <button
                    type="button"
                    aria-label="Gửi câu trả lời"
                    onClick={handleSubmit}
                    disabled={!canSend}
                    className={[
                        'inline-flex size-11 shrink-0 items-center justify-center rounded-card',
                        'bg-night-ink text-night transition duration-press ease-out-expo active:scale-[.97]',
                        'hover:bg-night-ink-2 disabled:pointer-events-none disabled:bg-night-3 disabled:text-night-ink-3',
                    ].join(' ')}
                >
                    <ArrowUp aria-hidden="true" strokeWidth={1.75} className="size-[18px]" />
                </button>
            </div>
            <p id="answer-input-hint" className="mx-auto mt-1.5 hidden max-w-[760px] text-caption text-night-ink-3 sm:block">
                Enter để gửi · Shift+Enter để xuống dòng
            </p>
        </div>
    );
}
