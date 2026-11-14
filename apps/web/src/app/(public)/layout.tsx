import { getUiVariant } from '@/lib/ui-variant';
import { LegacyFrame } from '@/components/ui-variant/LegacyFrame';
import LegacyPublicLayout from '@/legacy/app/(public)/layout';
import type { ReactNode } from 'react';
import { CandidateTabBar } from '@/components/shell/CandidateTabBar';
import { SiteFooter } from '@/components/shell/SiteFooter';
import { SiteHeader } from '@/components/shell/SiteHeader';
import { cookies } from 'next/headers';

export const metadata = {
    title: 'TalentAI | Tìm việc làm thông minh',
    description: 'Nền tảng tuyển dụng thông minh với AI — tìm việc làm phù hợp nhanh chóng.',
};

export default async function PublicLayout({ children }: { children: ReactNode }) {
  if ((await getUiVariant()) === 'legacy') {
    return (
      <LegacyFrame>
        <LegacyPublicLayout>{children}</LegacyPublicLayout>
      </LegacyFrame>
    );
  }

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    let userInfo: { fullName?: string; role?: string, userId?: string } | null = null;
    if (token) {
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            userInfo = { fullName: payload.fullName, role: payload.role, userId: payload.sub };
        } catch { /* ignore */ }
    }

    return (
        <div className="flex min-h-dvh flex-col bg-canvas">
            <SiteHeader userInfo={userInfo} />
            <main id="main-content" className="flex flex-1 flex-col">
                {children}
            </main>
            <SiteFooter />
            {userInfo?.role === 'candidate' ? <CandidateTabBar /> : null}
        </div>
    );
}
