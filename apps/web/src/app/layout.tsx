import { Inter } from 'next/font/google';
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
