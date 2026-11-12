'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/** Honors the OS "reduce motion" setting for every motion/react animation in the app. */
export function MotionProvider({ children }: { children: ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
