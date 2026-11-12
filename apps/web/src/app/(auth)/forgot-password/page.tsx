import { getUiVariant } from '@/lib/ui-variant';
import LegacyForgotPasswordPage from '@/legacy/app/(auth)/forgot-password/page';
import ForgotPasswordForm from '@/components/auth/forms/ForgotPasswordForm';
import { AuthShell } from '@/components/auth/ui/AuthShell';

export const metadata = {
    title: 'Quên mật khẩu | TalentAI',
    description: 'Đặt lại mật khẩu tài khoản TalentAI',
};

export default async function ForgotPasswordPage() {
    if ((await getUiVariant()) === 'legacy') return <LegacyForgotPasswordPage />;
    return (
        <AuthShell showTerms={false}>
            <ForgotPasswordForm />
        </AuthShell>
    );
}
