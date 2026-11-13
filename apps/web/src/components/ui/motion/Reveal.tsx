import type { ReactNode } from 'react';
import { RevealInView } from './RevealInView';

/**
 * Fades and lifts its content in with a CSS animation (`animate-rise`). The server HTML is
 * already visible, so it never waits for hydration; reduced motion is handled in global.css.
 */
export function Reveal({
    children,
    delay = 0,
    as: Tag = 'div',
    className,
    inView = false,
}: {
    children: ReactNode;
    delay?: number;
    as?: 'div' | 'section' | 'li';
    className?: string;
    /** Wait until the element scrolls into view before rising (for sections below the fold). */
    inView?: boolean;
}) {
    if (inView) {
        return (
            <RevealInView delay={delay} as={Tag} className={className}>
                {children}
            </RevealInView>
        );
    }
    return (
        <Tag
            className={className ? `animate-rise ${className}` : 'animate-rise'}
            style={{ animationDelay: `${delay}s` }}
        >
            {children}
        </Tag>
    );
}
