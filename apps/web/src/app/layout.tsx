import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './global.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata = {
  title: 'TalentAI | ATS Platform',
  description: 'Hệ thống quản lý tuyển dụng thông minh',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
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
