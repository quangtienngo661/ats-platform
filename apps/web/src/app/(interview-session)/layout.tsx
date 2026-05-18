import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeTokenPayload } from '@/lib/decodeTokenPayload';
export default async function InterviewSessionLayout({ children }: { children: ReactNode }) {
    // Vẫn kiểm tra auth
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value || '';
    if (!token) redirect('/sign-in');

    try {
        const payload = decodeTokenPayload(token);
        if (!payload) redirect('/sign-in');
    } catch {
        redirect('/sign-in');
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-[#F5F5F7]">
            {children}
        </div>
    );
}
