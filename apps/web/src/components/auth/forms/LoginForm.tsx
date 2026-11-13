'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signInAction } from '@/servers/auth/auth.action';
import { Field, Input } from '@/components/ui';
import { AuthAlert, AuthHeading, AuthSubmit, PasswordInput } from '../ui/AuthParts';

const initialState = { success: false, message: '' };

export default function LoginForm() {
    const [state, formAction] = useActionState(signInAction, initialState);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '';
    const resetSuccess = searchParams.get('reset') === 'success';

    return (
        <div className="motion-safe:animate-rise">
            <AuthHeading title="Chào mừng trở lại" description="Đăng nhập vào tài khoản của bạn" />

            {resetSuccess ? (
                <div className="mb-4">
                    <AuthAlert tone="success">Đặt lại mật khẩu thành công. Đăng nhập lại để tiếp tục.</AuthAlert>
                </div>
            ) : null}

            <form action={formAction} className="flex flex-col gap-4">
                <Field label="Email">
                    {(f) => (
                        <Input
                            {...f}
                            size="lg"
                            name="email"
                            required
                            type="email"
                            autoComplete="email"
                            spellCheck={false}
                            placeholder="your@email.com"
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

                <input type="hidden" name="role" value="candidate" />
                <input type="hidden" name="callbackUrl" value={callbackUrl} />

                {state.message && !state.success ? <AuthAlert>{state.message}</AuthAlert> : null}

                <AuthSubmit>Đăng nhập</AuthSubmit>
            </form>

            <p className="mt-6 text-center text-body-sm text-ink-3">
                Chưa có tài khoản?{' '}
                <Link href="/register" className="font-medium text-accent-text hover:underline">
                    Đăng ký ngay
                </Link>
            </p>
            <p className="mt-2 text-center text-caption text-ink-3">
                Là nhân viên?{' '}
                <Link href="/sign-in/admin" className="font-medium text-ink-2 hover:text-ink hover:underline">
                    Cổng nội bộ
                </Link>
            </p>
        </div>
    );
}
