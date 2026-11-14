import RegisterForm from '@/legacy/components/auth/forms/RegisterForm';
import { AuthShell } from '@/legacy/components/auth/ui/AuthShell';

export const metadata = {
    title: 'Đăng ký | TalentAI',
    description: 'Tạo tài khoản ứng viên TalentAI',
};

export default function RegisterPage() {
    return (
        <AuthShell>
            <RegisterForm />
        </AuthShell>
    );
}
