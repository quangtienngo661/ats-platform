import { getUiVariant } from '@/lib/ui-variant';
import LegacyResetPasswordPage from '@/legacy/app/(auth)/reset-password/page';
import ResetPasswordForm from '@/components/auth/forms/ResetPasswordForm';
import { AuthShell } from '@/components/auth/ui/AuthShell';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { AuthHeading } from '@/components/auth/ui/AuthParts';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Đặt lại mật khẩu | TalentAI',
    description: 'Tạo mật khẩu mới cho tài khoản TalentAI',
};

interface ResetPasswordPageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
    if ((await getUiVariant()) === 'legacy') return <LegacyResetPasswordPage searchParams={searchParams} />;
    const { token } = await searchParams;

    return (
        <AuthShell showTerms={false}>
            {token ? (
                <ResetPasswordForm token={token} />
            ) : (
                /* No token → invalid link */
                <div className="motion-safe:animate-rise">
                    <span className="mb-5 flex size-10 items-center justify-center rounded-card bg-danger-soft text-danger">
                        <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <AuthHeading
                        title="Link không hợp lệ"
                        description="Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới."
                    />
                    <ButtonLink href="/forgot-password" size="lg" className="w-full">
                        Yêu cầu link mới
                    </ButtonLink>
                    <div className="mt-5 border-t border-line pt-5">
                        <Link href="/sign-in" className="flex items-center justify-center gap-1.5 text-body-sm text-ink-2 hover:text-ink">
                            <ArrowLeft aria-hidden="true" strokeWidth={1.75} className="size-3.5" /> Quay về đăng nhập
                        </Link>
                    </div>
                </div>
            )}
        </AuthShell>
    );
}
