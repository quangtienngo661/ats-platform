'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
    Badge,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    IconButton,
    TD,
    TR,
} from '@/components/ui';
import { ISkillDto } from '@/types/interfaces/skill.interface';

/** Always visible on touch and narrow screens; on a wide screen with hover it shows on row hover or focus. */
const MENU_TRIGGER_VISIBILITY =
    'group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)_and_(min-width:1024px)]:opacity-0';

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
    /** Runs once the menu has closed and focus is back on its trigger, so a dialog it opens returns focus there. */
    const afterClose = useRef<(() => void) | null>(null);
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
                            <DropdownMenuItem onSelect={() => { afterClose.current = () => onEdit(skill); }}>
                                <Pencil aria-hidden="true" strokeWidth={1.75} className="size-4" />
                                Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                destructive
                                onSelect={() => {
                                    afterClose.current = () => {
                                        focusNext.current = 'cancel';
                                        setConfirming(true);
                                    };
                                }}
                            >
                                <Trash2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
                                Xóa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </TD>
        </TR>
    );
}
