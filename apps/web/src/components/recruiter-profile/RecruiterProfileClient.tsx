'use client';

import { useState, useActionState, useEffect, type ReactNode } from 'react';
import { Building2, Mail, Phone, Shield, Pencil, Save, Briefcase } from 'lucide-react';
import { Avatar, Badge, Button, Field, Input, PageToolbar, Surface } from '@/components/ui';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { toast } from '@/lib/toast';
import { updateMyRecruiterProfileAction, RecruiterActionState } from '@/servers/recruiters/recruiters.action';

interface RecruiterProfileClientProps {
    recruiter: IRecruiterDto;
}

function ReadOnlyRow({ icon, label, hint, children }: { icon: ReactNode; label: string; hint?: string; children: ReactNode }) {
    return (
        <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-caption text-ink-3">
                {icon}
                {label}
            </p>
            <div className="mt-1.5 min-w-0 break-words rounded-ctl bg-surface-2 px-3 py-2 text-body-sm text-ink">{children}</div>
            {hint && <p className="mt-1 text-caption text-ink-3">{hint}</p>}
        </div>
    );
}

export default function RecruiterProfileClient({ recruiter }: RecruiterProfileClientProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [position, setPosition] = useState(recruiter.position || '');

    const [state, formAction, isPending] = useActionState(updateMyRecruiterProfileAction, {
        success: false,
        message: ''
    } as RecruiterActionState);

    useEffect(() => {
        if (state && state.message) {
            if (state.success) {
                toast.success(state.message);
                setIsEditing(false);
                if (state.data?.position) {
                    setPosition(state.data.position);
                }
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    const user = recruiter.user;
    const dept = recruiter.department;

    const handleCancel = () => {
        setIsEditing(false);
        setPosition(recruiter.position || ''); // Reset lại
    };

    return (
        <div className="mx-auto w-full max-w-5xl p-4 lg:p-8">
            <PageToolbar title="Hồ sơ cá nhân" />

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="flex flex-col gap-6 lg:col-span-4">
                    <Surface className="flex flex-col items-center p-6 text-center">
                        <Avatar name={user?.fullName || 'N/A'} size={64} />
                        <h2 className="mt-4 break-words text-title font-semibold text-ink">{user?.fullName || 'N/A'}</h2>
                        <Badge tone="accent" className="mt-2 gap-1.5">
                            <Briefcase className="size-3" strokeWidth={1.75} aria-hidden="true" />
                            {position || 'Chưa cập nhật'}
                        </Badge>
                    </Surface>

                    <Surface className="p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-caption text-ink-3">Trạng thái</span>
                            <Badge tone="success">Hoạt động</Badge>
                        </div>
                        <div className="mt-4 flex items-center gap-3 rounded-ctl bg-surface-2 p-3">
                            <Shield className="size-4 shrink-0 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
                            <div className="min-w-0">
                                <p className="text-caption text-ink-3">Quyền hạn</p>
                                <p className="text-body-sm font-medium text-ink">
                                    {user?.role === 'recruiter' ? 'Nhà tuyển dụng' : user?.role === 'admin' ? 'Quản trị viên' : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </Surface>
                </div>

                <form action={formAction} className="lg:col-span-8">
                    <Surface variant="raised">
                        <div className="flex items-center justify-between gap-3 px-6 py-4">
                            <h3 className="min-w-0 text-title-sm font-semibold text-ink">
                                Thông tin liên hệ & Công việc
                            </h3>
                            {!isEditing ? (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                    <Pencil aria-hidden="true" strokeWidth={1.75} /> Chỉnh sửa
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                                        Hủy
                                    </Button>
                                    <Button type="submit" size="sm" loading={isPending}>
                                        {isPending ? 'Đang lưu…' : <><Save aria-hidden="true" strokeWidth={1.75} /> Lưu thay đổi</>}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-6 pb-6 md:grid-cols-2">
                            <ReadOnlyRow
                                icon={<Mail className="size-3.5" strokeWidth={1.75} aria-hidden="true" />}
                                label="Địa chỉ Email"
                                hint="Email dùng để đăng nhập, không thể thay đổi."
                            >
                                {user?.email || 'N/A'}
                            </ReadOnlyRow>

                            <ReadOnlyRow
                                icon={<Phone className="size-3.5" strokeWidth={1.75} aria-hidden="true" />}
                                label="Số điện thoại"
                            >
                                {user?.phoneNumber || 'Chưa cập nhật'}
                            </ReadOnlyRow>

                            <div className="md:col-span-2">
                                <ReadOnlyRow
                                    icon={<Building2 className="size-3.5" strokeWidth={1.75} aria-hidden="true" />}
                                    label="Phòng ban trực thuộc"
                                >
                                    <span className="flex items-center gap-2">
                                        {dept?.color && (
                                            <span className="size-2.5 shrink-0 rounded-full" style={{ background: dept.color }} />
                                        )}
                                        {dept?.name || 'Chưa phân bổ'}
                                    </span>
                                </ReadOnlyRow>
                            </div>

                            <div className="md:col-span-2">
                                {isEditing ? (
                                    <Field label="Chức danh hiển thị">
                                        {(f) => (
                                            <Input
                                                {...f}
                                                name="position"
                                                value={position}
                                                onChange={e => setPosition(e.target.value)}
                                                placeholder="Ví dụ: Senior IT Recruiter"
                                            />
                                        )}
                                    </Field>
                                ) : (
                                    <ReadOnlyRow
                                        icon={<Briefcase className="size-3.5" strokeWidth={1.75} aria-hidden="true" />}
                                        label="Chức danh hiển thị"
                                    >
                                        {position || 'Chưa cập nhật'}
                                    </ReadOnlyRow>
                                )}
                            </div>
                        </div>
                    </Surface>
                </form>
            </div>
        </div>
    );
}
