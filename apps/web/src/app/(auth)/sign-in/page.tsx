import { getUiVariant } from '@/lib/ui-variant';
import LegacySignInPage from '@/legacy/app/(auth)/sign-in/page';
import LoginForm from '@/components/auth/forms/LoginForm';
import { AuthShell } from '@/components/auth/ui/AuthShell';
import { Suspense } from 'react';

export const metadata = {
    title: 'Đăng nhập | TalentAI',
    description: 'Đăng nhập vào tài khoản TalentAI của bạn',
};

export default async function SignInPage() {
    if ((await getUiVariant()) === 'legacy') return <LegacySignInPage />;
    return (
        <AuthShell>
            {/* LoginForm uses useSearchParams → needs Suspense */}
            <Suspense fallback={null}>
                <LoginForm />
            </Suspense>
        </AuthShell>
    );
}
