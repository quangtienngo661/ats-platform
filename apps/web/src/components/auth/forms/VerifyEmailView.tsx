'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleCheck, RefreshCw } from 'lucide-react';
import { requestEmailVerificationAction } from '@/servers/auth/auth.action';
import { Button } from '@/components/ui';
import { AuthAlert, AuthHeading } from '../ui/AuthParts';

const initialState = { success: false, message: '' };

interface VerifyEmailViewProps {
    email?: string | null;
}

const STEPS = [
    'Kiểm tra hộp thư đến của bạn',
    'Nhấp vào liên kết xác thực trong email',
    'Hoàn tất và bắt đầu sử dụng TalentAI',
];

export default function VerifyEmailView({ email }: VerifyEmailViewProps) {
    const [state, formAction] = useActionState(requestEmailVerificationAction, initialState);
    const [lastEmail] = useState(email ?? '');

    return (
        <div className="motion-safe:animate-rise">
            <AuthHeading
                title="Xác thực email của bạn"
                description={
                    <>
                        Chúng tôi đã gửi email xác thực đến{' '}
                        {lastEmail ? <span className="font-medium text-ink">{lastEmail}</span> : 'địa chỉ email của bạn'}.
                    </>
                }
            />

            <ol className="mb-6 flex flex-col gap-3 rounded-card bg-surface-2 p-4">
                {STEPS.map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-body-sm text-ink">
                        <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-micro text-surface">
                            {i + 1}
                        </span>
                        {step}
                    </li>
                ))}
            </ol>

            <form action={formAction} className="flex flex-col gap-3">
                <input type="hidden" name="email" value={lastEmail} />
                <input type="hidden" name="type" value="verify" />
                <Button type="submit" variant="secondary" size="lg" className="w-full">
                    {state.success ? (
                        <>
                            <CircleCheck aria-hidden="true" strokeWidth={1.75} className="text-success" /> Đã gửi lại
                        </>
                    ) : (
                        <>
                            <RefreshCw aria-hidden="true" strokeWidth={1.75} /> Gửi lại email
                        </>
                    )}
                </Button>
                {state.message && !state.success ? <AuthAlert>{state.message}</AuthAlert> : null}
            </form>

            <p className="mt-6 text-center text-caption text-ink-3">
                Email chưa đến sau vài phút? Kiểm tra thư mục spam hoặc{' '}
                <Link href="/forgot-password" className="font-medium text-accent-text hover:underline">
                    liên hệ hỗ trợ
                </Link>
                .
            </p>

            <div className="mt-5 border-t border-line pt-5">
                <Link href="/sign-in" className="flex items-center justify-center gap-1.5 text-body-sm text-ink-2 hover:text-ink">
                    <ArrowLeft aria-hidden="true" strokeWidth={1.75} className="size-3.5" /> Quay về đăng nhập
                </Link>
            </div>
        </div>
    );
}
