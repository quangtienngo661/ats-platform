import { BrandMark } from '@/components/shell/BrandMark';
import { ButtonLink } from '@/components/ui';

/**
 * The 404 for unknown URLs and `notFound()`. It renders inside the root layout only, with no group shell, so it
 * brings its own header and the page's one `<main>`. Font and colours are set here too: under the legacy UI the
 * body carries neither.
 */
export default function NotFound() {
    return (
        <div className="flex min-h-dvh flex-col bg-canvas font-sans text-ink antialiased">
            <header className="px-5 pt-5 sm:px-8">
                <div className="flex h-9 items-center">
                    <BrandMark />
                </div>
            </header>
            <main id="main-content" className="flex flex-1 items-center justify-center px-5 pb-24 pt-12">
                <div className="flex w-full max-w-md flex-col items-center text-center motion-safe:animate-rise">
                    <p aria-hidden="true" className="text-display font-normal tabular-nums text-ink-4">
                        404
                    </p>
                    <h1 className="mt-4 text-heading text-ink">Không tìm thấy trang</h1>
                    <p className="mt-2 text-body text-ink-3">Đường dẫn có thể sai hoặc trang đã bị gỡ.</p>
                    <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <ButtonLink href="/" size="lg">
                            Về trang chủ
                        </ButtonLink>
                        <ButtonLink href="/job-postings" variant="secondary" size="lg">
                            Tìm việc
                        </ButtonLink>
                    </div>
                </div>
            </main>
        </div>
    );
}
