import { getUiVariant } from '@/lib/ui-variant';
import LegacyRegisterPage from '@/legacy/app/(auth)/register/page';
import RegisterForm from '@/components/auth/forms/RegisterForm';
import { AuthShell } from '@/components/auth/ui/AuthShell';

export const metadata = {
    title: 'Đăng ký | TalentAI',
    description: 'Tạo tài khoản ứng viên TalentAI',
};

export default async function RegisterPage() {
    if ((await getUiVariant()) === 'legacy') return <LegacyRegisterPage />;
    return (
        <AuthShell>
            <RegisterForm />
        </AuthShell>
    );
}
