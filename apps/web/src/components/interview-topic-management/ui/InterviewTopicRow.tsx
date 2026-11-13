'use client';

import { useId, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    IconButton,
    TD,
    TR,
} from '@/components/ui';
import { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { DeleteInterviewTopicDialog } from './DeleteInterviewTopicButton';

/** Always visible on touch and narrow screens; on a wide screen with hover it shows on row hover or focus. */
const MENU_TRIGGER_VISIBILITY =
    'group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)_and_(min-width:1024px)]:opacity-0';

interface InterviewTopicRowProps {
    topic: IInterviewTopic;
    onEdit: (topic: IInterviewTopic) => void;
}

export function InterviewTopicRow({ topic, onEdit }: InterviewTopicRowProps) {
    const sessions = topic._count?.sessions ?? 0;
    const categoryName = topic.category?.name || 'Chưa phân loại';
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const nameId = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    /** Runs once the menu has closed and focus is back on its trigger, so a dialog it opens returns focus there. */
    const afterClose = useRef<(() => void) | null>(null);

    return (
        <TR className="group">
            <TD>
                <div className="min-w-0 max-w-48 sm:max-w-80">
                    <p id={nameId} className="truncate font-medium text-ink" title={topic.name}>
                        {topic.name}
                    </p>
                    <p className="font-mono text-caption text-ink-3">ID: {topic.topicId.slice(0, 8)}</p>
                    <p className="truncate text-caption text-ink-3 sm:hidden">{categoryName}</p>
                </div>
            </TD>
            <TD className="max-sm:hidden">
                <span className="block max-w-48 truncate" title={categoryName}>
                    {categoryName}
                </span>
            </TD>
            <TD numeric>{sessions}</TD>
            <TD className="w-px whitespace-nowrap text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <IconButton
                            ref={triggerRef}
                            size="sm"
                            aria-label="Tùy chọn"
                            aria-describedby={nameId}
                            className={MENU_TRIGGER_VISIBILITY}
                        >
                            <MoreHorizontal aria-hidden="true" strokeWidth={1.75} />
                        </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        onCloseAutoFocus={(e) => {
                            const run = afterClose.current;
                            afterClose.current = null;
                            if (!run) return;
                            e.preventDefault();
                            triggerRef.current?.focus();
                            run();
                        }}
                    >
                        <DropdownMenuItem onSelect={() => { afterClose.current = () => onEdit(topic); }}>
                            <Pencil aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            destructive
                            disabled={sessions > 0}
                            title={sessions > 0 ? 'Không thể xóa chủ đề đã có phiên phỏng vấn' : undefined}
                            onSelect={() => { afterClose.current = () => setConfirmingDelete(true); }}
                        >
                            <Trash2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            Xóa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DeleteInterviewTopicDialog
                    topicId={topic.topicId}
                    open={confirmingDelete}
                    onClose={() => setConfirmingDelete(false)}
                />
            </TD>
        </TR>
    );
}
