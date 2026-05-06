import VerificationSuccessView from '@/components/auth/VerificationSuccessView';
import { AuthShell } from '@/components/auth/ui/AuthShell';

export const metadata = {
    title: 'Xác thực thành công | TalentAI',
    description: 'Email của bạn đã được xác thực thành công. Đăng nhập để bắt đầu sử dụng TalentAI.',
};

export default function VerificationSuccessPage() {
    return (
        <AuthShell showTerms={false}>
            <VerificationSuccessView />
        </AuthShell>
    );
}
