'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CircleCheck } from 'lucide-react';
import { resetPasswordAction } from '@/servers/auth/auth.action';
import { ButtonLink, Field } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { AuthAlert, AuthHeading, AuthSubmit, PasswordInput } from '../ui/AuthParts';

const initialState = { success: false, message: '' };

interface ResetPasswordFormProps {
    token: string;
}

const STRENGTH = [
    { label: '', bar: 'bg-line' },
    { label: 'Yếu', bar: 'bg-danger' },
    { label: 'Trung bình', bar: 'bg-warning' },
    { label: 'Tốt', bar: 'bg-accent' },
    { label: 'Mạnh', bar: 'bg-success' },
];

function StrengthBar({ score }: { score: number }) {
    return (
        <div className="mt-1">
            <div className="mb-1 flex gap-1" aria-hidden="true">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= score ? STRENGTH[score].bar : 'bg-line')} />
                ))}
            </div>
            <p className="text-caption text-ink-3">Độ mạnh: {STRENGTH[score].label}</p>
        </div>
    );
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [state, formAction] = useActionState(resetPasswordAction, initialState);

    const reqs = [
        { met: password.length >= 8, label: 'Ít nhất 8 ký tự' },
        { met: /[A-Z]/.test(password), label: 'Ít nhất 1 chữ hoa' },
        { met: /[0-9]/.test(password), label: 'Ít nhất 1 chữ số' },
        { met: /[^A-Za-z0-9]/.test(password), label: 'Ít nhất 1 ký tự đặc biệt' },
    ];
    const score = reqs.filter((r) => r.met).length;
    const pwMatch = password === confirmPassword && confirmPassword !== '';
    const canSubmit = score === reqs.length && pwMatch;

    return (
        <div className="motion-safe:animate-rise">
            {!state.success ? (
                <>
                    <AuthHeading title="Đặt lại mật khẩu" description="Tạo mật khẩu mới cho tài khoản của bạn." />

                    <form action={formAction} className="flex flex-col gap-4">
                        <input type="hidden" name="token" value={token} />

                        <div className="flex flex-col gap-2">
                            <Field label="Mật khẩu mới">
                                {(f) => (
                                    <PasswordInput
                                        {...f}
                                        required
                                        name="password"
                                        autoComplete="new-password"
                                        placeholder="Nhập mật khẩu mới"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                )}
                            </Field>
                            {password ? (
                                <>
                                    <StrengthBar score={score} />
                                    <ul className="flex flex-col gap-1">
                                        {reqs.map(({ met, label }) => (
                                            <li key={label} className={cn('flex items-center gap-1.5 text-caption', met ? 'text-success' : 'text-ink-3')}>
                                                <Check aria-hidden="true" strokeWidth={2} className={cn('size-3 shrink-0', met ? 'opacity-100' : 'opacity-30')} />
                                                {label}
                                                <span className="sr-only">{met ? ' (đã đạt)' : ' (chưa đạt)'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : null}
                        </div>

                        <Field
                            label="Xác nhận mật khẩu"
                            error={confirmPassword && !pwMatch ? 'Mật khẩu không khớp. Nhập lại.' : undefined}
                            hint={confirmPassword && pwMatch ? 'Mật khẩu khớp.' : undefined}
                        >
                            {(f) => (
                                <PasswordInput
                                    {...f}
                                    required
                                    toggleSubject="xác nhận"
                                    autoComplete="new-password"
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            )}
                        </Field>

                        {state.message && !state.success ? <AuthAlert>{state.message}</AuthAlert> : null}

                        <AuthSubmit disabled={!canSubmit}>Đặt lại mật khẩu</AuthSubmit>
                    </form>

                    <div className="mt-6 border-t border-line pt-5">
                        <Link href="/sign-in" className="flex items-center justify-center gap-1.5 text-body-sm text-ink-2 hover:text-ink">
                            <ArrowLeft aria-hidden="true" strokeWidth={1.75} className="size-3.5" /> Quay về đăng nhập
                        </Link>
                    </div>
                </>
            ) : (
                <div>
                    <CircleCheck aria-hidden="true" strokeWidth={1.75} className="mb-4 size-7 text-success" />
                    <AuthHeading
                        title="Đã đặt lại mật khẩu"
                        description="Mọi phiên đăng nhập cũ đã bị thu hồi. Đăng nhập bằng mật khẩu mới."
                    />
                    <ButtonLink href="/sign-in" size="lg" className="w-full">
                        Đăng nhập
                    </ButtonLink>
                </div>
            )}
        </div>
    );
}
