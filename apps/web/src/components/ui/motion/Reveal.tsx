'use client';

import * as m from 'motion/react-m';
import type { ReactNode } from 'react';
import { duration, ease, fadeRise } from '@/lib/motion';

const tags = { div: m.div, section: m.section, li: m.li } as const;

export function Reveal({
    children,
    delay = 0,
    as = 'div',
    className,
}: {
    children: ReactNode;
    delay?: number;
    as?: 'div' | 'section' | 'li';
    className?: string;
}) {
    const Tag = tags[as];
    return (
        <Tag
            className={className}
            variants={fadeRise}
            initial="hidden"
            animate="show"
            transition={{ duration: duration.base, ease: ease.out, delay }}
        >
            {children}
        </Tag>
    );
}
