'use client';

import { CircleAlert } from 'lucide-react';
// The file, not the `@/components/ui` barrel: this boundary loads with every page, the barrel pulls in Radix.
import { Button } from '@/components/ui/Button';
import './global.css';

export const dynamic = 'force-dynamic';

/**
 * Replaces the root layout when the layout itself throws, so it brings its own document and global styles (Next.js
 * does not carry them over). It has no access to the root layout's Geist font classes or the variant cookie: the
 * modern rules apply, on the system font stack.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi" data-ui="modern">
      <head>
        <title>Lỗi hệ thống | TalentAI</title>
      </head>
      <body className="bg-canvas text-ink antialiased">
        <main id="main-content" className="grid min-h-dvh place-items-center px-5 py-16">
          <div role="alert" className="flex w-full max-w-sm flex-col items-center text-center">
            <span className="mb-4 flex size-10 items-center justify-center rounded-card bg-surface-2 text-ink-3">
              <CircleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <h1 className="text-title text-ink">Không hiển thị được trang.</h1>
            <p className="mt-2 text-body text-ink-3">Hệ thống đang gặp lỗi tạm thời. Thử lại sau giây lát.</p>
            {error.digest && (
              <p className="mt-3 font-mono text-caption text-ink-3">Mã lỗi: {error.digest}</p>
            )}
            <Button size="lg" onClick={reset} className="mt-6">
              Thử lại
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
