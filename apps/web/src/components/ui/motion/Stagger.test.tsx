import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stagger } from './Stagger';

describe('Stagger', () => {
    it('animates the first 8 children with a stepped delay and leaves the rest static', () => {
        render(
            <Stagger as="ul">
                {Array.from({ length: 10 }, (_, i) => (
                    <li key={i} className={`row-${i}`}>
                        item {i}
                    </li>
                ))}
            </Stagger>,
        );
        const items = screen.getAllByRole('listitem');
        expect(items.map((el) => el.textContent)).toEqual(
            Array.from({ length: 10 }, (_, i) => `item ${i}`),
        );
        const delays = ['0s', '0.04s', '0.08s', '0.12s', '0.16s', '0.2s', '0.24s', '0.28s'];
        delays.forEach((delay, i) => {
            expect(items[i]).toHaveClass('animate-rise', `row-${i}`);
            expect(items[i].style.animationDelay).toBe(delay);
        });
        for (const i of [8, 9]) {
            expect(items[i]).not.toHaveClass('animate-rise');
            expect(items[i]).toHaveClass(`row-${i}`);
            expect(items[i].style.animationDelay).toBe('');
        }
    });

    it('keeps the child own style and wraps component children', () => {
        const Row = () => <span>row</span>;
        render(
            <Stagger as="ul">
                <li style={{ color: 'red' }}>a</li>
                <Row />
            </Stagger>,
        );
        const items = screen.getAllByRole('listitem');
        expect(items[0].style.color).toBe('red');
        expect(items[0].style.animationDelay).toBe('0s');
        expect(items[1]).toHaveClass('animate-rise');
        expect(items[1].style.animationDelay).toBe('0.04s');
        expect(items[1]).toHaveTextContent('row');
    });
});
