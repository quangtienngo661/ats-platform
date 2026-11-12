'use client';

import { LazyMotion, MotionConfig, domMax } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Loads the animation features lazily and honors the OS "reduce motion" setting.
 * `domMax`, not `domAnimation`: only `domMax` carries the layout feature, without which `layoutId` indicators
 * (Tabs, Segmented) jump instead of sliding.
 * Not `strict`: existing code still uses `motion.*`, which must keep working next to `m.*`.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
    return (
        <LazyMotion features={domMax}>
            <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </LazyMotion>
    );
}
