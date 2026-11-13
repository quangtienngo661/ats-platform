'use client';

import type { LucideIcon } from 'lucide-react';
import { Briefcase, Building2, Mail, Phone, Trash2 } from 'lucide-react';
import { Avatar, Badge, Button, Sheet } from '@/components/ui';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';

interface RecruiterDetailModalProps {
    recruiter: IRecruiterDto;
    departmentName: string;
    /** The department's own colour (user data); empty when the recruiter has no department. */
    departmentColor: string;
    onClose: () => void;
    onEdit: (recruiter: IRecruiterDto) => void;
    onDelete: (recruiter: IRecruiterDto) => void;
}

/** The recruiter's details in a side sheet; the name of the sheet stays "Chi tiết nhà tuyển dụng". */
export function RecruiterDetailModal({
    recruiter,
    departmentName,
    departmentColor,
    onClose,
    onEdit,
    onDelete,
}: RecruiterDetailModalProps) {
    const user = recruiter.user;
    const isActive = user?.status === 'active';
    const name = user?.fullName ?? 'Chưa cập nhật';

    const rows: { icon: LucideIcon; label: string; value?: string | null }[] = [
        { icon: Mail, label: 'Email', value: user?.email },
        { icon: Phone, label: 'Số điện thoại', value: user?.phoneNumber },
        { icon: Briefcase, label: 'Chức vụ', value: recruiter.position },
        { icon: Building2, label: 'Phòng ban', value: departmentName },
    ];

    return (
        <Sheet
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title="Chi tiết nhà tuyển dụng"
        >
            <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                    <Avatar name={user?.fullName ?? '?'} size={64} />
                    <div className="min-w-0 flex-1">
                        <p className="break-words text-title-sm font-medium text-ink">{name}</p>
                        <p className="mt-0.5 break-words text-body-sm text-ink-3">
                            {recruiter.position ?? 'Chưa cập nhật chức vụ'}
                        </p>
                        <Badge tone={isActive ? 'success' : 'neutral'} className="mt-2">
                            {isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                        </Badge>
                    </div>
                </div>

                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-line">
                    <div className="min-w-0 bg-surface-2 px-4 py-3">
                        <dt className="text-caption text-ink-3">Phòng ban</dt>
                        <dd className="mt-0.5 flex min-w-0 items-center gap-1.5 text-body-sm font-medium text-ink">
                            <span
                                aria-hidden="true"
                                className="size-2 shrink-0 rounded-full bg-line-strong"
                                style={departmentColor ? { backgroundColor: departmentColor } : undefined}
                            />
                            <span className="truncate" title={departmentName}>
                                {departmentName}
                            </span>
                        </dd>
                    </div>
                    <div className="min-w-0 bg-surface-2 px-4 py-3">
                        <dt className="text-caption text-ink-3">Vai trò</dt>
                        <dd className="mt-0.5 text-body-sm font-medium text-ink">
                            {user?.role === 'admin' ? 'Admin' : 'Recruiter'}
                        </dd>
                    </div>
                </dl>

                <dl className="divide-y divide-line">
                    {rows
                        .filter((row) => row.value)
                        .map(({ icon: Icon, label, value }) => (
                            // dt and dd sit directly in the group (a valid dl); the icon lives in dt and dd is
                            // indented by the icon's width plus the gap (16 + 12 px), so the value lines up with the label.
                            <div key={label} className="py-3">
                                <dt className="flex items-center gap-3 text-caption text-ink-3">
                                    <Icon aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
                                    {label}
                                </dt>
                                <dd className="mt-0.5 break-words pl-7 text-body-sm text-ink">{value}</dd>
                            </div>
                        ))}
                </dl>

                {/* Grid, not flex-1: Button's base is shrink-0, and cn does not merge a class that fights it. */}
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                    <Button
                        variant="danger"
                        onClick={() => {
                            onDelete(recruiter);
                            onClose();
                        }}
                    >
                        <Trash2 aria-hidden="true" strokeWidth={1.75} />
                        Xóa
                    </Button>
                    <Button
                        onClick={() => {
                            onEdit(recruiter);
                            onClose();
                        }}
                    >
                        Chỉnh sửa thông tin
                    </Button>
                </div>
            </div>
        </Sheet>
    );
}
