'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { registerAction } from '@/servers/auth/auth.action';
import { Checkbox, Field, Input } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { AuthAlert, AuthHeading, AuthSubmit, PasswordInput } from '../ui/AuthParts';

const initialState = { success: false, message: '' };

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
    return (
        <li className={cn('flex items-center gap-1.5 text-caption transition-colors', met ? 'text-success' : 'text-ink-3')}>
            <Check aria-hidden="true" strokeWidth={2} className={cn('size-3 shrink-0', met ? 'opacity-100' : 'opacity-30')} />
            {label}
            <span className="sr-only">{met ? ' (đã đạt)' : ' (chưa đạt)'}</span>
        </li>
    );
}

export default function RegisterForm() {
    const [password, setPassword] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [state, formAction] = useActionState(registerAction, initialState);

    const reqs = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
    };
    const allMet = Object.values(reqs).every(Boolean);

    return (
        <div className="motion-safe:animate-rise">
            <AuthHeading title="Tạo tài khoản" description="Đăng ký để bắt đầu hành trình của bạn" />

            <form action={formAction} className="flex flex-col gap-4">
                <Field label="Họ và tên">
                    {(f) => <Input {...f} required size="lg" name="fullName" type="text" autoComplete="name" placeholder="Nguyễn Văn A" />}
                </Field>

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
                            placeholder="your@email.com"
                        />
                    )}
                </Field>

                <div className="flex flex-col gap-2">
                    <Field label="Mật khẩu">
                        {(f) => (
                            <PasswordInput
                                {...f}
                                required
                                name="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                        )}
                    </Field>
                    {password ? (
                        <ul className="flex flex-col gap-1">
                            <PasswordRequirement met={reqs.length} label="Ít nhất 8 ký tự" />
                            <PasswordRequirement met={reqs.upper} label="Ít nhất 1 chữ hoa" />
                            <PasswordRequirement met={reqs.number} label="Ít nhất 1 chữ số" />
                            <PasswordRequirement met={reqs.symbol} label="Ít nhất 1 ký tự đặc biệt (!@#...)" />
                        </ul>
                    ) : null}
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox className="mt-0.5" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
                    <span className="text-body-sm text-ink-2">
                        Tôi đồng ý với <span className="font-medium text-ink">Điều khoản dịch vụ</span> và{' '}
                        <span className="font-medium text-ink">Chính sách bảo mật</span>
                    </span>
                </label>

                {state.message ? <AuthAlert tone={state.success ? 'success' : 'danger'}>{state.message}</AuthAlert> : null}

                <AuthSubmit disabled={!agreed || !allMet}>Tạo tài khoản</AuthSubmit>
            </form>

            <p className="mt-6 text-center text-body-sm text-ink-3">
                Đã có tài khoản?{' '}
                <Link href="/sign-in" className="font-medium text-accent-text hover:underline">
                    Đăng nhập
                </Link>
            </p>
        </div>
    );
}
