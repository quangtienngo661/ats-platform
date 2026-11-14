import ForgotPasswordForm from '@/legacy/components/auth/forms/ForgotPasswordForm';
import { AuthShell } from '@/legacy/components/auth/ui/AuthShell';

export const metadata = {
    title: 'Quên mật khẩu | TalentAI',
    description: 'Đặt lại mật khẩu tài khoản TalentAI',
};

export default function ForgotPasswordPage() {
    return (
        <AuthShell showTerms={false}>
            <ForgotPasswordForm />
        </AuthShell>
    );
}
