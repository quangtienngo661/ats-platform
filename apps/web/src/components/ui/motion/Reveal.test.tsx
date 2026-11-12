import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
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
