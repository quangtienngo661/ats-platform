'use client';

import { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleCheck, Mail } from 'lucide-react';
import { forgotPasswordAction, requestEmailVerificationAction } from '@/servers/auth/auth.action';
import { toast } from '@/lib/toast';
import { Button, Field, Input } from '@/components/ui';
import { AuthHeading, AuthSubmit } from '../ui/AuthParts';

const initialState = { success: false, message: '' };

export default function ForgotPasswordForm() {
    const [emailValue, setEmailValue] = useState('');
    const [state, formAction] = useActionState(forgotPasswordAction, initialState);
    const [resendState, resendFormAction] = useActionState(requestEmailVerificationAction, initialState);
    const [cooldown, setCooldown] = useState(0);

    // Xử lý kết quả gửi email lần đầu
    useEffect(() => {
        if (state.success === false && state.message !== '') {
            toast.error("Lỗi!", state.message);
        } else if (state.success) {
            toast.success("Thành công!", state.message);
            setCooldown(60);
        }
    }, [state]);

    // Xử lý kết quả gửi lại email
    useEffect(() => {
        if (resendState.success === false && resendState.message !== '') {
            toast.error("Lỗi!", resendState.message);
        } else if (resendState.success) {
            toast.success("Đã gửi lại!", resendState.message);
            setCooldown(60);
        }
    }, [resendState]);

    // Đếm ngược cooldown
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    return (
        <div className="motion-safe:animate-rise">
            {!state.success ? (
                <>
                    <AuthHeading title="Quên mật khẩu?" description="Nhập email để nhận liên kết đặt lại mật khẩu." />

                    <form action={formAction} className="flex flex-col gap-4">
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
                                    value={emailValue}
                                    onChange={(e) => setEmailValue(e.target.value)}
                                />
                            )}
                        </Field>
                        <AuthSubmit>Gửi liên kết đặt lại</AuthSubmit>
                    </form>
                </>
            ) : (
                <div>
                    <CircleCheck aria-hidden="true" strokeWidth={1.75} className="mb-4 size-7 text-success" />
                    <AuthHeading
                        title="Đã gửi email"
                        description={
                            <>
                                Kiểm tra hộp thư <span className="font-medium text-ink">{emailValue}</span> để lấy liên kết đặt lại mật
                                khẩu. Liên kết có hiệu lực trong 24 giờ.
                            </>
                        }
                    />
                    <p className="mb-4 text-caption text-ink-3">Không thấy email? Kiểm tra thư mục spam hoặc gửi lại.</p>
                    <form action={resendFormAction}>
                        <input type="hidden" name="email" value={emailValue} />
                        <input type="hidden" name="type" value="reset" />
                        <Button type="submit" variant="secondary" size="lg" disabled={cooldown > 0} className="w-full">
                            <Mail aria-hidden="true" strokeWidth={1.75} />
                            {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại email'}
                        </Button>
                    </form>
                </div>
            )}

            <div className="mt-6 border-t border-line pt-5">
                <Link href="/sign-in" className="flex items-center justify-center gap-1.5 text-body-sm text-ink-2 hover:text-ink">
                    <ArrowLeft aria-hidden="true" strokeWidth={1.75} className="size-3.5" /> Quay về đăng nhập
                </Link>
            </div>
        </div>
    );
}
