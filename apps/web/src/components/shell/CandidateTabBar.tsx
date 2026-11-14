'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';
import { CANDIDATE_NAV } from './site-nav';
import { isNavActive } from './staff-nav';

/**
 * The candidate's five destinations as a bottom tab bar under 768 px, clear of the home indicator. The layout
 * renders it for candidates only. It also reserves its own height at the end of the page, so the last content and
 * the footer never sit underneath it.
 */
export function CandidateTabBar() {
    const pathname = usePathname();
    return (
        <>
            <div aria-hidden="true" className="h-[calc(3.5rem+env(safe-area-inset-bottom))] shrink-0 md:hidden" />
            <nav
                aria-label="Điều hướng chính"
                data-tab-bar=""
                className={cn(
                    'fixed inset-x-0 bottom-0 z-header border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden',
                    'bg-surface/90 backdrop-blur-xl backdrop-saturate-150',
                )}
            >
                <ul className="grid grid-cols-5">
                    {CANDIDATE_NAV.map((item) => {
                        const active = isNavActive(pathname, item.href);
                        const Icon = item.icon;
                        return (
                            <li key={item.href} className="min-w-0">
                                <Link
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'relative flex h-14 select-none flex-col items-center justify-center gap-1',
                                        'text-micro [-webkit-tap-highlight-color:transparent]',
                                        'transition-[color,transform] duration-hover ease-out-expo active:scale-[.97] active:duration-press',
                                        // The current tab carries a short ink rule as well as the darker colour.
                                        active
                                            ? 'text-ink before:absolute before:left-1/2 before:top-0 before:h-0.5 before:w-5 before:-translate-x-1/2 before:rounded-b-full before:bg-ink'
                                            : 'text-ink-3',
                                    )}
                                >
                                    <Icon aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0" />
                                    {/*
                                      Not truncated: the longest label is ~76 px, a tab is 78 px at 390 and 72 px at
                                      360, where it spills a little into its short neighbours rather than lose a word.
                                    */}
                                    <span className="whitespace-nowrap tracking-tight">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </>
    );
}
