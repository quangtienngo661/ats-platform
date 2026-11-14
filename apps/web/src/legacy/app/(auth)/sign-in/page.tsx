import LoginForm from '@/legacy/components/auth/forms/LoginForm';
import { AuthShell } from '@/legacy/components/auth/ui/AuthShell';
import { Suspense } from 'react';

export const metadata = {
    title: 'Đăng nhập | TalentAI',
    description: 'Đăng nhập vào tài khoản TalentAI của bạn',
};

export default function SignInPage() {
    return (
        <AuthShell>
            {/* LoginForm uses useSearchParams → needs Suspense */}
            <Suspense fallback={null}>
                <LoginForm />
            </Suspense>
        </AuthShell>
    );
}
