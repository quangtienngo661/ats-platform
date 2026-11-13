'use client';

import { useId, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { DropdownMenuSeparator, RowActionsItem, RowActionsMenu, TD, TR } from '@/components/ui';
import { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { DeleteInterviewTopicDialog } from './DeleteInterviewTopicDialog';

interface InterviewTopicRowProps {
    topic: IInterviewTopic;
    onEdit: (topic: IInterviewTopic) => void;
}

export function InterviewTopicRow({ topic, onEdit }: InterviewTopicRowProps) {
    const sessions = topic._count?.sessions ?? 0;
    const categoryName = topic.category?.name || 'Chưa phân loại';
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const nameId = useId();
    const reasonId = useId();

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
                <RowActionsMenu describedBy={nameId}>
                    <RowActionsItem afterClose={() => onEdit(topic)}>
                        <Pencil aria-hidden="true" strokeWidth={1.75} className="size-4" />
                        Chỉnh sửa
                    </RowActionsItem>
                    <DropdownMenuSeparator />
                    <RowActionsItem
                        destructive
                        disabled={sessions > 0}
                        aria-describedby={sessions > 0 ? reasonId : undefined}
                        afterClose={() => setConfirmingDelete(true)}
                    >
                        <Trash2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
                        Xóa
                    </RowActionsItem>
                    {sessions > 0 && (
                        <p id={reasonId} className="px-2 pb-1 text-caption text-ink-3">
                            Không thể xóa chủ đề đã có phiên phỏng vấn
                        </p>
                    )}
                </RowActionsMenu>
                <DeleteInterviewTopicDialog
                    topicId={topic.topicId}
                    open={confirmingDelete}
                    onClose={() => setConfirmingDelete(false)}
                />
            </TD>
        </TR>
    );
}
