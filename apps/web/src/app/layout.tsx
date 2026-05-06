import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './global.css';
import { cookies } from 'next/headers';
import { GlobalSocketInit } from './GlobalSocketInit';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata = {
  title: 'TalentAI | ATS Platform',
  description: 'Hệ thống quản lý tuyển dụng thông minh',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  let userInfo: { fullName?: string; role?: string, userId?: string } | null = null;
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userInfo = { fullName: payload.fullName, role: payload.role, userId: payload.userId };
    } catch { /* ignore */ }
  }

  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <GlobalSocketInit userId={userInfo?.userId || ''} token={token || ''} />
        {children}
        <Toaster
          richColors
          closeButton
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-sf), -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontSize: '13px',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
