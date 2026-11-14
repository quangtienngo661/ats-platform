'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import {
    Badge,
    Button,
    DropdownMenuSeparator,
    RowActionsItem,
    RowActionsMenu,
    TD,
    TR,
} from '@/components/ui';
import { ISkillDto } from '@/types/interfaces/skill.interface';

interface SkillRowProps {
    index: number;
    skill: ISkillDto;
    onEdit: (skill: ISkillDto) => void;
    onDelete: (skillId: string) => void;
}

export function SkillRow({ index, skill, onEdit, onDelete }: SkillRowProps) {
    const [confirming, setConfirming] = useState(false);
    const nameId = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    /** Where focus goes once the actions cell has swapped between the menu and the delete confirmation. */
    const focusNext = useRef<'cancel' | 'trigger' | null>(null);

    useEffect(() => {
        const target = focusNext.current;
        focusNext.current = null;
        if (target === 'cancel') cancelRef.current?.focus();
        if (target === 'trigger') triggerRef.current?.focus();
    }, [confirming]);

    return (
        <TR className="group">
            <TD className="w-10 tabular-nums text-ink-3">{index + 1}</TD>

            <TD>
                <p id={nameId} className="max-w-48 truncate font-medium text-ink sm:max-w-80" title={skill.name}>
                    {skill.name}
                </p>
            </TD>

            <TD>
                {skill.category ? (
                    <Badge className="max-w-40">
                        <span className="truncate" title={skill.category}>
                            {skill.category}
                        </span>
                    </Badge>
                ) : (
                    <>
                        <span aria-hidden="true" className="text-ink-4">
                            —
                        </span>
                        <span className="sr-only">Chưa phân loại</span>
                    </>
                )}
            </TD>

            <TD className="w-px whitespace-nowrap text-right">
                {confirming ? (
                    <div className="flex items-center justify-end gap-2">
                        <span className="inline-flex items-center gap-1 text-caption text-danger">
                            <AlertTriangle aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
                            Xác nhận xóa?
                        </span>
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                                onDelete(skill.skillId);
                                focusNext.current = 'trigger';
                                setConfirming(false);
                            }}
                        >
                            Xóa
                        </Button>
                        <Button
                            ref={cancelRef}
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                focusNext.current = 'trigger';
                                setConfirming(false);
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                ) : (
                    <RowActionsMenu ref={triggerRef} describedBy={nameId}>
                        <RowActionsItem afterClose={() => onEdit(skill)}>
                            <Pencil aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            Chỉnh sửa
                        </RowActionsItem>
                        <DropdownMenuSeparator />
                        <RowActionsItem
                            destructive
                            movesFocus
                            afterClose={() => {
                                focusNext.current = 'cancel';
                                setConfirming(true);
                            }}
                        >
                            <Trash2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            Xóa
                        </RowActionsItem>
                    </RowActionsMenu>
                )}
            </TD>
        </TR>
    );
}
