'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Phase = 'visible' | 'pending' | 'shown';

/**
 * Reveal that waits for the element to scroll into view. Server and first client render match
 * the plain visible markup; after mount, an element below the fold is held back
 * (`data-reveal="pending"`) and rises once on first intersection. Reduced motion never hides it.
 */
export function RevealInView({
    children,
    delay = 0,
    as: Tag = 'div',
    className,
}: {
    children: ReactNode;
    delay?: number;
    as?: 'div' | 'section' | 'li';
    className?: string;
}) {
    const ref = useRef<HTMLElement | null>(null);
    const [phase, setPhase] = useState<Phase>('visible');

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        if (el.getBoundingClientRect().top <= window.innerHeight) return;

        setPhase('pending');
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setPhase('shown');
                    observer.disconnect();
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const classes = [phase === 'shown' ? 'animate-rise' : '', className ?? '']
        .filter(Boolean)
        .join(' ');

    return (
        <Tag
            ref={ref as never}
            className={classes || undefined}
            data-reveal={phase === 'visible' ? undefined : phase}
            style={{ animationDelay: `${delay}s` }}
        >
            {children}
        </Tag>
    );
}
