'use client';

import { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signInAction } from '@/servers/auth/auth.action';
import { toast } from '@/lib/toast';
import { Field, Input } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { AuthAlert, AuthHeading, AuthSubmit, PasswordInput } from '../ui/AuthParts';

const initialState = { success: false, message: '' };

type StaffRole = 'admin' | 'org_admin' | 'recruiter';

const ROLES: { id: StaffRole; label: string }[] = [
    { id: 'org_admin', label: 'Org' },
    { id: 'admin', label: 'Admin' },
    { id: 'recruiter', label: 'Recruiter' },
];

export default function StaffLoginForm({ isRoleDifferent }: { isRoleDifferent?: boolean }) {
    const [role, setRole] = useState<StaffRole>('admin');
    const [state, formAction] = useActionState(signInAction, initialState);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '';

    const activeRole = ROLES.find((r) => r.id === role) ?? ROLES[0];

    useEffect(() => {
        if (isRoleDifferent) {
            toast.info("Bạn được điều hướng khi cố gắng đăng nhập tài khoản quản trị")
        }
    }, [isRoleDifferent])

    return (
        <div className="motion-safe:animate-rise">
            <AuthHeading title="Cổng nội bộ" description="Dành riêng cho nhân sự TalentAI" />

            {/* Buttons with aria-pressed, not radios: the role is chosen before the form, not submitted as a field. */}
            <div className="mb-5 grid grid-cols-3 gap-0.5 rounded-ctl bg-surface-2 p-0.5">
                {ROLES.map((r) => {
                    const isActive = role === r.id;
                    return (
                        <button
                            key={r.id}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => setRole(r.id)}
                            className={cn(
                                'h-9 rounded-ctl text-body-sm transition duration-press ease-out-expo',
                                isActive ? 'bg-surface font-medium text-ink shadow-e2' : 'text-ink-3 hover:text-ink',
                            )}
                        >
                            {r.label}
                        </button>
                    );
                })}
            </div>

            <form action={formAction} className="flex flex-col gap-4">
                <input type="hidden" name="role" value={role} />
                <input type="hidden" name="callbackUrl" value={callbackUrl} />

                <Field label="Email">
                    {(f) => (
                        <Input
                            {...f}
                            required
                            size="lg"
                            name="email"
                            type="email"
                            autoComplete="email"
                            spellCheck={false}
                            placeholder="staff@talentai.vn"
                        />
                    )}
                </Field>

                <div className="flex flex-col gap-2">
                    <Field label="Mật khẩu">
                        {(f) => <PasswordInput {...f} required name="password" autoComplete="current-password" placeholder="••••••••" />}
                    </Field>
                    <Link href="/forgot-password" className="self-end text-caption text-accent-text hover:underline">
                        Quên mật khẩu?
                    </Link>
                </div>

                {state.message && !state.success ? <AuthAlert>{state.message}</AuthAlert> : null}

                <AuthSubmit>Đăng nhập với tư cách {activeRole.label}</AuthSubmit>
            </form>

            <p className="mt-6 text-center text-body-sm text-ink-3">
                Không phải nhân viên?{' '}
                <Link href="/sign-in" className="font-medium text-accent-text hover:underline">
                    Đăng nhập thông thường
                </Link>
            </p>
        </div>
    );
}
