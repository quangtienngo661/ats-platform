'use client';

import { useId } from 'react';
import { Pencil, Trash2, Users } from 'lucide-react';
import { DropdownMenuItem, DropdownMenuSeparator, RowActionsItem, RowActionsMenu, Surface } from '@/components/ui';
import { Department } from '@/types/interfaces/departments.interface';

interface DepartmentCardProps {
    department: Department;
    organizationName?: string;
    onEdit: (dept: Department) => void;
    onDelete: (dept: Department) => void;
    onViewDetail: (id: string) => void;
}

export function DepartmentCard({ department: dept, onEdit, onDelete, onViewDetail, organizationName }: DepartmentCardProps) {
    const nameId = useId();

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

                <RowActionsMenu describedBy={nameId} triggerClassName="-mr-1 -mt-1">
                    <RowActionsItem afterClose={() => onEdit(dept)}>
                        <Pencil aria-hidden="true" strokeWidth={1.75} className="size-4" />
                        Chỉnh sửa
                    </RowActionsItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onSelect={() => onDelete(dept)}>
                        <Trash2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
                        Xóa
                    </DropdownMenuItem>
                </RowActionsMenu>
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
