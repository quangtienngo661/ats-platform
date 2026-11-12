'use client';

import * as m from 'motion/react-m';
import { Children, createElement, isValidElement, type ReactNode } from 'react';
import { duration, ease, fadeRise, staggerDelay } from '@/lib/motion';

const containers = { div: 'div', ul: 'ul', ol: 'ol' } as const;
const motionTags: Record<string, unknown> = { div: m.div, li: m.li, section: m.section, article: m.article };

/**
 * Fades its children in one after another (spec §6). Only the first 8 animate; the rest render
 * as they are. A child that is a `div`/`li`/`section`/`article` keeps its own props and becomes
 * the matching `m.*` element; any other child is wrapped in `m.li` (lists) or `m.div`.
 */
export function Stagger({
    children,
    as = 'div',
    className,
}: {
    children: ReactNode;
    as?: 'div' | 'ul' | 'ol';
    className?: string;
}) {
    const Container = containers[as];
    return (
        <Container className={className}>
            {Children.toArray(children).map((child, i) => {
                const delay = staggerDelay(i);
                if (delay === null || !isValidElement(child)) return child;
                const animation = {
                    variants: fadeRise,
                    initial: 'hidden',
                    animate: 'show',
                    transition: { duration: duration.base, ease: ease.out, delay },
                };
                const tag = typeof child.type === 'string' ? motionTags[child.type] : undefined;
                if (tag) {
                    return createElement(tag as never, {
                        ...(child.props as object),
                        key: child.key,
                        ...animation,
                    });
                }
                const Wrapper = as === 'div' ? m.div : m.li;
                return (
                    <Wrapper key={child.key ?? i} {...animation}>
                        {child}
                    </Wrapper>
                );
            })}
        </Container>
    );
}
