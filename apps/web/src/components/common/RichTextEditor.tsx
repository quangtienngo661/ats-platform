'use client';

import { useRef, useEffect } from 'react';
import { Bold, Italic, List } from 'lucide-react';

interface RichTextEditorProps {
    id?: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    ariaLabel?: string;
}

export function RichTextEditor({ id, value, onChange, placeholder, ariaLabel }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    // Sync external value changes (only if editor is empty or on mount)
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        if (!document.execCommand?.('insertText', false, text)) {
            const editor = editorRef.current;
            if (!editor) return;
            const selection = window.getSelection();
            const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
            const node = document.createTextNode(text);
            if (range && editor.contains(range.commonAncestorContainer)) {
                range.deleteContents();
                range.insertNode(node);
                range.setStartAfter(node);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
            } else {
                editor.appendChild(node);
            }
        }
        handleInput();
    };

    const format = (command: string) => {
        document.execCommand(command, false, undefined);
        handleInput();
        editorRef.current?.focus();
    };

    return (
        <div className="w-full flex flex-col overflow-hidden rounded-card border border-line bg-surface transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10">
            <div className="flex items-center gap-1 border-b border-line bg-surface-2 p-2">
                <button
                    type="button"
                    onClick={() => format('bold')}
                    className="rounded-ctl p-1.5 text-ink transition-colors hover:bg-line"
                    title="In đậm"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => format('italic')}
                    className="rounded-ctl p-1.5 text-ink transition-colors hover:bg-line"
                    title="In nghiêng"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <div className="mx-1 h-4 w-px bg-line" />
                <button
                    type="button"
                    onClick={() => format('insertUnorderedList')}
                    className="rounded-ctl p-1.5 text-ink transition-colors hover:bg-line"
                    title="Danh sách"
                >
                    <List className="w-4 h-4" />
                </button>
            </div>
            
            
            
            <div
                id={id}
                ref={editorRef}
                className="rich-text-editor-content max-h-[400px] min-h-[200px] overflow-y-auto p-4 font-sans text-body-sm text-ink"
                role="textbox"
                aria-label={ariaLabel ?? placeholder ?? 'Nội dung mô tả'}
                aria-multiline="true"
                tabIndex={0}
                contentEditable
                onInput={handleInput}
                onPaste={handlePaste}
                onBlur={handleInput}
                data-placeholder={placeholder}
            />
        </div>
    );
}
