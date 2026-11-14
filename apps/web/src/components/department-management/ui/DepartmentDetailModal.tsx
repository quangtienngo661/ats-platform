'use client';

import { Mail, Phone, UserPlus, Users } from 'lucide-react';
import { UserRole } from '@ats-platform/types';
import { Avatar, Badge, Button, EmptyState, ROW_ACTION_REVEAL, Sheet } from '@/components/ui';
import { Department, DepartmentMember } from '@/types/interfaces/departments.interface';

interface DepartmentDetailModalProps {
    department: Department;
    onClose: () => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
    admin: 'Quản trị viên',
    org_admin: 'Quản trị tổ chức',
    recruiter: 'Tuyển dụng',
    candidate: 'Ứng viên',
};

/** Revealed like a row's "Tùy chọn": always on touch and narrow screens, on row hover or focus on a wide screen. */
const CONTACT_LINK = `inline-flex size-8 items-center justify-center rounded-ctl text-ink-3 transition duration-hover hover:bg-ink/5 hover:text-ink ${ROW_ACTION_REVEAL}`;

function MemberRow({ member }: { member: DepartmentMember }) {
    return (
        <li className="group flex items-center gap-3 rounded-ctl px-2 py-2 transition-colors duration-hover hover:bg-surface-2">
            <Avatar name={member.fullName} size={40} />

            <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium text-ink" title={member.fullName}>
                    {member.fullName}
                </p>
                <div className="mt-0.5 flex min-w-0 items-center gap-2">
                    <p className="truncate text-caption text-ink-3">{member.position ?? 'Chưa cập nhật vị trí'}</p>
                    <Badge className="shrink-0">{ROLE_LABEL[member.role]}</Badge>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
                {member.email && (
                    <a
                        href={`mailto:${member.email}`}
                        aria-label={`Gửi email cho ${member.fullName}`}
                        title={member.email}
                        className={CONTACT_LINK}
                    >
                        <Mail aria-hidden="true" strokeWidth={1.75} className="size-4" />
                    </a>
                )}
                {member.phoneNumber && (
                    <a
                        href={`tel:${member.phoneNumber}`}
                        aria-label={`Gọi ${member.fullName}`}
                        title={member.phoneNumber}
                        className={CONTACT_LINK}
                    >
                        <Phone aria-hidden="true" strokeWidth={1.75} className="size-4" />
                    </a>
                )}
            </div>
        </li>
    );
}

function MemberGroup({ label, members }: { label: string; members: DepartmentMember[] }) {
    if (members.length === 0) return null;
    return (
        <section>
            <h3 className="mb-1 text-caption text-ink-3">
                {label} · <span className="tabular-nums">{members.length}</span>
            </h3>
            <ul className="space-y-0.5">
                {members.map((m) => (
                    <MemberRow key={m.recruiterId} member={m} />
                ))}
            </ul>
        </section>
    );
}

/** The department and its members in a side sheet; the name of the sheet stays "Chi tiết phòng ban". */
export function DepartmentDetailModal({ department, onClose }: DepartmentDetailModalProps) {
    const activeMembers = department.members.filter((m) => m.status === 'active');
    const inactiveMembers = department.members.filter((m) => m.status === 'inactive');

    const stats = [
        { label: 'Thành viên', value: department.membersCount },
        { label: 'Đang hoạt động', value: activeMembers.length },
        { label: 'Tin tuyển dụng', value: department.membersCount },
    ];

    return (
        <Sheet
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title="Chi tiết phòng ban"
            width="lg"
        >
            <div className="flex flex-col gap-5">
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                        <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-full bg-line-strong"
                            style={department.color ? { backgroundColor: department.color } : undefined}
                        />
                        <p className="min-w-0 break-words text-title-sm font-medium text-ink">{department.name}</p>
                    </div>
                    {department.description && (
                        <p className="mt-1 break-words text-body-sm text-ink-3">{department.description}</p>
                    )}
                </div>

                <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-card bg-line">
                    {stats.map((stat) => (
                        <div key={stat.label} className="min-w-0 bg-surface-2 px-3 py-3">
                            <dt className="truncate text-caption text-ink-3">{stat.label}</dt>
                            <dd className="mt-0.5 text-title-sm tabular-nums text-ink">{stat.value}</dd>
                        </div>
                    ))}
                </dl>

                {department.members.length === 0 ? (
                    <EmptyState icon={Users} title="Chưa có thành viên nào" />
                ) : (
                    <div className="space-y-4">
                        <MemberGroup label="Đang hoạt động" members={activeMembers} />
                        <MemberGroup label="Không hoạt động" members={inactiveMembers} />
                    </div>
                )}

                <Button size="lg" className="w-full">
                    <UserPlus aria-hidden="true" strokeWidth={1.75} />
                    Thêm thành viên
                </Button>
            </div>
        </Sheet>
    );
}
