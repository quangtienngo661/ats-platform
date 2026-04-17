import VerifyEmailView from '@/components/auth/forms/VerifyEmailView';
import { AuthShell } from '@/components/auth/ui/AuthShell';

export const metadata = {
    title: 'Xác thực email | TalentAI',
    description: 'Xác thực địa chỉ email tài khoản TalentAI',
};

interface VerifyEmailPageProps {
    searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
    const { email } = await searchParams;

    return (
        <AuthShell showTerms={false}>
            <VerifyEmailView email={email} />
        </AuthShell>
    );
}
