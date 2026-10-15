'use client';

import { useRef, useEffect } from 'react';
import { Bold, Italic, List } from 'lucide-react';
import { SFT } from '@/types/fonts/fonts';

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
        <div className="w-full rounded-xl border border-[#E5E5EA] overflow-hidden focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-[#0071E3]/10 transition bg-white flex flex-col">
            <div className="flex items-center gap-1 p-2 border-b border-[#F2F2F7] bg-[#FAFAFC]">
                <button
                    type="button"
                    onClick={() => format('bold')}
                    className="p-1.5 rounded-lg hover:bg-[#E5E5EA] text-[#1D1D1F] transition-colors"
                    title="In đậm"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => format('italic')}
                    className="p-1.5 rounded-lg hover:bg-[#E5E5EA] text-[#1D1D1F] transition-colors"
                    title="In nghiêng"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-[#E5E5EA] mx-1" />
                <button
                    type="button"
                    onClick={() => format('insertUnorderedList')}
                    className="p-1.5 rounded-lg hover:bg-[#E5E5EA] text-[#1D1D1F] transition-colors"
                    title="Danh sách"
                >
                    <List className="w-4 h-4" />
                </button>
            </div>
            
            
            
            <div
                id={id}
                ref={editorRef}
                className="rich-text-editor-content p-4 min-h-[200px] max-h-[400px] overflow-y-auto text-[14px] text-[#1D1D1F]"
                style={{ fontFamily: SFT }}
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
