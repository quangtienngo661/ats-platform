import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './global.css';
import { cookies } from 'next/headers';
import { GlobalSocketInit } from '../components/common/GlobalSocketInit';
import { MotionProvider } from '../components/common/MotionProvider';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata = {
  title: 'TalentAI | ATS Platform',
  description: 'Hệ thống quản lý tuyển dụng thông minh',
};

export const viewport = {
  themeColor: '#F5F5F7',
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-[13px] focus:text-[#0071E3] focus:shadow-lg focus:outline focus:outline-2 focus:outline-[#0071E3]"
        >
          Bỏ qua tới nội dung chính
        </a>
        <GlobalSocketInit userId={userInfo?.userId || ''} token={token || ''} />
        <MotionProvider>{children}</MotionProvider>
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
