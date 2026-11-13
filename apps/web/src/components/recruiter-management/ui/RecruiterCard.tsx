'use client';

import { useId, useRef } from 'react';
import { Mail, MoreHorizontal, Pencil, Phone, Trash2 } from 'lucide-react';
import {
    Avatar,
    Badge,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    IconButton,
    Surface,
} from '@/components/ui';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';

interface RecruiterCardProps {
    recruiter: IRecruiterDto;
    departmentName: string;
    /** The department's own colour (user data); empty when the recruiter has no department. */
    departmentColor: string;
    onEdit: (recruiter: IRecruiterDto) => void;
    onDelete: (recruiter: IRecruiterDto) => void;
    onViewDetail: (id: string) => void;
}

/** Always visible on touch and narrow screens; on a wide screen with hover it shows on card hover or focus. */
const MENU_TRIGGER_VISIBILITY =
    'group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)_and_(min-width:1024px)]:opacity-0';

export function RecruiterCard({
    recruiter,
    departmentName,
    departmentColor,
    onEdit,
    onDelete,
    onViewDetail,
}: RecruiterCardProps) {
    const user = recruiter.user;
    const isActive = user?.status === 'active';
    const name = user?.fullName ?? 'Chưa cập nhật';
    const position = recruiter.position ?? 'Chưa cập nhật vị trí';
    const nameId = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    /** Runs once the menu has closed and focus is back on its trigger, so the dialog it opens returns focus there. */
    const afterClose = useRef<(() => void) | null>(null);

    return (
        <Surface as="article" className="group flex h-full flex-col gap-3 p-4 transition-shadow duration-hover hover:shadow-e2">
            <div className="flex items-start gap-3">
                <Avatar name={user?.fullName ?? '?'} size={40} />
                <div className="min-w-0 flex-1">
                    <h2 id={nameId} className="truncate text-body-sm font-medium text-ink" title={name}>
                        {name}
                    </h2>
                    <p className="truncate text-caption text-ink-3" title={position}>
                        {position}
                    </p>
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
                        <DropdownMenuItem onSelect={() => { afterClose.current = () => onEdit(recruiter); }}>
                            <Pencil aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive onSelect={() => onDelete(recruiter)}>
                            <Trash2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            Xóa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <Badge tone={isActive ? 'success' : 'neutral'}>{isActive ? 'Đang hoạt động' : 'Không hoạt động'}</Badge>
                <Badge className="max-w-full gap-1.5">
                    <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full bg-line-strong"
                        style={departmentColor ? { backgroundColor: departmentColor } : undefined}
                    />
                    <span className="min-w-0 truncate" title={departmentName}>
                        {departmentName}
                    </span>
                </Badge>
            </div>

            {(user?.email || user?.phoneNumber) && (
                <ul className="space-y-1 text-caption text-ink-2">
                    {user?.email && (
                        <li className="flex min-w-0 items-center gap-2">
                            <Mail aria-hidden="true" strokeWidth={1.75} className="size-3.5 shrink-0 text-ink-3" />
                            <span className="truncate" title={user.email}>
                                {user.email}
                            </span>
                        </li>
                    )}
                    {user?.phoneNumber && (
                        <li className="flex min-w-0 items-center gap-2">
                            <Phone aria-hidden="true" strokeWidth={1.75} className="size-3.5 shrink-0 text-ink-3" />
                            <span className="truncate tabular-nums">{user.phoneNumber}</span>
                        </li>
                    )}
                </ul>
            )}

            <div className="mt-auto flex justify-end border-t border-line pt-3">
                <button
                    type="button"
                    onClick={() => onViewDetail(recruiter.recruiterId)}
                    aria-describedby={nameId}
                    className="inline-flex h-6 items-center rounded-ctl text-caption font-medium text-accent-text hover:underline"
                >
                    Xem chi tiết
                </button>
            </div>
        </Surface>
    );
}
