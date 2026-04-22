import type { ReactNode } from 'react';
import { PublicHeader } from '@/components/public/layout/PublicHeader';
import { cookies } from 'next/headers';

export const metadata = {
    title: 'TalentAI | Tìm việc làm thông minh',
    description: 'Nền tảng tuyển dụng thông minh với AI — tìm việc làm phù hợp nhanh chóng.',
};

export default async function PublicLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    let userInfo: { fullName?: string; role?: string } | null = null;
    if (token) {
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            userInfo = { fullName: payload.fullName, role: payload.role };
        } catch { /* ignore */ }
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
            <PublicHeader userInfo={userInfo} />
            <main className="flex flex-col flex-grow pt-[60px]">
                {children}
            </main>
        </div>
    );
}
