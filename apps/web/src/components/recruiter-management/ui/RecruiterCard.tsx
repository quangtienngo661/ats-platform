'use client';

import { useId } from 'react';
import { Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import {
    Avatar,
    Badge,
    DropdownMenuItem,
    DropdownMenuSeparator,
    RowActionsItem,
    RowActionsMenu,
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

                <RowActionsMenu describedBy={nameId} triggerClassName="-mr-1 -mt-1">
                    <RowActionsItem afterClose={() => onEdit(recruiter)}>
                        <Pencil aria-hidden="true" strokeWidth={1.75} className="size-4" />
                        Chỉnh sửa
                    </RowActionsItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onSelect={() => onDelete(recruiter)}>
                        <Trash2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
                        Xóa
                    </DropdownMenuItem>
                </RowActionsMenu>
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
