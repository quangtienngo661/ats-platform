'use client';

import { useId, useRef } from 'react';
import { MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    IconButton,
    Surface,
} from '@/components/ui';
import { Department } from '@/types/interfaces/departments.interface';

interface DepartmentCardProps {
    department: Department;
    organizationName?: string;
    onEdit: (dept: Department) => void;
    onDelete: (dept: Department) => void;
    onViewDetail: (id: string) => void;
}

/** Always visible on touch and narrow screens; on a wide screen with hover it shows on card hover or focus. */
const MENU_TRIGGER_VISIBILITY =
    'group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)_and_(min-width:1024px)]:opacity-0';

export function DepartmentCard({ department: dept, onEdit, onDelete, onViewDetail, organizationName }: DepartmentCardProps) {
    const nameId = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    /** Runs once the menu has closed and focus is back on its trigger, so the dialog it opens returns focus there. */
    const afterClose = useRef<(() => void) | null>(null);

    return (
        <Surface as="article" className="group flex h-full flex-col gap-3 p-4 transition-shadow duration-hover hover:shadow-e2">
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    {organizationName && (
                        <p className="mb-1 truncate text-caption text-ink-3" title={organizationName}>
                            Tổ chức: {organizationName}
                        </p>
                    )}
                    <div className="flex min-w-0 items-center gap-2">
                        {/* The department's own colour (user data) marks it across the admin screens. */}
                        <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-full bg-line-strong"
                            style={dept.color ? { backgroundColor: dept.color } : undefined}
                        />
                        <h2 id={nameId} className="min-w-0 break-words text-title-sm text-ink">
                            {dept.name}
                        </h2>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <IconButton
                            ref={triggerRef}
                            size="sm"
                            aria-label="Tùy chọn"
                            aria-describedby={nameId}
                            className={`-mr-1 -mt-1 ${MENU_TRIGGER_VISIBILITY}`}
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
                        <DropdownMenuItem onSelect={() => { afterClose.current = () => onEdit(dept); }}>
                            <Pencil aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive onSelect={() => onDelete(dept)}>
                            <Trash2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            Xóa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {dept.description && (
                <p className="line-clamp-3 break-words text-body-sm text-ink-2" title={dept.description}>
                    {dept.description}
                </p>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-caption">
                <span className="inline-flex items-center gap-1.5 text-ink-3">
                    <Users aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
                    <span>
                        <span className="tabular-nums">{dept.membersCount}</span> thành viên
                    </span>
                </span>
                <button
                    type="button"
                    onClick={() => onViewDetail(dept.departmentId)}
                    aria-describedby={nameId}
                    className="inline-flex h-6 items-center rounded-ctl font-medium text-accent-text hover:underline"
                >
                    Xem chi tiết
                </button>
            </div>
        </Surface>
    );
}
