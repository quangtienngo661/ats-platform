import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Reveal } from './Reveal';

describe('Reveal', () => {
    it('renders the chosen element with animate-rise and the delay', () => {
        const { container } = render(
            <Reveal as="section" delay={0.12} className="x">
                hello
            </Reveal>,
        );
        const el = container.firstElementChild as HTMLElement;
        expect(el.tagName).toBe('SECTION');
        expect(el).toHaveClass('animate-rise', 'x');
        expect(el.style.animationDelay).toBe('0.12s');
    });

    it('is visible in the server render (no inline opacity 0)', () => {
        const html = renderToString(<Reveal>hello</Reveal>);
        expect(html).toContain('hello');
        expect(html).toContain('animate-rise');
        expect(html).not.toMatch(/opacity\s*:\s*0/);
    });
});

describe('Reveal inView', () => {
    let callback: IntersectionObserverCallback;
    const observe = vi.fn();
    const disconnect = vi.fn();
    let reduced = false;
    let top = 2000;

    beforeEach(() => {
        reduced = false;
        top = 2000;
        observe.mockClear();
        disconnect.mockClear();
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                constructor(cb: IntersectionObserverCallback) {
                    callback = cb;
                }
                observe = observe;
                disconnect = disconnect;
            },
        );
        vi.stubGlobal('matchMedia', (query: string) => ({
            matches: reduced && query.includes('prefers-reduced-motion'),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }));
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
            () => ({ top }) as DOMRect,
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('waits below the fold, then rises once it intersects and stops observing', () => {
        const { container } = render(
            <Reveal inView delay={0.1} className="x">
                hello
            </Reveal>,
        );
        const el = container.firstElementChild as HTMLElement;
        expect(el).toHaveAttribute('data-reveal', 'pending');
        expect(el).not.toHaveClass('animate-rise');
        expect(observe).toHaveBeenCalledWith(el);

        act(() => {
            callback(
                [{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry],
                {} as IntersectionObserver,
            );
        });
        expect(el).toHaveAttribute('data-reveal', 'shown');
        expect(el).toHaveClass('animate-rise', 'x');
        expect(el.style.animationDelay).toBe('0.1s');
        expect(disconnect).toHaveBeenCalled();
    });

    it('stays visible without animation when already in the viewport at mount', () => {
        top = 100;
        const { container } = render(<Reveal inView>hello</Reveal>);
        const el = container.firstElementChild as HTMLElement;
        expect(el).not.toHaveAttribute('data-reveal', 'pending');
        expect(el).not.toHaveClass('animate-rise');
        expect(observe).not.toHaveBeenCalled();
    });

    it('never hides under reduced motion', () => {
        reduced = true;
        const { container } = render(<Reveal inView>hello</Reveal>);
        const el = container.firstElementChild as HTMLElement;
        expect(el).not.toHaveAttribute('data-reveal', 'pending');
        expect(observe).not.toHaveBeenCalled();
    });

    it('reveals an element that ended up above the viewport while pending', () => {
        const { container } = render(<Reveal inView>hello</Reveal>);
        const el = container.firstElementChild as HTMLElement;
        expect(el).toHaveAttribute('data-reveal', 'pending');
        act(() => {
            callback(
                [
                    {
                        isIntersecting: false,
                        boundingClientRect: { top: -500 },
                        target: el,
                    } as unknown as IntersectionObserverEntry,
                ],
                {} as IntersectionObserver,
            );
        });
        expect(el).toHaveAttribute('data-reveal', 'shown');
        expect(disconnect).toHaveBeenCalled();
    });

    it('keeps waiting while below the viewport and not intersecting', () => {
        const { container } = render(<Reveal inView>hello</Reveal>);
        const el = container.firstElementChild as HTMLElement;
        act(() => {
            callback(
                [
                    {
                        isIntersecting: false,
                        boundingClientRect: { top: 900 },
                        target: el,
                    } as unknown as IntersectionObserverEntry,
                ],
                {} as IntersectionObserver,
            );
        });
        expect(el).toHaveAttribute('data-reveal', 'pending');
    });

    it('disconnects the observer when unmounted while pending', () => {
        const { unmount } = render(<Reveal inView>hello</Reveal>);
        expect(disconnect).not.toHaveBeenCalled();
        unmount();
        expect(disconnect).toHaveBeenCalled();
    });

    it('never goes pending without IntersectionObserver', () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const { container } = render(<Reveal inView>hello</Reveal>);
        const el = container.firstElementChild as HTMLElement;
        expect(el).not.toHaveAttribute('data-reveal');
    });

    it('is visible in the server render', () => {
        const html = renderToString(<Reveal inView>hello</Reveal>);
        expect(html).toContain('hello');
        expect(html).not.toContain('data-reveal="pending"');
        expect(html).not.toContain('animate-rise');
        expect(html).not.toMatch(/opacity\s*:\s*0/);
    });
});
