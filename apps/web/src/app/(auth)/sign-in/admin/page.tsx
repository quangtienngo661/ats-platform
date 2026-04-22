import StaffLoginForm from '@/components/auth/forms/StaffLoginForm';
import { StaffAuthShell } from '@/components/auth/ui/StaffAuthShell';
import { Suspense } from 'react';

export const metadata = {
    title: 'Cổng nội bộ | TalentAI',
    description: 'Đăng nhập dành cho Admin và Recruiter của TalentAI',
};

export default function StaffSignInPage() {
    return (
        <StaffAuthShell>
            <Suspense fallback={null}>
                <StaffLoginForm />
            </Suspense>
        </StaffAuthShell>
    );
}
