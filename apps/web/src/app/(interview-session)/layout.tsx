import { getUiVariant } from '@/lib/ui-variant';
import { LegacyFrame } from '@/components/ui-variant/LegacyFrame';
import LegacyInterviewSessionLayout from '@/legacy/app/(interview-session)/layout';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeTokenPayload } from '@/lib/decodeTokenPayload';
export default async function InterviewSessionLayout({ children }: { children: ReactNode }) {
  if ((await getUiVariant()) === 'legacy') {
    return (
      <LegacyFrame>
        <LegacyInterviewSessionLayout>{children}</LegacyInterviewSessionLayout>
      </LegacyFrame>
    );
  }

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
        <main id="main-content" className="h-screen w-screen overflow-hidden bg-[#F5F5F7]">
            {children}
        </main>
    );
}
