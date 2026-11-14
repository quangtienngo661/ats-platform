import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const recorded = vi.hoisted(() => ({
    config: undefined as Record<string, unknown> | undefined,
    lazy: undefined as Record<string, unknown> | undefined,
}));

vi.mock('motion/react', () => ({
    domAnimation: { marker: 'domAnimation' },
    domMax: { marker: 'domMax' },
    MotionConfig: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
        recorded.config = props;
        return <>{props.children}</>;
    },
    LazyMotion: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
        recorded.lazy = props;
        return <>{props.children}</>;
    },
}));

import { MotionProvider } from './MotionProvider';

describe('MotionProvider', () => {
    // domMax, not domAnimation: only domMax carries the layout feature that `layoutId` indicators need to slide.
    it('honors the OS reduced-motion setting and lazy-loads the full, non-strict feature set', () => {
        render(
            <MotionProvider>
                <p>child</p>
            </MotionProvider>,
        );
        expect(screen.getByText('child')).toBeInTheDocument();
        expect(recorded.config?.reducedMotion).toBe('user');
        expect(recorded.lazy?.features).toEqual({ marker: 'domMax' });
        expect(recorded.lazy?.strict).toBeFalsy();
    });
});
