import type { ReactNode } from 'react';

/**
 * Fades and lifts its content in with a CSS animation (`animate-rise`). The server HTML is
 * already visible, so it never waits for hydration; reduced motion is handled in global.css.
 */
export function Reveal({
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
    return (
        <Tag
            className={className ? `animate-rise ${className}` : 'animate-rise'}
            style={{ animationDelay: `${delay}s` }}
        >
            {children}
        </Tag>
    );
}
