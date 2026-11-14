import Link from 'next/link';

/** The old footer's links that lead somewhere, renamed to match the header. Its icon placeholders led nowhere. */
const LINKS = [
    { href: '/job-postings', label: 'Tìm việc' },
    { href: '/my-applications', label: 'Đơn của tôi' },
    { href: '/profile', label: 'Hồ sơ' },
    // The staff sign-in page; the candidate one would only bounce a recruiter there after they typed their password.
    { href: '/sign-in/admin', label: 'Đăng nhập HR' },
] as const;

/** The quiet footer of public pages: one row from 768 px, the copyright and the links. */
export function SiteFooter() {
    return (
        <footer className="border-t border-line">
            <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-6 text-caption text-ink-3 md:flex-row md:items-center md:justify-between lg:px-6">
                <p>© 2026 TalentAI</p>
                <nav aria-label="Liên kết chân trang">
                    <ul className="flex flex-wrap gap-x-5 gap-y-2">
                        {LINKS.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className="inline-flex min-h-6 items-center rounded-ctl transition-colors duration-hover hover:text-ink"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </footer>
    );
}
