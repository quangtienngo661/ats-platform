import { getUiVariant } from '@/lib/ui-variant';
import LegacyVerificationSuccessPage from '@/legacy/app/(auth)/verification-success/page';
import VerificationSuccessView from '@/components/auth/VerificationSuccessView';
import { AuthShell } from '@/components/auth/ui/AuthShell';

export const metadata = {
    title: 'Xác thực thành công | TalentAI',
    description: 'Email của bạn đã được xác thực thành công. Đăng nhập để bắt đầu sử dụng TalentAI.',
};

export default async function VerificationSuccessPage() {
    if ((await getUiVariant()) === 'legacy') return <LegacyVerificationSuccessPage />;
    return (
        <AuthShell showTerms={false}>
            <VerificationSuccessView />
        </AuthShell>
    );
}
