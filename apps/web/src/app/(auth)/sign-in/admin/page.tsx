import StaffLoginForm from '@/components/auth/forms/StaffLoginForm';
import { StaffAuthShell } from '@/components/auth/ui/StaffAuthShell';
import { Suspense } from 'react';

export const metadata = {
    title: 'Cổng nội bộ | TalentAI',
    description: 'Đăng nhập dành cho Admin và Recruiter của TalentAI',
};

interface Props {
    searchParams: Promise<{ isRoleDifferent?: string }>;
}

export default async function StaffSignInPage({ searchParams }: Props) {
    const { isRoleDifferent } = await searchParams;
    return (
        <StaffAuthShell>
            <Suspense fallback={null}>
                <StaffLoginForm isRoleDifferent={isRoleDifferent === 'true' ? true : false} />
            </Suspense>
        </StaffAuthShell>
    );
}
