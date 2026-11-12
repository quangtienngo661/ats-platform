import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ variant: 'modern' as 'modern' | 'legacy' }));

vi.mock('@/lib/ui-variant', () => ({ getUiVariant: async () => state.variant }));
vi.mock('next/font/google', () => {
    const font = () => ({ className: 'font', variable: '--font' });
    return { Geist: font, Geist_Mono: font, Inter: font };
});
vi.mock('sonner', () => ({ Toaster: () => null }));
vi.mock('../components/common/GlobalSocketInit', () => ({ GlobalSocketInit: () => null }));

import { generateViewport } from './layout';

beforeEach(() => {
    state.variant = 'modern';
});

describe('root layout viewport', () => {
    // Without viewport-fit=cover, env(safe-area-inset-*) stays 0 and the candidate tab bar ignores the home indicator.
    it('lets the modern UI draw under the safe areas', async () => {
        expect(await generateViewport()).toEqual({ themeColor: '#fafafa', viewportFit: 'cover' });
    });

    it('leaves the legacy UI viewport as it was', async () => {
        state.variant = 'legacy';
        expect(await generateViewport()).toEqual({ themeColor: '#fafafa' });
    });
});
